import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import UseCases from "../components/home/UseCases";
import CTA from "../components/home/CTA";
import FAQ from "../components/home/FAQ";

// export const backendURL = 'https://interview.onewebmart.cloud'
export const backendURL = 'http://127.0.0.1:5003'


export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <CTA />
    </>
  );
}
