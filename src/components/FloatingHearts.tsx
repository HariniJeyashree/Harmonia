/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  scale: number;
  opacity: number;
}

export default function FloatingHearts() {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  useEffect(() => {
    // Generate 12 random heart particles
    const newHearts = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: Math.random() * 40 + 60, // percentage height (spawn a bit lower)
      size: Math.random() * 20 + 12, // size in px
      duration: Math.random() * 15 + 10, // speed
      delay: Math.random() * 5, // random delay
      scale: Math.random() * 0.4 + 0.8,
      opacity: Math.random() * 0.25 + 0.1
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-pink-300"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            fontSize: `${heart.size}px`,
            opacity: heart.opacity,
          }}
          animate={{
            y: [-25, -900], // float upwards
            x: [0, Math.random() * 60 - 30], // slight waving
            rotate: [0, Math.random() * 180 - 90],
          }}
          transition={{
            duration: heart.duration,
            repeat: Infinity,
            delay: heart.delay,
            ease: 'linear',
          }}
        >
          ❤️
        </motion.div>
      ))}
      
      {/* Delicate floating sparkles */}
      <div className="absolute top-10 left-[15%] text-purple-200 text-lg opacity-30 animate-pulse">✦</div>
      <div className="absolute top-1/3 right-[10%] text-amber-200 text-xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }}>✦</div>
      <div className="absolute bottom-[20%] left-[8%] text-pink-200 text-2xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}>✿</div>
      <div className="absolute bottom-[40%] right-[15%] text-indigo-200 text-lg opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}>✦</div>
    </div>
  );
}
