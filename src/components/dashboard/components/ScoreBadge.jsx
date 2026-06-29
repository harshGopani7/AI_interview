import "./ScoreBadge.css";

export default function ScoreBadge({ score }) {
  const level =
    score >= 80 ? "high" :
    score >= 60 ? "medium" : "low";

  return (
    <span className={`score score-${level}`}>
      {score}
    </span>
  );
}
