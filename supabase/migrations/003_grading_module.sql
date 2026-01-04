-- Graders (exam/test containers)
create table if not exists public.graders (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  total_marks integer,
  status text default 'draft', -- 'draft', 'ready', 'grading', 'completed'
  test_file_path text,
  memo_file_path text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Rubrics (extracted from memo)
create table if not exists public.rubrics (
  id uuid primary key default uuid_generate_v4(),
  grader_id uuid references public.graders(id) on delete cascade not null,
  question_number text not null,
  question_text text,
  expected_answer text not null,
  keywords text[] default '{}',
  max_marks float not null,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- Student submissions
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  grader_id uuid references public.graders(id) on delete cascade not null,
  student_identifier text,
  file_path text not null,
  total_score float,
  max_possible_score float,
  percentage float,
  status text default 'pending', -- 'pending', 'processing', 'graded', 'flagged', 'reviewed'
  feedback_summary text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Individual question grades
create table if not exists public.submission_grades (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  rubric_id uuid references public.rubrics(id) on delete cascade not null,
  marks_awarded float not null,
  ai_reasoning text,
  confidence_score float default 1.0, -- 0.0 to 1.0
  is_overridden boolean default false,
  override_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_graders_course on public.graders(course_id);
create index if not exists idx_rubrics_grader on public.rubrics(grader_id);
create index if not exists idx_submissions_grader on public.submissions(grader_id);
create index if not exists idx_submission_grades_submission on public.submission_grades(submission_id);
create index if not exists idx_submissions_status on public.submissions(status);

-- RLS Policies
alter table public.graders enable row level security;
alter table public.rubrics enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_grades enable row level security;

drop policy if exists "Users can CRUD own graders" on public.graders;
create policy "Users can CRUD own graders"
  on public.graders for all
  using (
    course_id in (
      select id from public.courses where user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own rubrics" on public.rubrics;
create policy "Users can CRUD own rubrics"
  on public.rubrics for all
  using (
    grader_id in (
      select g.id from public.graders g
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own submissions" on public.submissions;
create policy "Users can CRUD own submissions"
  on public.submissions for all
  using (
    grader_id in (
      select g.id from public.graders g
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can CRUD own submission grades" on public.submission_grades;
create policy "Users can CRUD own submission grades"
  on public.submission_grades for all
  using (
    submission_id in (
      select s.id from public.submissions s
      join public.graders g on s.grader_id = g.id
      join public.courses c on g.course_id = c.id
      where c.user_id = auth.uid()
    )
  );
