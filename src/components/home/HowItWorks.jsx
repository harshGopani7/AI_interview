import "./HowItWorks.css";
import Section from "../../ui/Section";
import {
  HiOutlineUserPlus,
  HiOutlineCreditCard,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineCalendarDays,
} from "react-icons/hi2";

const STEPS = [
  {
    step: "01",
    title: "Sign Up as an Organization",
    desc: "Create your HR account in seconds. Add your company details and you're ready to go.",
    icon: <HiOutlineUserPlus />,
  },
  {
    step: "02",
    title: "Choose a Plan & Pay",
    desc: "Pick a subscription that fits your hiring volume. Unlock CV analysis and AI interviews instantly.",
    icon: <HiOutlineCreditCard />,
  },
  {
    step: "03",
    title: "Upload CVs & Analyze",
    desc: "Upload resumes in bulk. Our AI scores, ranks, and shortlists candidates against your job requirements.",
    icon: <HiOutlineDocumentMagnifyingGlass />,
  },
  {
    step: "04",
    title: "Schedule AI Interviews",
    desc: "Send interview invites to top candidates. Our AI conducts and evaluates each interview automatically.",
    icon: <HiOutlineCalendarDays />,
  },
];

export default function HowItWorks() {
  return (
    <Section
      title="How It Works"
      className="how-it-works-section"
    >
      <div className="row justify-content-center mt-5">
        <div className="col-lg-12">
          <div className="steps-container">
            {STEPS.map((s, index) => (
              <div className="step-item" key={s.step}>
                <div className="step-number-pill">{s.step}</div>
                <div className="step-icon-box">{s.icon}</div>
                <h4 className="step-title">{s.title}</h4>
                <p className="step-description">{s.desc}</p>
                {index !== STEPS.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Interview Image */}
      <div className="row justify-content-center mt-5">
        <div className="col-lg-8 text-center">
          <img
            src="/images/ai-interview.png"
            alt="AI-powered Interview Platform"
            className="how-it-works-image fade-in"
          />
        </div>
      </div>
    </Section>
  );
}