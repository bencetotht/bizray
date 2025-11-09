import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Stats from "../components/Stats";
import Hero from "../components/Hero";
import BackgroundNetwork from "../components/BackgroundNetwork";

export default function MainPage() {
  return (
    // Parent must be relative + overflow-hidden, so the absolute bg fits without scrollbars
    <div className="MainPage" style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Background layer */}
      <BackgroundNetwork />

      {/* Foreground content */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Hero />
        {/* <Features /> */}
        <HowItWorks />
        <Stats />
      </div>
    </div>
  );
}
