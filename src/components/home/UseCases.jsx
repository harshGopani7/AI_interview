import "./UseCases.css";
import Card from "../../ui/Card";
import Section from "../../ui/Section";
import {
  HiOutlineRocketLaunch,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
} from "react-icons/hi2";

const USERS = [
  {
    title: "Startups & SMBs",
    desc: "Hire your first 10 or next 100 employees without a dedicated recruitment team. Our AI handles screening and first-round interviews so you can focus on building.",
    icon: <HiOutlineRocketLaunch />,
    color: "var(--accent-primary)",
  },
  {
    title: "Enterprise HR Teams",
    desc: "Process thousands of applications per role effortlessly. Standardize evaluations across departments with consistent AI-driven scoring and reporting.",
    icon: <HiOutlineBuildingOffice2 />,
    color: "var(--accent-primary)",
  },
  {
    title: "Recruitment Agencies",
    desc: "Deliver faster shortlists to your clients. Screen candidates at scale, share detailed AI reports, and close positions in half the time.",
    icon: <HiOutlineUserGroup />,
    color: "var(--accent-primary)",
  },
];

export default function UseCases() {
  return (
    <Section
      title="Built for Every Hiring Team"
      className="usecases-section"
    >
      <div className="row g-4 justify-content-center">
        {USERS.map((u, i) => (
          <div className="col-lg-4 col-md-6" key={i}>
            <Card hover className="usecase-card text-center h-100">
              <div
                className="usecase-icon"
                style={{ color: u.color, backgroundColor: `${u.color}15` }}
              >
                {u.icon}
              </div>
              <h4 className="mt-3 fw-bold">{u.title}</h4>
              <p className="text-secondary mb-0">{u.desc}</p>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}