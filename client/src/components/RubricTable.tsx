import type { RubricRow } from "../types";
import { PencilLine, RefreshCcw, Plus } from "lucide-react";

type Props = {
  rubric: RubricRow[];
  onChange: (rows: RubricRow[]) => void;
};

export function RubricTable({ rubric, onChange }: Props) {
  const updateRow = (index: number, patch: Partial<RubricRow>) => {
    const copy = [...rubric];
    copy[index] = { ...copy[index], ...patch };
    onChange(copy);
  };

  const addRow = () => {
    onChange([
      ...rubric,
      {
        question_number: `${rubric.length + 1}`,
        question_text: "New question",
        expected_answer: "Solution text",
        marks: 5
      }
    ]);
  };

  return (
    <div className="card glass">
      <div className="card-title">
        <div>
          <p className="pill">Rubric</p>
          <h3>Memo extraction preview</h3>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary">
            <RefreshCcw size={16} /> Regenerate with AI
          </button>
          <button className="btn secondary" onClick={addRow}>
            <Plus size={16} /> Add question
          </button>
        </div>
      </div>

      <div className="rubric-row muted" style={{ fontWeight: 700 }}>
        <span>Q#</span>
        <span>Question</span>
        <span>Expected</span>
        <span>Marks</span>
      </div>

      {rubric.map((row, idx) => (
        <div key={row.question_number + idx} className="rubric-row">
          <input
            value={row.question_number}
            onChange={(e) => updateRow(idx, { question_number: e.target.value })}
          />
          <textarea
            value={row.question_text}
            onChange={(e) => updateRow(idx, { question_text: e.target.value })}
            rows={2}
          />
          <textarea
            value={row.expected_answer}
            onChange={(e) => updateRow(idx, { expected_answer: e.target.value })}
            rows={2}
          />
          <input
            type="number"
            value={row.marks}
            onChange={(e) => updateRow(idx, { marks: Number(e.target.value) })}
          />
        </div>
      ))}

      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }} className="muted">
        <PencilLine size={16} />
        <span>Tap any cell to edit. Marks sync back to the grader.</span>
      </div>
    </div>
  );
}

export default RubricTable;
