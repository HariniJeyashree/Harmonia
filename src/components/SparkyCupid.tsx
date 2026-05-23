/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface SparkyCupidProps {
  expression: 'welcome' | 'thinking' | 'correct' | 'incorrect' | 'complete';
  commentary?: string;
}

export default function SparkyCupid({ expression, commentary }: SparkyCupidProps) {
  // Pastel gradients and icons based on Sparky's feelings
  const getExpressionGraphics = () => {
    switch (expression) {
      case 'welcome':
        return {
          emoji: '🧁',
          bg: 'bg-rose-100 border-rose-200',
          textColor: 'text-rose-600',
          title: 'Sparky (Your Sweet AI Quizmaster)',
          animation: {
            animate: { y: [0, -10, 0], rotate: [0, 4, -4, 0] },
            transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
          }
        };
      case 'thinking':
        return {
          emoji: '🤔',
          bg: 'bg-indigo-100 border-indigo-200',
          textColor: 'text-indigo-600',
          title: 'Sparky is ponders...',
          animation: {
            animate: { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] },
            transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' }
          }
        };
      case 'correct':
        return {
          emoji: '💖',
          bg: 'bg-emerald-100 border-emerald-200 animate-pulse',
          textColor: 'text-emerald-700 font-bold',
          title: 'Sparky says: ABSOLUTELY SYNCED!',
          animation: {
            animate: { scale: [1, 1.15, 0.95, 1.05, 1], y: [0, -20, 5, -5, 0] },
            transition: { duration: 0.8, ease: 'easeOut' }
          }
        };
      case 'incorrect':
        return {
          emoji: '🥺',
          bg: 'bg-amber-100 border-amber-200',
          textColor: 'text-amber-700',
          title: 'Sparky says: Almost matched!',
          animation: {
            animate: { x: [-10, 10, -5, 5, 0], rotate: [-5, 5, -2, 2, 0] },
            transition: { duration: 0.6, ease: 'easeInOut' }
          }
        };
      case 'complete':
        return {
          emoji: '👑',
          bg: 'bg-purple-100 border-purple-200',
          textColor: 'text-purple-600 font-bold',
          title: 'Sparky is crying happy tears!',
          animation: {
            animate: { scale: [1, 1.1, 1], rotate: [0, 10, -10, 360, 0] },
            transition: { repeat: Infinity, duration: 6, ease: 'easeInOut' }
          }
        };
    }
  };

  const { emoji, bg, textColor, title, animation } = getExpressionGraphics();

  return (
    <div className={`p-4 rounded-3xl border-2 ${bg} flex items-start gap-4 shadow-sm relative overflow-hidden transition-all duration-300 max-w-lg mx-auto`}>
      {/* Decorative floating sparkles inside background */}
      <span className="absolute -top-1 -right-2 text-rose-300 opacity-40 text-lg animate-ping">✿</span>
      <span className="absolute -bottom-1 -left-1 text-purple-300 opacity-40 text-lg animate-ping">✿</span>

      <motion.div 
        className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-4xl shrink-0 border border-pink-100"
        animate={animation.animate}
        transition={animation.transition}
      >
        {emoji}
      </motion.div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 font-display mb-1">
          {title}
        </h4>
        {commentary ? (
          <p className={`text-sm leading-relaxed ${textColor} font-sans`}>
            "{commentary}"
          </p>
        ) : (
          <p className="text-xs text-gray-500 italic">
            Waiting to quiz your love connection...
          </p>
        )}
      </div>
    </div>
  );
}
