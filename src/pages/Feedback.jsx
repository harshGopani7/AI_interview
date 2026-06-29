import { useLocation } from "react-router-dom";

export default function Feedback() {
  const { state } = useLocation();

  if (!state) return <p>No feedback available.</p>;

  return (
    <div className="page-center">
      <div className="card" style={{ maxWidth: "600px" }}>
        <h2>Interview Feedback</h2>

        <p><strong>Score:</strong> {state.score}/100</p>

        <h4>Strengths</h4>
        <ul>
          {state.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        <h4>Improvements</h4>
        <ul>
          {state.improvements.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
