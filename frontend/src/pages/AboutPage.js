import React from "react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import { Sparkles, Network, ShieldCheck } from "lucide-react";
import "./AboutPage.css";

export default function AboutPage() {
  return (
    <main className="about-story">

      <div className="about-story__bg">
        <BackgroundNetwork />
        <div className="about-story__overlay" />
      </div>


      <div className="about-story__inner">
   
        <section className="about-card about-hero">
          <h1 className="about-ttl">See Through the Company</h1>
          <p className="about-lead">
            BizRay started with a simple frustration: public data was public—just not usable.  
            We turned scattered registry facts into a clean lens you can look through.
          </p>
        </section>

    
        <section className="about-row">
          <article className="about-card about-chip">
            <Sparkles className="about-ico" size={22} />
            <h2>The spark</h2>
            <p>
              A late-night due-diligence rabbit hole. Ten tabs open. No answers.  
              We built BizRay so one search shows the story—owners, links, and signals—fast.
            </p>
          </article>

          <article className="about-card about-chip">
            <Network className="about-ico" size={22} />
            <h2>The lens</h2>
            <p>
              Companies don’t live alone. We map relationships and reveal influence, so you see
              what static profiles miss.
            </p>
          </article>

          <article className="about-card about-chip">
            <ShieldCheck className="about-ico" size={22} />
            <h2>The promise</h2>
            <p>
              Clear, explainable indicators—never a black box.  
              You get the “why”, not just a number.
            </p>
          </article>
        </section>

 
        <section className="about-grid">
          <div className="about-card about-punch">
            <h3>Company Details</h3>
            <p>Clean profiles with legal form, seat, partners, and events—ready to cite.</p>
          </div>
          <div className="about-card about-punch">
            <h3>Network View</h3>
            <p>Explore who’s connected to whom—and how strongly.</p>
          </div>
          <div className="about-card about-punch">
            <h3>Risk Signals</h3>
            <p>Context-aware hints from history and relationships—at a glance.</p>
          </div>
        </section>

     
        <section className="about-cta">
          <a href="/" className="btn btn-primary">Try a search</a>
          <a href="/pricing" className="btn btn-ghost">See pricing</a>
        </section>
      </div>
    </main>
  );
}
