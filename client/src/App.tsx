import { useMemo, useState } from "react";
import "./App.css";
import { useCourses, useCreateCourse } from "./hooks/useApi";
import CourseModal from "./components/CourseModal";
import CourseList from "./components/CourseList";
import RubricTable from "./components/RubricTable";
import GradingDashboard from "./components/GradingDashboard";
import AuthModal from "./components/AuthModal";
import UserMenu from "./components/UserMenu";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Rocket, Sparkles, UploadCloud, LogIn } from "lucide-react";
import { isAuthEnabled } from "./lib/supabase";
import type { Course, Topic } from "./types";
import type { BackendCourse } from "./services/apiService";
import { useAppStore } from "./stores/appStore";

// Helper function to transform backend courses to frontend format
function transformCourse(backendCourse: BackendCourse): Course {
  // Convert string[] topics to Topic[] format
  const topics: Topic[] = (backendCourse.topics || []).map((topicName) => ({
    name: topicName,
    subtopics: []
  }));

  return {
    id: backendCourse.id,
    title: backendCourse.title,
    university: "University", // Backend doesn't have this field yet
    code: "COURSE", // Backend doesn't have this field yet
    duration: "Semester", // Backend doesn't have this field yet
    topics,
    status: "processing", // Can be enhanced based on actual backend status
    subject: "Other",
    progress: 0
  };
}

function AppContent() {
  // Use React Query for courses
  const { data: backendCourses = [], isLoading: coursesLoading } = useCourses();
  const createCourseMutation = useCreateCourse();

  // Keep Zustand store for demo data (rubric, submissions, grades)
  const { rubric, submissions, grades, upsertRubric, addSubmission, overrideGrade } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filter, setFilter] = useState<"active" | "upcoming" | "recent" | "all">("active");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Auth hook
  const { isAuthenticated } = useAuth();

  // Transform backend courses to frontend format
  const courses = useMemo(() => backendCourses.map(transformCourse), [backendCourses]);

  const stats = useMemo(
    () => [
      { label: "Courses", value: courses.length, hint: "Topics indexed for RAG" },
      { label: "Graders", value: 3, hint: "Tests with extracted memos" },
      { label: "Submissions", value: submissions.length, hint: "Handwritten PDFs queued" }
    ],
    [courses.length, submissions.length]
  );

  const sortedCourses = useMemo(() => {
    const statusRank: Record<string, number> = { grading: 0, ready: 1, processing: 2, pending: 3 };
    const arr = [...courses].sort((a, b) => {
      const rankA = statusRank[a.status] ?? 4;
      const rankB = statusRank[b.status] ?? 4;
      if (rankA !== rankB) return rankA - rankB;
      const dateA = a.nextTestDate ? new Date(a.nextTestDate).getTime() : Infinity;
      const dateB = b.nextTestDate ? new Date(b.nextTestDate).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      return (b.progress ?? 0) - (a.progress ?? 0);
    });

    if (filter === "active") return arr.filter((c) => c.status === "grading" || c.status === "ready");
    if (filter === "upcoming") return arr.filter((c) => c.nextTestDate);
    if (filter === "recent") return arr.slice(0, 4);
    return arr;
  }, [courses, filter]);

  return (
    <div className="app-shell">
      {/* Header with auth */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {isAuthEnabled && (
          <>
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <button className="btn secondary" onClick={() => setShowAuthModal(true)}>
                <LogIn size={16} /> Sign In
              </button>
            )}
          </>
        )}
      </div>

      <div className="hero">
        <div>
          <p className="pill">Cleverly AI Test Management</p>
          <h1>Build, extract, and mark assessments with Gemini + Supabase.</h1>
          <p className="muted">
            Upload study guides to auto-extract topics, generate rubrics from memos, and grade handwritten scripts with
            RAG-backed prompts.
          </p>
          <div className="hero-actions">
            <button className="btn" onClick={() => setShowModal(true)}>
              <Rocket size={16} /> Create course
            </button>
            <button className="btn secondary" onClick={() => addSubmission("New student upload")}>
              <UploadCloud size={16} /> Upload submissions
            </button>
          </div>
        </div>
        <div className="glass card" style={{ maxWidth: 320 }}>
          <div className="card-title">
            <strong>Gemini pipeline</strong>
            <span className="tag">Live</span>
          </div>
          <p className="muted">RAG context, memo extraction, and AI scoring in one flow.</p>
          <div className="grid" style={{ gap: 10 }}>
            <div className="stat-card">
              <p className="muted">Embeddings</p>
              <strong>768-d vectors</strong>
            </div>
            <div className="stat-card">
              <p className="muted">Queue</p>
              <strong>Redis + BullMQ</strong>
            </div>
            <div className="stat-card">
              <p className="muted">Exports</p>
              <strong>PDF / Excel</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card glass">
            <p className="muted">{s.label}</p>
            <h2 style={{ margin: "4px 0" }}>{s.value}</h2>
            <p className="muted">{s.hint}</p>
          </div>
        ))}
      </div>

      <section className="section glass" style={{ marginTop: 16 }}>
        <div className="card-title">
          <div>
            <p className="pill">Courses</p>
            <h3>Course library</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="view-toggle">
              <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>
                Grid
              </button>
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
                List
              </button>
            </div>
            <button className="btn secondary" onClick={() => setShowModal(true)}>
              <Sparkles size={16} /> Auto-extract topics
            </button>
          </div>
        </div>
        <div className="filter-row">
          {["active", "upcoming", "recent", "all"].map((key) => (
            <button
              key={key}
              className={`filter-pill ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key as any)}
            >
              {key === "active" && "Active"}
              {key === "upcoming" && "Upcoming"}
              {key === "recent" && "Recent"}
              {key === "all" && "All"}
            </button>
          ))}
        </div>
        {coursesLoading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p className="muted">Loading courses...</p>
          </div>
        ) : (
          <CourseList courses={sortedCourses} view={view} />
        )}
      </section>

      <section className="grid" style={{ marginTop: 16, gridTemplateColumns: "1fr 1fr" }}>
        <div className="glass section">
          <div className="card-title">
            <div>
              <p className="pill">Grader Builder</p>
              <h3>Upload test & memo</h3>
            </div>
            <button className="btn secondary">
              <UploadCloud size={16} /> Drop PDF
            </button>
          </div>
          <p className="muted">
            Gemini Vision ingests both PDFs, extracts question + memo pairs, and renders an editable rubric below.
          </p>
          <RubricTable rubric={rubric} onChange={upsertRubric} />
        </div>

        <GradingDashboard submissions={submissions} grades={grades} onOverride={overrideGrade} />
      </section>

      {showModal && (
        <CourseModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreate={(payload) => {
            // Transform Topic[] to string[] for backend
            const topicNames = payload.topics.map((t) => t.name);

            createCourseMutation.mutate({
              title: payload.title,
              description: `${payload.university} - ${payload.code}`,
              topics: topicNames
            });
            setShowModal(false);
          }}
        />
      )}

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

// Main App component wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
