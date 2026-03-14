'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus, X, Sparkles, AlertCircle } from 'lucide-react';
import Image from 'next/image';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

interface FileUploadProps {
  onGenerateSuccess: (projectId: string) => void;
}

export default function FileUpload({ onGenerateSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null);

    if (rejectedFiles && (rejectedFiles as Array<{ errors: Array<{ code: string }> }>).length > 0) {
      const rejection = (rejectedFiles as Array<{ errors: Array<{ code: string }> }>)[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload JPG, PNG, or WebP.');
      } else {
        setError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start generation');
      }

      onGenerateSuccess(data.projectId);
    } catch (err: any) {
      console.error('Generation request failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="upload-section" className="relative px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            Upload Your Photo
          </h2>
          <p className="text-[#8a8a8a] text-sm">
            Drop a clear face photo below — we&apos;ll handle the magic ✨
          </p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {!preview ? (
              /* ===== DROP ZONE ===== */
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  {...getRootProps()}
                  className={`
                    relative group cursor-pointer rounded-2xl p-12 transition-all duration-300
                    ${isDragActive && !isDragReject
                      ? 'glass border-blue-500/50 glow-blue scale-[1.02]'
                      : isDragReject
                        ? 'glass border-red-500/30'
                        : 'glass hover:border-[#333] hover:glow-blue'
                    }
                  `}
                >
                  <input {...getInputProps()} />

                  <div className="flex flex-col items-center justify-center text-center">
                    {/* Icon */}
                    <motion.div
                      animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300
                        ${isDragActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-[#1a1a1a] text-[#555] group-hover:text-blue-400 group-hover:bg-blue-500/10'
                        }
                      `}
                    >
                      {isDragActive ? (
                        <ImagePlus className="w-9 h-9" />
                      ) : (
                        <Upload className="w-9 h-9" />
                      )}
                    </motion.div>

                    {/* Text */}
                    {isDragActive ? (
                      <p className="text-blue-400 font-medium text-lg">
                        Drop your photo here...
                      </p>
                    ) : (
                      <>
                        <p className="text-white font-medium text-lg mb-2">
                          Drag & drop your face photo
                        </p>
                        <p className="text-[#666] text-sm mb-4">
                          or click to browse from your device
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[#555]">
                          <span className="px-2 py-1 rounded bg-[#1a1a1a]">JPG</span>
                          <span className="px-2 py-1 rounded bg-[#1a1a1a]">PNG</span>
                          <span className="px-2 py-1 rounded bg-[#1a1a1a]">WebP</span>
                          <span className="text-[#444]">•</span>
                          <span>Max 10MB</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Animated border on hover */}
                  <div className="absolute inset-0 rounded-2xl border border-dashed border-[#333] group-hover:border-blue-500/30 transition-colors duration-300 pointer-events-none" />
                </div>
              </motion.div>
            ) : (
              /* ===== PREVIEW STATE ===== */
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Image Preview */}
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden ring-2 ring-blue-500/20 flex-shrink-0">
                    <Image
                      src={preview}
                      alt="Photo preview"
                      fill
                      className="object-cover"
                    />
                    {/* Remove button */}
                    <button
                      onClick={removeFile}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* File Info + CTA */}
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-white font-medium text-lg mb-1 truncate max-w-[250px]">
                      {file?.name}
                    </p>
                    <p className="text-[#666] text-sm mb-5">
                      {file && (file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                      Ready to generate
                    </p>

                    {/* Generate button */}
                    <motion.button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                      whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                      className={`
                        relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm
                        transition-all duration-300 overflow-hidden
                        ${isGenerating
                          ? 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]'
                        }
                      `}
                    >
                      {/* Shimmer effect */}
                      {!isGenerating && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                      )}

                      {isGenerating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-5 h-5" />
                          </motion.div>
                          Generating Stickers...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate 10 Stickers
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
