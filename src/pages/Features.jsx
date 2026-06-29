// import Section from "../../ui/Section";
// import Card from "../../ui/Card";

// const FEATURES = [
//   {
//     title: "AI-Driven Interviews",
//     desc: "Adaptive questions based on your answers and experience level."
//   },
//   {
//     title: "Voice-Based Responses",
//     desc: "Answer questions naturally using voice or text."
//   },
//   {
//     title: "Smart Feedback",
//     desc: "Receive structured scores, strengths, and improvements."
//   },
//   {
//     title: "Interview Integrity",
//     desc: "Tab-switch detection, paste prevention, and time limits."
//   }
// ];

// export default function Features() {
//   return (
//     <Section
//       title="Key Features"
//       subtitle="Everything you need to prepare for real interviews"
//     >
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
//           gap: "16px",
//           marginTop: "24px"
//         }}
//       >
//         {FEATURES.map((f, i) => (
//           <Card key={i}>
//             <h4>{f.title}</h4>
//             <p style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
//           </Card>
//         ))}
//       </div>
//     </Section>
//   );
// }

import Features from "../components/home/Features";

export default function FeaturesPage() {
  return <Features />;
}
