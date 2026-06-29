import ScoreBadge from "./ScoreBadge";
import "./InterviewTable.css";

const DATA = [
  { role: "Frontend Dev", score: 82, date: "2026-01-02" },
  { role: "Backend Dev", score: 74, date: "2026-01-05" },
];

export default function InterviewTable() {
  return (
    <table className="interview-table">
      <thead>
        <tr>
          <th>Role</th>
          <th>Date</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {DATA.map((i, idx) => (
          <tr key={idx}>
            <td>{i.role}</td>
            <td>{i.date}</td>
            <td><ScoreBadge score={i.score} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
