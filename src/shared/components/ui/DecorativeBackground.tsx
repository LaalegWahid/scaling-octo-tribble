"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function DecorativeBackground() {
  const { scrollY } = useScroll();

  // Smooth the scroll signal (this is the key to avoiding harsh motion)
  const y = useSpring(scrollY, { stiffness: 60, damping: 25, mass: 0.6 });

  // Very subtle parallax (tweak ranges for more/less motion)
  const glowY = useTransform(y, [0, 1200], [-240, -360]); // top glow slides slowly
  const glowX = useTransform(y, [0, 1200], ["48%", "52%"]); // tiny horizontal drift
  const glowOpacity = useTransform(y, [0, 600, 1200], [0.55, 0.45, 0.52]); // gentle, non-sine

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black"
    >
      {/* Darker base gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#2A145A_0%,#0F082E_32%,#050414_62%,#000000_100%)]" />

      {/* Smooth parallax glow */}
      <motion.div
        className="absolute left-1/2 h-[56rem] w-[56rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          top: glowY,
          // Framer can animate strings; we drive position with glowX
          background: "transparent",
          opacity: glowOpacity,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center 35%,
              rgba(139,92,246,0.55),
              rgba(124,58,237,0.18),
              transparent 64%)`,
            // instead of animating the gradient string, we drift the whole blob
            x: useTransform(y, [0, 1200], [-12, 12]),
          }}
        />
      </motion.div>

      {/* Subtle mid tint */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_20%,rgba(99,102,241,0.10),transparent_70%)]" />

      {/* Strong vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_35%,transparent_36%,rgba(0,0,0,0.92)_78%,rgba(0,0,0,1)_100%)]" />

      {/* Optional noise (banding fix) */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')]" />
    </div>
  );
}
