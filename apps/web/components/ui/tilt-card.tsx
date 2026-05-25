"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function TiltCard({ children, className, intensity = 12 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const rafRef = useRef<number | null>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -intensity;
      const rotY = ((x - cx) / cx) * intensity;

      setStyle({
        transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`,
        transition: "transform 0.08s ease-out",
      });
      setGlare({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.18,
      });
    });
  }

  function handleMouseLeave() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
      transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
    });
    setGlare(g => ({ ...g, opacity: 0 }));
  }

  return (
    <div
      ref={ref}
      style={{ ...style, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative", className)}
    >
      {/* Glare overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(252,233,0,${glare.opacity}) 0%, transparent 65%)`,
          opacity: glare.opacity > 0 ? 1 : 0,
        }}
      />
      {children}
    </div>
  );
}
