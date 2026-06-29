import "./Features.css";
import Card from "../../ui/Card";
import Section from "../../ui/Section";
import {
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineChartBarSquare,
  HiOutlineVideoCameraSlash,
  HiOutlineCalendarDays,
  HiOutlineCpuChip,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";

const FEATURES = [
  {
    title: "AI Resume Screening",
    desc: "Upload bulk CVs and let our AI score, rank, and shortlist candidates against your exact job criteria in seconds.",
    icon: <HiOutlineDocumentMagnifyingGlass />,
  },
  {
    title: "Instant Candidate Ranking",
    desc: "Get a ranked leaderboard of candidates with match scores, skill gaps, and hire/reject verdicts automatically.",
    icon: <HiOutlineChartBarSquare />,
  },
  {
    title: "AI-Driven Interviews",
    desc: "Schedule AI-powered video interviews for shortlisted candidates — no manual interviewer needed for round one.",
    icon: <HiOutlineVideoCameraSlash />,
  },
  {
    title: "Bulk Interview Scheduling",
    desc: "Send interview invites to multiple candidates at once. They take the AI interview at their convenience.",
    icon: <HiOutlineCalendarDays />,
  },
  {
    title: "Smart Evaluation Reports",
    desc: "Receive detailed performance reports with technical accuracy, communication scores, and integrity checks.",
    icon: <HiOutlineCpuChip />,
  },
  {
    title: "All Industries Supported",
    desc: "From Technology and Finance to Healthcare and Legal — our AI adapts to any domain and seniority level.",
    icon: <HiOutlineGlobeAlt />,
  },
  {
    title: "Secure & Compliant",
    desc: "Enterprise-grade encryption protects candidate data. Your screening process stays private and audit-ready.",
    icon: <HiOutlineShieldCheck />,
  },
  {
    title: "Screening History & Reports",
    desc: "Access past screening jobs anytime. Review reports, compare candidates, and make data-driven hiring decisions.",
    icon: <HiOutlineClipboardDocumentList />,
  },
];

export default function Features() {
  return (
    <Section
      title="Everything You Need to Hire Faster"
      className="features-section bg-secondary-light"
    >
      <div className="row g-4 mt-2">
        {FEATURES.map((f, i) => (
          <div className="col-md-6 col-lg-3" key={i}>
            <Card hover className="h-100 feature-card">
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <h5 className="feature-title">{f.title}</h5>
              <p className="feature-desc">{f.desc}</p>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}