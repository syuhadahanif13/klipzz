'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, Flame, Eye, Scissors, ExternalLink, Sparkles } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BioChallengeModal } from '../../components/BioChallengeModal';
import { CreateCampaignModal } from '../../components/CreateCampaignModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface LeaderboardUser {
  rank: number;
  username: string;
  fullName: string;
  avatar: string;
  totalEarned: number;
  totalViews: number;
  clipsCount: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [topClippers, setTopClippers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const { data: dbClippers } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, total_earned')
          .eq('role', 'clipper')
          .order('total_earned', { ascending: false })
          .limit(10);

        if (dbClippers && dbClippers.length > 0) {
          const clipperIds = dbClippers.map((c) => c.id);

          // Ambil data submissions riil clipper buat ngitung views dan total klip asli
          const { data: subsData } = await supabase
            .from('submissions')
            .select('id, clipper_id, current_views')
            .in('clipper_id', clipperIds);

          const mapped: LeaderboardUser[] = dbClippers.map((c, index) => {
            const userSubs = (subsData || []).filter((s) => s.clipper_id === c.id);
            const totalViews = userSubs.reduce(
              (sum, s) => sum + (Number(s.current_views) || 0),
              0
            );
            const clipsCount = userSubs.length;

            return {
              rank: index + 1,
              username: `@${c.username}`,
              fullName: c.full_name || c.username,
              avatar: c.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              totalEarned: Number(c.total_earned) || 0,
              totalViews,
              clipsCount,
            };
          });
          setTopClippers(mapped);
        } else {
          setTopClippers([]);
        }
      } catch (err) {
        console.error('Error fetching live leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 pb-24 md:pb-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Hall of Fame Komunitas
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F5D5E0]">
            Top Clipper Bulan Ini
          </h1>
          <p className="text-xs sm:text-sm text-[#F5D5E0]/70">
            Daftar pembuat klip paling produktif dan berpenghasilan tertinggi dari kampanye video @DipanggilKeRuangan.
          </p>
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-[#420D4B]/30 border border-[#7B337E]/30" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-[#420D4B]/20 border border-[#7B337E]/20" />
          </div>
        ) : topClippers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-card border border-[#7B337E]/40 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#420D4B] border border-[#7B337E]/60 flex items-center justify-center text-amber-400 mx-auto shadow-moon-glow">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-[#F5D5E0]">Papan Peringkat Sedang Berjalan</h2>
              <p className="text-xs text-[#F5D5E0]/70 leading-relaxed">
                Belum ada clipper yang mengklaim komisi di bulan ini. Jadilah yang pertama menyetor klip dan raih posisi juara 1!
              </p>
            </div>
            <Link
              href="/"
              className="inline-block py-3 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-white shadow-moon-glow"
            >
              Mulai Gunting Klip Sekarang
            </Link>
          </div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end">
              {/* Rank 2 (Silver) */}
              {topClippers[1] && (
                <div className="glass-card rounded-2xl p-6 border border-slate-400/40 text-center space-y-3 relative order-2 md:order-1">
                  <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black text-sm flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 shadow-lg">
                    2
                  </div>
                  <img
                    src={topClippers[1].avatar}
                    alt={topClippers[1].username}
                    className="w-20 h-20 rounded-2xl mx-auto border-2 border-slate-300 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-base text-[#F5D5E0]">{topClippers[1].fullName}</h3>
                    <span className="text-xs text-[#6667AB] font-semibold">{topClippers[1].username}</span>
                  </div>
                  <div className="pt-2 border-t border-[#7B337E]/30">
                    <span className="text-xs text-[#F5D5E0]/60 block">Penghasilan</span>
                    <span className="text-lg font-black text-emerald-400">
                      Rp {topClippers[1].totalEarned.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-[#F5D5E0]/60 block mt-1">
                      {topClippers[1].totalViews.toLocaleString('id-ID')} views • {topClippers[1].clipsCount} klip
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold - Elevated) */}
              {topClippers[0] && (
                <div className="glass-card rounded-2xl p-8 border border-amber-400/60 text-center space-y-4 relative order-1 md:order-2 shadow-moon-glow -mt-4 bg-gradient-to-b from-[#420D4B] to-[#210635]">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center absolute -top-5 left-1/2 -translate-x-1/2 shadow-moon-glow">
                    👑
                  </div>
                  <img
                    src={topClippers[0].avatar}
                    alt={topClippers[0].username}
                    className="w-24 h-24 rounded-2xl mx-auto border-4 border-amber-400 object-cover shadow-moon-glow"
                  />
                  <div>
                    <h3 className="font-extrabold text-lg text-[#F5D5E0]">{topClippers[0].fullName}</h3>
                    <span className="text-xs text-amber-300 font-bold">{topClippers[0].username}</span>
                  </div>
                  <div className="pt-2 border-t border-amber-400/30">
                    <span className="text-xs text-[#F5D5E0]/70 block font-medium">Juara 1 Bulan Ini</span>
                    <span className="text-2xl font-black text-emerald-400">
                      Rp {topClippers[0].totalEarned.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-[#F5D5E0]/70 block mt-1 font-semibold">
                      {topClippers[0].totalViews.toLocaleString('id-ID')} views • {topClippers[0].clipsCount} klip
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topClippers[2] && (
                <div className="glass-card rounded-2xl p-6 border border-amber-700/40 text-center space-y-3 relative order-3">
                  <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 shadow-lg">
                    3
                  </div>
                  <img
                    src={topClippers[2].avatar}
                    alt={topClippers[2].username}
                    className="w-20 h-20 rounded-2xl mx-auto border-2 border-amber-700 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-base text-[#F5D5E0]">{topClippers[2].fullName}</h3>
                    <span className="text-xs text-[#6667AB] font-semibold">{topClippers[2].username}</span>
                  </div>
                  <div className="pt-2 border-t border-[#7B337E]/30">
                    <span className="text-xs text-[#F5D5E0]/60 block">Penghasilan</span>
                    <span className="text-lg font-black text-emerald-400">
                      Rp {topClippers[2].totalEarned.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-[#F5D5E0]/60 block mt-1">
                      {topClippers[2].totalViews.toLocaleString('id-ID')} views • {topClippers[2].clipsCount} klip
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* FULL LEADERBOARD TABLE */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
              <h2 className="text-lg font-bold text-[#F5D5E0]">
                Peringkat Keseluruhan
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#210635] text-[#F5D5E0]/70 uppercase tracking-wider border-b border-[#7B337E]/30">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Kreator</th>
                      <th className="py-3 px-4">Total Views Klip</th>
                      <th className="py-3 px-4">Jumlah Klip</th>
                      <th className="py-3 px-4 text-right">Total Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#7B337E]/20">
                    {topClippers.map((clp) => (
                      <tr key={clp.rank} className="hover:bg-[#420D4B]/30 transition-colors">
                        <td className="py-3.5 px-4 font-black text-sm text-[#F5D5E0]">
                          #{clp.rank}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={clp.avatar}
                              alt={clp.username}
                              className="w-9 h-9 rounded-xl object-cover border border-[#7B337E]/40"
                            />
                            <div>
                              <span className="font-bold text-[#F5D5E0] block">{clp.fullName}</span>
                              <span className="text-[11px] text-[#6667AB] font-medium">{clp.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#F5D5E0]">
                          {clp.totalViews.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-[#F5D5E0]/80">
                          {clp.clipsCount} Klip
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-sm">
                          Rp {clp.totalEarned.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={(acc) => console.log('Verified:', acc)}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => {
          router.push(`/campaign/${camp.slug || camp.id}`);
        }}
      />

      {/* MOBILE BOTTOM APP NAVIGATION */}
      <BottomNav
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
