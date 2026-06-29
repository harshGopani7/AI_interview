import "./ui-components.css";

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "" // Allows adding Bootstrap classes like 'w-100' or 'btn-lg'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn-ui btn-ui-${variant} ${className}`}
    >
      {children}
    </button>
  );
}