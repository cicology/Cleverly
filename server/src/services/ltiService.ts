import { Provider } from "ltijs";
import { SequelizeDB } from "ltijs-sequelize";
import { randomUUID } from "crypto";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

const lti = Provider;
let initialized = false;

type LtiContextInfo = {
  platformIssuer?: string;
  clientId?: string;
  deploymentId?: string;
  contextId?: string;
  contextTitle?: string;
  resourceLinkId?: string;
};

function parseDbUrl(dbUrl: string) {
  try {
    const parsed = new URL(dbUrl);
    return {
      database: parsed.pathname.replace(/^\//, ""),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      host: parsed.hostname,
      port: Number(parsed.port || "5432"),
      ssl: env.ltiDbSsl
    };
  } catch {
    return null;
  }
}

function extractLtiContext(token: any): LtiContextInfo {
  const contextClaim =
    token?.platformContext ??
    token?.context ??
    token?.["https://purl.imsglobal.org/spec/lti/claim/context"];
  const resourceClaim =
    token?.resourceLink ??
    token?.resource ??
    token?.["https://purl.imsglobal.org/spec/lti/claim/resource_link"];
  const deploymentId =
    token?.deploymentId ??
    token?.["https://purl.imsglobal.org/spec/lti/claim/deployment_id"];
  const platformIssuer = token?.iss ?? token?.platform?.url;
  const clientId = token?.clientId ?? token?.azp ?? (Array.isArray(token?.aud) ? token?.aud?.[0] : token?.aud);

  return {
    platformIssuer,
    clientId,
    deploymentId,
    contextId: contextClaim?.id ?? contextClaim?.contextId,
    contextTitle: contextClaim?.title ?? contextClaim?.label,
    resourceLinkId: resourceClaim?.id ?? resourceClaim?.resourceId
  };
}

function extractLtiEmail(token: any): string | null {
  return (
    token?.email ??
    token?.user?.email ??
    token?.["https://purl.imsglobal.org/spec/lti/claim/email"] ??
    null
  );
}

async function registerPlatformIfConfigured(): Promise<void> {
  if (!env.ltiPlatformUrl || !env.ltiClientId || !env.ltiAuthEndpoint || !env.ltiTokenEndpoint || !env.ltiKeysetUrl) {
    return;
  }

  try {
    await lti.registerPlatform({
      url: env.ltiPlatformUrl,
      name: env.ltiPlatformName || env.ltiPlatformUrl,
      clientId: env.ltiClientId,
      authenticationEndpoint: env.ltiAuthEndpoint,
      accesstokenEndpoint: env.ltiTokenEndpoint,
      authConfig: {
        method: "JWK_SET",
        key: env.ltiKeysetUrl
      },
      authServer: env.ltiAuthServer || undefined
    } as any);
  } catch (error) {
    console.warn("[lti] Platform registration failed:", error);
  }
}

export async function initializeLtiServer(): Promise<void> {
  if (!env.ltiEnabled || initialized) return;

  if (!env.ltiKey || !env.ltiDbUrl || !env.ltiToolUrl) {
    console.warn("[lti] LTI is enabled but LTI_KEY, LTI_DB_URL, or LTI_TOOL_URL is missing.");
    return;
  }

  const dbConfig = parseDbUrl(env.ltiDbUrl);
  if (!dbConfig?.database) {
    console.warn("[lti] Unable to parse LTI_DB_URL.");
    return;
  }

  const db = new SequelizeDB(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: "postgres",
    logging: false,
    dialectOptions: dbConfig.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined
  });

  await lti.setup(
    env.ltiKey,
    { plugin: db },
    {
      appUrl: env.ltiToolUrl,
      loginUrl: "/lti/login",
      keysetUrl: "/lti/keys",
      devMode: env.nodeEnv !== "production",
      cookies: {
        secure: env.nodeEnv === "production",
        sameSite: env.ltiCookieSameSite
      }
    }
  );

  lti.app?.get("/lti/health", (_req: any, res: any) => res.json({ ok: true }));

  lti.onConnect(async (token: any, _req: any, res: any) => {
    const context = extractLtiContext(token);
    const launchId = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("lti_launches").insert({
      launch_id: launchId,
      platform_issuer: context.platformIssuer,
      client_id: context.clientId,
      deployment_id: context.deploymentId,
      context_id: context.contextId,
      context_title: context.contextTitle,
      resource_link_id: context.resourceLinkId,
      launch_payload: token,
      expires_at: expiresAt
    });

    if (error) {
      console.error("[lti] Failed to store launch:", error);
      return res.status(500).send("LTI launch failed.");
    }

    if (env.ltiAutoCreateByEmail) {
      const email = extractLtiEmail(token);
      if (email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("email", email)
          .maybeSingle();

        if (profile?.id && context.platformIssuer && context.clientId) {
          const linkQuery = supabase
            .from("lti_course_links")
            .select("*")
            .eq("platform_issuer", context.platformIssuer)
            .eq("client_id", context.clientId);

          if (context.contextId) {
            linkQuery.eq("context_id", context.contextId);
          } else {
            linkQuery.is("context_id", null);
          }

          if (context.resourceLinkId) {
            linkQuery.eq("resource_link_id", context.resourceLinkId);
          } else {
            linkQuery.is("resource_link_id", null);
          }

          const { data: existingLink } = await linkQuery.maybeSingle();
          let linkedCourseId = existingLink?.course_id ?? null;

          if (!existingLink) {
            const title = context.contextTitle || "LTI Course";
            const { data: course } = await supabase
              .from("courses")
              .insert({
                title,
                description: "Imported via LTI",
                user_id: profile.id
              })
              .select()
              .single();

            if (course?.id) {
              linkedCourseId = course.id;
              await supabase.from("lti_course_links").insert({
                platform_issuer: context.platformIssuer,
                client_id: context.clientId,
                context_id: context.contextId,
                resource_link_id: context.resourceLinkId,
                course_id: linkedCourseId,
                user_id: profile.id
              });
            }
          }

          if (linkedCourseId) {
            await supabase
              .from("lti_launches")
              .update({
                course_id: linkedCourseId,
                user_id: profile.id,
                claimed_at: new Date().toISOString()
              })
              .eq("launch_id", launchId);
          }
        }
      }
    }

    const redirectUrl = new URL("/lti/launch", env.clientUrl);
    redirectUrl.searchParams.set("launch_id", launchId);
    return res.redirect(redirectUrl.toString());
  });

  await registerPlatformIfConfigured();
  await lti.deploy({ port: env.ltiPort });

  initialized = true;
  console.log(`[lti] LTI server listening on port ${env.ltiPort}`);
}
