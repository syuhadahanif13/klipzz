'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client Runtime Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#420D4B] border border-[#7B337E]/60 flex items-center justify-center text-rose-400 mb-4 shadow-moon-glow">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-[#F5D5E0] mb-2">
        Terjadi Kendala Memuat Halaman
      </h1>

      <p className="text-xs sm:text-sm text-[#F5D5E0]/70 max-w-md mx-auto mb-4 leading-relaxed">
        Sistem mendeteksi kendala pada rendering komponen ini. Silakan klik tombol di bawah untuk memuat ulang data atau kembali ke beranda.
      </p>

      {error?.message && (
        <div className="max-w-lg w-full p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono mb-6 text-left overflow-x-auto">
          {error.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="py-2.5 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Muat Ulang Halaman</span>
        </button>

        <Link
          href="/"
          className="py-2.5 px-5 rounded-xl font-semibold text-xs bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] border border-[#7B337E]/40 flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
