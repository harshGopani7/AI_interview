import "./ui-components.css";

export default function Card({ children, hover = false, className = "" }) {
  return (
    <div className={`card-ui ${hover ? 'card-ui-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}