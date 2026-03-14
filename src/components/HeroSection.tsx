'use client';

import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 pt-20 pb-10 overflow-hidden">
      {/* Background ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blue orb */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            top: '-10%',
            left: '10%',
          }}
        />
        {/* Gold orb */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
            bottom: '0%',
            right: '15%',
          }}
        />
        {/* Purple orb */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            top: '30%',
            right: '30%',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-500/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[#8a8a8a]">AI-Powered Sticker Generation</span>
        </div>
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-5xl md:text-7xl font-bold text-center leading-tight max-w-4xl mb-6"
      >
        <span className="text-white">Turn Your Face Into </span>
        <br />
        <span className="gradient-text-premium">10 LINE Stickers</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-lg md:text-xl text-[#8a8a8a] text-center max-w-2xl mb-10 leading-relaxed"
      >
        Upload a single photo and our AI will create{' '}
        <span className="text-blue-400">10 unique stickers</span> with different emotions —
        ready for LINE in seconds.
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-12"
      >
        {[
          { icon: Zap, label: 'Instant Generation', color: 'text-amber-400' },
          { icon: Wand2, label: '10 Unique Emotions', color: 'text-blue-400' },
          { icon: Sparkles, label: 'LINE-Ready Format', color: 'text-purple-400' },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass-light flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          >
            <feature.icon className={`w-4 h-4 ${feature.color}`} />
            <span className="text-[#c0c0c0]">{feature.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-6"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border border-[#333] flex items-start justify-center p-2"
        >
          <div className="w-1 h-2.5 rounded-full bg-blue-500/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
