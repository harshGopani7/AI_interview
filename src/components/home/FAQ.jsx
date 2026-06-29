import { useState } from "react";
import "./FAQ.css";
import Section from "../../ui/Section";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";

const FAQ_DATA = [
  {
    question: "How does the AI screen resumes?",
    answer: "Our AI reads each resume, extracts key information (skills, experience, education), and evaluates it against your job description and mandatory requirements. Every candidate receives a match score and a shortlist/borderline/reject verdict — all in seconds.",
  },
  {
    question: "What happens after CV analysis?",
    answer: "Once resumes are analyzed, you get a ranked report of all candidates. From there, you can schedule AI-powered video interviews for your top picks directly from the dashboard. Candidates receive an invite link and complete the interview at their convenience.",
  },
  {
    question: "Which industries and roles are supported?",
    answer: "We support all major industries — Technology, Finance, Healthcare, Legal, Education, Manufacturing, and more. The AI adapts to any seniority level from Intern to C-Level, generating role-specific evaluation criteria automatically.",
  },
  {
    question: "Is candidate data secure?",
    answer: "Absolutely. All data is encrypted in transit and at rest. Resumes and interview recordings are stored securely and are only accessible to your organization. We never share candidate data with third parties.",
  },
  {
    question: "How many resumes can I analyze at once?",
    answer: "There's no hard limit per job. Upload as many resumes as you need — our AI processes them in bulk. Your subscription plan determines the total monthly quota across all jobs.",
  },
  {
    question: "Do candidates need to install anything for the AI interview?",
    answer: "No. Candidates receive a simple browser link. The AI interview runs entirely in the browser — no downloads, no plugins. All they need is a webcam and microphone.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <Section
      title="Frequently Asked Questions"
      className="faq-section"
    >
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="faq-list">
            {FAQ_DATA.map((item, i) => (
              <div
                key={i}
                className={`faq-item ${activeIndex === i ? "active" : ""}`}
                onClick={() => toggleFAQ(i)}
              >
                <div className="faq-question">
                  <span>{item.question}</span>
                  {activeIndex === i ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                </div>
                <div className="faq-answer">
                  <div className="faq-answer-content">{item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}