-- Create function for vector similarity search on course embeddings
-- This function is used by the RAG service to find relevant content chunks
-- based on semantic similarity to a query embedding

create or replace function match_course_embeddings(
  query_embedding vector(768),
  course_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content_chunk text,
  similarity float
)
language sql stable
as $$
  select
    ce.id,
    ce.content_chunk,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.course_embeddings ce
  join public.course_files cf on ce.course_file_id = cf.id
  where cf.course_id = match_course_embeddings.course_id
  order by ce.embedding <=> query_embedding
  limit match_count;
$$;
