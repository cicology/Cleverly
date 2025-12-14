import { useState } from "react";
import type React from "react";
import type { Topic } from "../types";
import { X, Sparkles, Upload, Plus, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    university: string;
    code: string;
    duration: string;
    topics: Topic[];
  }) => void;
};

const durationOptions = [
  "Year",
  "Semester",
  "Trimester",
  "Quarter",
  "Month",
  "Biweek",
  "Week",
  "Intensive",
  "Workshop"
];

export function CourseModal({ open, onClose, onCreate }: Props) {
  const [tab, setTab] = useState<"info" | "topics">("info");
  const [title, setTitle] = useState("Mechanics 101");
  const [university, setUniversity] = useState("Oryares Institute");
  const [code, setCode] = useState("PHYS101");
  const [duration, setDuration] = useState("Semester");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [subtopicInput, setSubtopicInput] = useState("");

  if (!open) return null;

  const addTopic = () => {
    if (!topicInput.trim()) return;
    setTopics((prev) => [...prev, { name: topicInput.trim(), subtopics: [] }]);
    setTopicInput("");
  };

  const addSubtopic = (index: number) => {
    if (!subtopicInput.trim()) return;
    setTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, subtopics: [...t.subtopics, subtopicInput.trim()] } : t))
    );
    setSubtopicInput("");
  };

  const autoExtract = () => {
    setTopics([
      { name: "Kinematics", subtopics: ["Vectors", "Projectile Motion"] },
      { name: "Dynamics", subtopics: ["Forces", "Friction", "Momentum"] }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ title, university, code, duration, topics });
    setTopics([]);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal glass">
        <header className="modal-header">
          <div>
            <p className="pill">Course Creator</p>
            <h2>Create New Course</h2>
            <p className="muted">Two-tab flow: details first, then topics & materials.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="tab-row">
          <button className={`tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>
            Course Information
          </button>
          <button className={`tab ${tab === "topics" ? "active" : ""}`} onClick={() => setTab("topics")}>
            Topics & Materials
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid" style={{ gap: 12 }}>
          {tab === "info" && (
            <div className="grid" style={{ gap: 12 }}>
              <label className="field">
                <span>University / Institute *</span>
                <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g., MIT" />
              </label>
              <div className="grid two-col">
                <label className="field">
                  <span>Course Name *</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Intro to Mechanics" />
                </label>
                <label className="field">
                  <span>Course Code *</span>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PHYS101" />
                </label>
              </div>
              <label className="field">
                <span>Duration *</span>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                  {durationOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {tab === "topics" && (
            <div className="grid" style={{ gap: 12 }}>
              <div className="upload-row">
                <div className="upload-box">
                  <Upload size={18} />
                  <div>
                    <p>Study Guide</p>
                    <span className="muted">PDF, DOCX, MD (max 10MB)</span>
                  </div>
                </div>
                <button type="button" className="btn secondary" onClick={autoExtract}>
                  <Sparkles size={16} /> Auto-extract topics
                </button>
              </div>

              <div className="topic-builder">
                <div className="topic-inputs">
                  <input
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add a topic (Calculus, Mechanics...)"
                  />
                  <button type="button" className="btn secondary" onClick={addTopic}>
                    <Plus size={16} /> Add Topic
                  </button>
                </div>

                {topics.map((topic, idx) => (
                  <div key={topic.name + idx} className="topic-card glass">
                    <div className="card-title">
                      <strong>{topic.name}</strong>
                      <button
                        className="icon-btn"
                        onClick={() => setTopics((prev) => prev.filter((_, i) => i !== idx))}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="subtopic-row">
                      <input
                        value={subtopicInput}
                        onChange={(e) => setSubtopicInput(e.target.value)}
                        placeholder="Add a subtopic (e.g., Derivatives)"
                      />
                      <button type="button" className="btn secondary" onClick={() => addSubtopic(idx)}>
                        Add
                      </button>
                    </div>
                    <div className="chips">
                      {topic.subtopics.map((sub) => (
                        <span key={sub} className="tag">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <footer className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            {tab === "info" ? (
              <button type="button" className="btn" onClick={() => setTab("topics")}>
                Continue
              </button>
            ) : (
              <button type="submit" className="btn">
                Save Course
              </button>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}

export default CourseModal;
