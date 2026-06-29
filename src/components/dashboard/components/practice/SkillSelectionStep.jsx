import { useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import "./SkillSelectionStep.css";

const SKILL_CATEGORIES = {
  "Programming Languages": ["JavaScript", "Python", "Java", "C++", "TypeScript", "Go", "Rust", "PHP", "Ruby", "Swift"],
  "Frontend": ["React", "Vue.js", "Angular", "HTML/CSS", "Tailwind CSS", "Bootstrap", "Next.js", "Redux", "Webpack"],
  "Backend": ["Node.js", "Express", "Django", "Flask", "Spring Boot", "FastAPI", "NestJS", "GraphQL", "REST API"],
  "Database": ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "DynamoDB", "Cassandra", "SQLite"],
  "DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "GitHub Actions", "Terraform"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management", "Adaptability", "Critical Thinking"],
  "Tools": ["Git", "VS Code", "Postman", "Jira", "Figma", "Slack", "Linux", "Agile/Scrum"]
};

export default function SkillSelectionStep({ data, onNext, onBack }) {
  const [selectedSkills, setSelectedSkills] = useState(data?.selectedSkills || []);
  const [activeCategory, setActiveCategory] = useState("Programming Languages");
  const [error, setError] = useState("");

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
    setError("");
  };

  const handleNext = () => {
    if (selectedSkills.length === 0) {
      setError("Please select at least one skill");
      return;
    }
    onNext({ selectedSkills });
  };

  return (
    <div className="skill-selection-container step-fade-in">
      <div className="step-header mb-4">
        <h4 className="fw-bold">Target Your Competencies</h4>
        <p className="text-muted small">Select the specific technologies and soft skills you want the AI to focus on.</p>
      </div>

      {/* Selected Skills Summary - Glassmorphism Style */}
      <div className="selection-summary-bar mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="summary-label">
            Selected Skills <span className="count-badge">{selectedSkills.length}</span>
          </span>
          {selectedSkills.length > 0 && (
            <button className="clear-all-btn" onClick={() => setSelectedSkills([])}>Clear All</button>
          )}
        </div>
        
        <div className="selected-pills-area">
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill) => (
              <span key={skill} className="skill-pill-active">
                {skill}
                <button className="remove-pill" onClick={(e) => { e.stopPropagation(); toggleSkill(skill); }}>
                  <FaTimes />
                </button>
              </span>
            ))
          ) : (
            <p className="placeholder-text">No skills selected. Pick from the categories below.</p>
          )}
        </div>
      </div>

      <div className="skills-browser-box">
        {/* Horizontal Category Navigation */}
        <div className="category-scroll-wrapper mb-4">
          {Object.keys(SKILL_CATEGORIES).map((category) => (
            <button
              key={category}
              className={`category-nav-item ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Skill Cards Grid */}
        <div className="skills-interactive-grid">
          {SKILL_CATEGORIES[activeCategory].map((skill) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <div
                key={skill}
                className={`skill-selectable-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => toggleSkill(skill)}
              >
                <div className="card-content">
                  <span className="skill-name">{skill}</span>
                  {isSelected && <FaCheck className="selection-check" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="error-toast mt-3"><FaTimes className="me-2" /> {error}</div>}

      <div className="step-footer mt-5 border-top pt-4 d-flex justify-content-between">
        <button type="button" className="btn-ui btn-ui-secondary px-4" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn-ui btn-ui-primary px-5" onClick={handleNext}>
          Next: Review Mock
        </button>
      </div>
    </div>
  );
}
