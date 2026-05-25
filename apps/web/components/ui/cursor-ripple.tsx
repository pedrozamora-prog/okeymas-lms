"use client";

import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
}

export function CursorRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastRippleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function onMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const now = Date.now();
      if (now - lastRippleRef.current > 40) {
        lastRippleRef.current = now;
        ripplesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          alpha: 0.6,
          speed: 2.5 + Math.random() * 2,
        });
        if (ripplesRef.current.length > 30) ripplesRef.current.shift();
      }
    }
    window.addEventListener("mousemove", onMouseMove);

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0.01);

      for (const r of ripplesRef.current) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(252, 233, 0, ${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        r.radius += r.speed;
        r.alpha *= 0.92;
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
