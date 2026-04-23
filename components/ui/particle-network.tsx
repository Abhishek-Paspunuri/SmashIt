"use client";

import { useEffect, useRef } from "react";

interface ParticleNetworkProps {
  /** "subtle" for app shell, "vivid" for auth pages */
  intensity?: "subtle" | "vivid";
}

export function ParticleNetwork({
  intensity = "subtle",
}: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isVivid = intensity === "vivid";

    // Light
    // const dotOpacity = isVivid ? 0.45 : 0.35;
    // const lineOpacity = isVivid ? 0.18 : 0.13;
    const dotCount = isVivid ? 40 : 30;
    const connectDist = isVivid ? 120 : 105;
    const speed = isVivid ? 0.35 : 0.25;

    // Thick
    const dotOpacity = isVivid ? 0.72 : 0.58;
    const lineOpacity = isVivid ? 0.38 : 0.28;
    // const dotCount = isVivid ? 60 : 50;
    // const connectDist = isVivid ? 145 : 130;
    // const speed = isVivid ? 0.45 : 0.3;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    type Dot = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      opacity: number;
      pulse: number;
      pulseSpeed: number;
    };

    const dots: Dot[] = Array.from({ length: dotCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 2.5 + 1.5,
      opacity: Math.random() * 0.4 + 0.6,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
    }));

    let frame = 0;
    let raf: number;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      frame++;

      // Update positions
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        d.pulse += d.pulseSpeed;

        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
      }

      // Draw connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * lineOpacity;
            ctx!.beginPath();
            ctx!.moveTo(dots[i].x, dots[i].y);
            ctx!.lineTo(dots[j].x, dots[j].y);
            ctx!.strokeStyle = `rgba(249,115,22,${alpha.toFixed(3)})`;
            ctx!.lineWidth = 1.2;
            ctx!.stroke();
          }
        }
      }

      // Draw dots with pulse
      for (const d of dots) {
        const pulsedOpacity =
          dotOpacity * d.opacity * (0.8 + 0.2 * Math.sin(d.pulse));
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(249,115,22,${pulsedOpacity.toFixed(3)})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 1, opacity: 1 }}
      aria-hidden="true"
    />
  );
}
