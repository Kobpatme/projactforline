'use client';

import { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import FileUpload from '@/components/FileUpload';
import StickerGrid from '@/components/StickerGrid';

export default function Home() {
  const [projectId, setProjectId] = useState<string | null>(null);

  return (
    <main className="min-h-screen relative">
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <HeroSection />
      
      {!projectId ? (
        <FileUpload onGenerateSuccess={(id) => setProjectId(id)} />
      ) : (
        <StickerGrid projectId={projectId} onReset={() => setProjectId(null)} />
      )}

      {/* Footer */}
      <footer className="pb-8 pt-16 text-center">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mx-auto mb-6" />
        <p className="text-[#444] text-xs">
          Powered by AI — Built with Next.js & Supabase
        </p>
      </footer>
    </main>
  );
}
