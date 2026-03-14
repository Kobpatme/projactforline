'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { StickerResult } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export interface ActiveStickerGridProps {
  projectId: string;
  onReset: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function StickerGrid({ projectId, onReset }: ActiveStickerGridProps) {
  const [results, setResults] = useState<StickerResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    // Initial fetch
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('sticker_results')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Fetch error:', error);
      } else if (data) {
        setResults(data);
        // If all 10 stickers have image_urls, we're done
        if (data.length === 10 && data.every(r => r.image_url)) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    // Set up polling (or we could use Supabase Realtime)
    const intervalId = setInterval(async () => {
      const { data, error } = await supabase
        .from('sticker_results')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (!error && data) {
        setResults(data);
        if (data.length === 10 && data.every(r => r.image_url)) {
          setIsLoading(false);
          clearInterval(intervalId);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [projectId]);

  return (
    <section className="px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Navigation / Actions */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-[#8a8a8a] hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Upload
          </button>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium px-4 py-2 glass rounded-full">
              <RefreshCw className="w-4 h-4 animate-spin" />
              AI Generating...
            </div>
          )}
        </div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Custom Stickers
          </h2>
          <p className="text-[#8a8a8a]">
            {isLoading 
              ? "We're crafting 10 styles for you. Grab a coffee! ☕" 
              : "All generation complete! Your stickers are ready."}
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
          {results.map((sticker) => (
            <motion.div
              key={sticker.id}
              variants={itemVariants}
              className="group relative"
            >
              <div className="glass rounded-2xl overflow-hidden aspect-square relative shadow-2xl">
                {sticker.image_url ? (
                  <>
                    <Image
                      src={sticker.image_url}
                      alt={sticker.action_name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized // Replicate URLs might not be pre-configured in next/image patterns
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <motion.a
                        href={sticker.image_url}
                        download
                        target="_blank"
                        whileHover={{ scale: 1.1 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
                      >
                        <Download className="w-6 h-6" />
                      </motion.a>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d]">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-blue-500/20 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[#444] mt-4">
                      Processing
                    </span>
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-[#8a8a8a] mt-3 font-medium">
                {sticker.action_name}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
