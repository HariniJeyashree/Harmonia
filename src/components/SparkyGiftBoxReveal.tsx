import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Lock, MessageCircle, Heart, Sparkles, BookOpen } from 'lucide-react';

interface SparkyGiftBoxRevealProps {
  secretNote: string;
  partnerAName: string;
  partnerBName: string;
}

export default function SparkyGiftBoxReveal({ secretNote, partnerAName, partnerBName }: SparkyGiftBoxRevealProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [burstHearts, setBurstHearts] = useState<{ id: number; x: number; y: number; r: number; scale: number }[]>([]);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);

    // Trigger full hearts burst particle effect
    const tempHearts = Array.from({ length: 14 }).map((_, i) => ({
      id: i + Date.now(),
      x: (Math.random() - 0.5) * 200,
      y: -50 - Math.random() * 120,
      r: Math.random() * 30 - 15,
      scale: 0.5 + Math.random() * 0.8
    }));
    setBurstHearts(tempHearts);
  };

  return (
    <div className="relative w-full max-w-md mx-auto my-6 px-1">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* GIFT BOX VIEW */
          <motion.div
            key="gift-box-closed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
            whileHover={{ scale: 1.02 }}
            onClick={handleOpen}
            className="bg-gradient-to-br from-[#FFF0F3] to-[#FFE3E8] border-2 border-[#FFD1DC] rounded-[32px] p-8 text-center shadow-md cursor-pointer relative overflow-hidden group select-none"
          >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-pink-100/50 rounded-full blur-xl -translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-rose-200/20 rounded-full blur-xl translate-x-12 translate-y-12"></div>

            {/* Locked Badge */}
            <span className="inline-flex items-center gap-1 bg-[#FFF9FB] text-[#FF85A1] text-[10px] font-extrabold px-3 py-1 rounded-full border border-[#FFD1DC] uppercase tracking-wider mb-5">
              <Lock className="w-2.5 h-2.5" /> Special Love Box Locked 🔐
            </span>

            {/* Glowing sparkle dots */}
            <div className="absolute top-10 right-10 text-[#FF85A1]/40 animate-pulse">✨</div>
            <div className="absolute bottom-12 left-10 text-[#FFE3E8]/80 animate-pulse">💖</div>

            {/* Dynamic visual box wrapping */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              {/* Floating satin bow animation container */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -2, 2, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3, 
                  ease: "easeInOut" 
                }}
                className="absolute -top-3 z-10 select-none pointer-events-none"
              >
                {/* Bow visualization utilizing CSS layers/SVG */}
                <svg className="w-16 h-12 text-[#FF5A80]" viewBox="0 0 100 60" fill="currentColor">
                  {/* Left loop */}
                  <path d="M 50 30 C 20 0 0 10 10 30 C 20 45 45 35 50 30 Z" />
                  {/* Right loop */}
                  <path d="M 50 30 C 80 0 100 10 90 30 C 80 45 55 35 50 30 Z" />
                  {/* Knots and tails */}
                  <circle cx="50" cy="30" r="10" fill="#E02953" />
                  <path d="M 45 35 C 35 55 20 58 15 55" stroke="#FF5A80" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <path d="M 55 35 C 65 55 80 58 85 55" stroke="#FF5A80" strokeWidth="6" strokeLinecap="round" fill="none" />
                </svg>
              </motion.div>

              {/* Gift box cover lid */}
              <motion.div 
                className="absolute top-12 left-6 right-6 h-8 bg-gradient-to-r from-[#FF7295] to-[#FF5A80] rounded-xl shadow-xs z-5 flex items-center justify-center border-b-2 border-[#E02953]/20"
                whileHover={{ y: -4 }}
              >
                {/* Horizontal ribbon band */}
                <div className="w-5 h-full bg-[#FFE3E8] opacity-90 mx-auto"></div>
              </motion.div>

              {/* Gift box base body */}
              <div className="absolute top-[76px] left-8 right-8 bottom-4 bg-gradient-to-b from-[#FF5A80] to-[#E02953] rounded-b-2xl shadow-lg border border-[#FF7295]/40 overflow-hidden flex flex-col justify-end p-2 pb-5">
                {/* Vertical ribbon band on box base */}
                <div className="absolute inset-y-0 left-1/2 -ml-2.5 w-5 bg-gradient-to-b from-[#FFF0F3] to-[#FFE3E8]"></div>
                
                {/* Embedded dynamic heart on giftbox */}
                <span className="relative text-3xl block text-center select-none animate-pulse drop-shadow-sm z-10">🎁</span>
              </div>
            </div>

            {/* Click command callout */}
            <div className="mt-4 space-y-1">
              <h4 className="text-sm font-extrabold text-[#5D4A52] tracking-normal">
                {partnerAName} sent you a hidden gift!
              </h4>
              <p className="text-[11px] text-[#A68F9B] font-semibold flex items-center justify-center gap-1">
                🧁 Tap this gorgeous giftbox to open it! <Sparkles className="w-3 h-3 text-[#FF5A80]" />
              </p>
            </div>
          </motion.div>
        ) : (
          /* UNROLLING parchment rolling scroll paper */
          <motion.div
            key="gift-scroll-unrolled"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Burst particle effects hearts layer */}
            {burstHearts.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 1, scale: h.scale, x: 0, y: 0 }}
                animate={{ 
                  opacity: 0, 
                  scale: 0.1, 
                  x: h.x, 
                  y: h.y,
                  rotate: h.r
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 text-rose-500 pointer-events-none z-30"
              >
                <Heart className="w-5 h-5 fill-rose-500 stroke-none" />
              </motion.div>
            ))}

            {/* Antique Scroll Container */}
            <motion.div
              initial={{ height: 60 }}
              animate={{ height: "auto" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="bg-[#FFFDF3] border-3 border-[#D9C4A0] rounded-3xl shadow-xl overflow-hidden relative border-t-8 border-b-8 py-8 px-6 text-center select-text"
              style={{
                backgroundImage: 'radial-gradient(#FBF7E8 20%, transparent 20%), radial-gradient(#FBF7E8 20%, transparent 20%)',
                backgroundPosition: '0 0, 10px 10px',
                backgroundSize: '20px 20px',
              }}
            >
              {/* Ribbon bow seal background */}
              <div className="absolute top-3 left-4 text-xs font-bold text-[#D9C4A0]/20 pointer-events-none select-none font-mono">
                📜 HANDWRITTEN PARCHMENT SCROLL
              </div>

              {/* Wooden-like roller rods at the top and bottom */}
              <div className="absolute left-0 right-0 top-0 h-2.5 bg-gradient-to-r from-[#B09A74] via-[#D9C4A0] to-[#B09A74] border-b border-[#9E8863]"></div>
              <div className="absolute left-0 right-0 bottom-0 h-2.5 bg-gradient-to-r from-[#B09A74] via-[#D9C4A0] to-[#B09A74] border-t border-[#9E8863]"></div>

              {/* Floating scroll accents red wax seal */}
              <div className="absolute top-4 right-5 w-10 h-10 bg-rose-700/10 rounded-full border border-rose-800/15 flex items-center justify-center select-none opacity-40">
                <Heart className="w-5 h-5 text-rose-700" />
              </div>

              {/* Scroll Content with handwritten style & unrolling animation of content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-4"
              >
                <div className="text-center pt-2">
                  <div className="flex justify-center text-amber-600 mb-1">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-black tracking-widest text-[#B5915A] uppercase">
                    Unlocked Letter for {partnerBName}
                  </h3>
                  <div className="h-0.5 w-1/3 mx-auto bg-gradient-to-r from-transparent via-[#D9C4A0] to-transparent mt-1.5 mb-2"></div>
                </div>

                <div className="text-left font-serif py-4 px-4 bg-[#FDF9ED] rounded-2xl border border-[#EBE3CE]/70 relative">
                  <span className="absolute top-2 left-2 text-3xl font-serif text-[#D9C4A0]/40 leading-none select-none font-extrabold">“</span>
                  <p className="text-[#3A3326] text-sm italic font-medium leading-relaxed font-sans font-bold pl-5 pr-2 pt-1 font-serif select-all break-words select-text">
                    {secretNote}
                  </p>
                  <span className="absolute bottom-2 right-2 text-3xl font-serif text-[#D9C4A0]/40 leading-none select-none font-extrabold">”</span>
                </div>

                <div className="text-right text-[11px] font-bold text-[#A5885C] italic">
                  — Tenderly sealed by {partnerAName} 🕊️💖
                </div>

                {/* Close/Wrap Up Option */}
                <div className="pt-3">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-black text-[#A5885C] border border-[#D9C4A0] bg-white px-4 py-1.5 rounded-full hover:bg-[#F9F5DE] cursor-pointer transition-colors focus:outline-none"
                  >
                    🎁 Rewrap Sealed Box
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
