import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim"; 

export default function BackgroundNetwork() {
  const [ready, setReady] = useState(false);

  useEffect(() => {

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(() => ({
    fullScreen: { enable: false },      
    background: { color: "transparent" },
    detectRetina: true,
    particles: {
      number: { value: 100, density: { enable: true, area: 800 } },
      color: { value: "#a0a0a0" },
      opacity: { value: 0.4 },
      size: { value: { min: 1, max: 2 } },
      links: { enable: true, color: "#a0a0a0", opacity: 0.7, distance: 150 },
      move: { enable: true, speed: 0.5 },
    },
  }), []);

  if (!ready) return null; 

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 -z-10"   
      options={options}
    />
  );
}
