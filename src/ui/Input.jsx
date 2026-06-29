import "./ui-components.css";

export default function Input({ label, className = "", ...props }) {
  return (
    <div className="input-group-ui">
      {label && <label className="label-ui">{label}</label>}
      <input className={`input-ui ${className}`} {...props} />
    </div>
  );
}