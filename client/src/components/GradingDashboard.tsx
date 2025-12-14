import { useMemo, useState } from "react";
import type { Submission, QuestionGrade } from "../types";
import { ArrowRight, CheckCircle2, Flag, Loader2, FileDown, AlertTriangle, Navigation } from "lucide-react";

type Props = {
  submissions: Submission[];
  grades: Record<string, QuestionGrade[]>;
  onOverride: (submissionId: string, question: string, score: number) => void;
};

export function GradingDashboard({ submissions, grades, onOverride }: Props) {
  const [activeId, setActiveId] = useState(submissions[0]?.id);
  const active = useMemo(() => submissions.find((s) => s.id === activeId), [activeId, submissions]);
  const activeGrades = grades[activeId ?? ""] ?? [];
  const activeIndex = submissions.findIndex((s) => s.id === activeId);
  const queue = [
    { label: "Uploads", percent: 0.8, status: "Syncing" },
    { label: "Embedding", percent: 0.45, status: "Processing" },
    { label: "Grading queue", percent: 0.35, status: "Queued" }
  ];

  const goPrev = () => {
    if (activeIndex > 0) setActiveId(submissions[activeIndex - 1].id);
  };
  const goNext = () => {
    if (activeIndex >= 0 && activeIndex < submissions.length - 1) setActiveId(submissions[activeIndex + 1].id);
  };

  return (
    <div className="card glass grading-shell">
      <div className="card-title">
        <div>
          <p className="pill">AI Assisted Marker</p>
          <h3>Split-screen grading</h3>
        </div>
        <button className="btn secondary">
          <FileDown size={16} /> Export PDF
        </button>
      </div>

      <div className="dashboard">
        <div className="glass section">
          <div className="card-title">
            <strong>Submissions</strong>
            <span className="muted">{submissions.length} uploads</span>
          </div>
          <div className="grid">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                className="card"
                style={{
                  borderColor: sub.id === activeId ? "rgba(93,224,230,0.4)" : "rgba(255,255,255,0.08)",
                  background: sub.id === activeId ? "rgba(93,224,230,0.12)" : "transparent"
                }}
                onClick={() => setActiveId(sub.id)}
              >
                <div className="card-title">
                  <div>
                    <strong>{sub.student}</strong>
                    <p className="muted">{sub.status === "graded" ? "Completed" : "Waiting"}</p>
                  </div>
                  <span className={`status ${sub.status}`}>
                    {sub.status === "graded" ? <CheckCircle2 size={14} /> : <Loader2 size={14} />} {sub.status}
                  </span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${Math.min((sub.total / sub.max) * 100, 100)}%` }} />
                </div>
              </button>
            ))}
          </div>

          <div className="queue">
            {queue.map((item) => (
              <div key={item.label}>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  <span className="muted">{item.label}</span>
                  <span className="tag">{item.status}</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${Math.round(item.percent * 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="status-bar">
              <span className="status ready">Ready</span>
              <span className="muted">Last sync 2m ago • Offline cache 12 files</span>
            </div>
          </div>
        </div>

        <div className="glass section">
          <div className="card-title">
            <strong>Question-by-question</strong>
            {active && (
              <span className="tag">
                Total: {active.total}/{active.max} ({Math.round((active.total / active.max) * 100)}%)
              </span>
            )}
          </div>

          <div className="grid">
            {activeGrades.map((grade) => (
              <div key={grade.question_number} className="question-card">
                <div className="card-title">
                  <span className="tag">Q{grade.question_number}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="badge" style={{ background: "rgba(93,224,230,0.15)", color: "#9ef3ff" }}>
                      {grade.score}/{grade.max} marks
                    </span>
                    <button
                      className="btn secondary"
                      onClick={() => onOverride(activeId!, grade.question_number, grade.max)}
                    >
                      Override to full
                    </button>
                  </div>
                </div>
                <p className="muted">{grade.reasoning}</p>
                <div className="card-title" style={{ marginTop: 8 }}>
                  <span className="muted">Confidence {Math.round(grade.confidence * 100)}%</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="tag">{grade.confidence > 0.8 ? "High" : "Review"}</span>
                    {grade.confidence < 0.7 && (
                      <span className="tag" style={{ background: "rgba(255,186,0,0.16)", color: "#ffd28a" }}>
                        <Flag size={12} /> Needs review
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!activeGrades.length && <p className="muted">AI has not graded this submission yet.</p>}
          </div>

          <div className="insights">
            <div className="card-title">
              <strong>Insights</strong>
              <span className="tag">2/3 reviewed</span>
            </div>
            <div className="grid" style={{ gap: 8 }}>
              <div className="question-card">
                <span className="pill">Top improvement</span>
                <p>Clarify chain rule steps (Conf 0.62)</p>
                <button className="btn secondary">Mark reviewed</button>
              </div>
              <div className="question-card">
                <span className="pill">Low confidence</span>
                <p>Work shown on integrals missing (Conf 0.55)</p>
                <div className="muted" style={{ display: "flex", gap: 8 }}>
                  <AlertTriangle size={14} /> Needs manual check
                </div>
              </div>
              <div className="question-card">
                <span className="pill">High-confidence win</span>
                <p>Derivatives mastery (Conf 0.91)</p>
                <div className="muted" style={{ display: "flex", gap: 8 }}>
                  <Navigation size={14} /> Export badge unlocked
                </div>
              </div>
            </div>
          </div>

          <hr className="divider" />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ArrowRight size={16} />
            <span className="muted">
              Upload handwritten PDFs, AI extracts answers, grades against rubric, and surfaces low-confidence items.
            </span>
          </div>
        </div>
      </div>

      <div className="grading-tray glass">
        <div className="tray-left">
          <button className="btn secondary" onClick={goPrev}>
            Prev (P)
          </button>
          <button className="btn" onClick={goNext}>
            Next (N)
          </button>
        </div>
        <div className="tray-right">
          <button className="btn secondary" onClick={() => active && onOverride(active.id, activeGrades[0]?.question_number ?? "", activeGrades[0]?.max ?? 0)}>
            Override (O)
          </button>
          <button className="btn secondary">
            Flag (F)
          </button>
        </div>
      </div>
    </div>
  );
}

export default GradingDashboard;
