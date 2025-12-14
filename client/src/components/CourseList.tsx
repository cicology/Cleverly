import type { Course } from "../types";
import { Clock3, CalendarClock } from "lucide-react";

const subjectColors: Record<Course["subject"], string> = {
  Calculus: "#5de0e6",
  Mechanics: "#f6ad55",
  Physics: "#9f7aea",
  "Linear Algebra": "#63b3ed",
  Statistics: "#68d391",
  Other: "#e2e8f0"
};

type Props = {
  courses: Course[];
  view: "grid" | "list";
};

export function CourseList({ courses, view }: Props) {
  if (!courses || courses.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p className="muted">No courses yet. Create your first course to get started!</p>
      </div>
    );
  }

  return (
    <div className={view === "grid" ? "course-grid" : "course-list"}>
      {courses.map((course) => {
        const subjColor = subjectColors[course.subject] || "#9aa3b3";
        return (
          <div key={course.id} className={`course-card glass ${view === "list" ? "list" : ""}`}>
            <div className="card-title">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="subject-dot" style={{ background: subjColor }} />
                <div>
                  <strong>{course.title}</strong>
                  <p className="muted">
                    {course.university} • {course.code}
                  </p>
                </div>
              </div>
              <span className={`status ${course.status}`}>
                {course.status}
                {course.progress != null && course.status === "grading" ? ` ${Math.round(course.progress * 100)}%` : ""}
              </span>
            </div>

            <div className="muted" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Clock3 size={14} />
              <span>{course.duration}</span>
              {course.nextTestDate && (
                <span className="pill muted" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <CalendarClock size={14} /> {course.nextTestDate}
                </span>
              )}
              {course.lastOpened && <span className="muted">Last opened {course.lastOpened}</span>}
            </div>

            {course.topics && course.topics.length > 0 && (
              <div className="chips" style={{ marginTop: 10 }}>
                {course.topics.map((topic, idx) => (
                  <span className="tag" key={topic.name || idx}>
                    {topic.name}
                  </span>
                ))}
              </div>
            )}

            {course.progress != null && (
              <div className="progress" style={{ marginTop: 10 }}>
                <div className="progress-bar" style={{ width: `${Math.round(course.progress * 100)}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CourseList;
