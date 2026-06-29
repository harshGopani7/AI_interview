import "./ui-components.css";

export default function Section({ title, subtitle, children, className = "" }) {
  return (
    <section className={`section-ui ${className}`}>
      <div className="container">
        {(title || subtitle) && (
          <div className="section-header">
            {title && <h2 className="section-title h1">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="section-content">
          {children}
        </div>
      </div>
    </section>
  );
}