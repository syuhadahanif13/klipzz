'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
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
    <div className="min-h-screen surface-app flex flex-col antialiased">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 w-full px-5 sm:px-[4vw] py-6 sm:py-8 space-y-10 pb-24 md:pb-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-fg border border-[var(--line)] text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Hall of Fame Komunitas
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-fg">
            Top Clipper Bulan Ini
          </h1>
          <p className="text-xs sm:text-sm text-fg-muted">
            Daftar pembuat klip paling produktif dan berpenghasilan tertinggi dari kampanye video klipzz.vid.
          </p>
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 items-end">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-[var(--surface)] border border-[var(--line)]" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-[var(--surface)] border border-[var(--line)]" />
          </div>
        ) : topClippers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-amber-400 mx-auto">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-fg">Papan Peringkat Sedang Berjalan</h2>
              <p className="text-xs text-fg-muted leading-relaxed">
                Belum ada clipper yang mengklaim komisi di bulan ini. Jadilah yang pertama menyetor klip dan raih posisi juara 1!
              </p>
            </div>
            <Link
              href="/"
              className="inline-block py-2.5 px-6 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 shadow-md transition-all"
            >
              Mulai Gunting Klip Sekarang
            </Link>
          </div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 items-end">
              {/* Rank 2 (Silver) */}
              {topClippers[1] && (
                <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--line)] text-center space-y-3 relative order-2 md:order-1">
                  <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black text-sm flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 shadow-md">
                    2
                  </div>
                  <img
                    src={topClippers[1].avatar}
                    alt={topClippers[1].username}
                    className="w-20 h-20 rounded-2xl mx-auto border-2 border-slate-300/60 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-base text-fg">{topClippers[1].fullName}</h3>
                    <span className="text-xs text-fg-subtle font-semibold">{topClippers[1].username}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)]">
                    <span className="text-xs text-fg-subtle block">Penghasilan</span>
                    <span className="text-lg font-black text-[var(--cpm)] font-mono">
                      Rp {topClippers[1].totalEarned.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-fg-subtle block mt-1">
                      {topClippers[1].totalViews.toLocaleString('id-ID')} views • {topClippers[1].clipsCount} klip
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold - Elevated) */}
              {topClippers[0] && (
                <div className="rounded-2xl p-8 bg-[var(--surface)] border border-amber-400/50 text-center space-y-4 relative order-1 md:order-2 shadow-lg -mt-4">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center absolute -top-5 left-1/2 -translate-x-1/2 shadow-md">
                    👑
                  </div>
                  <img
                    src={topClippers[0].avatar}
                    alt={topClippers[0].username}
                    className="w-24 h-24 rounded-2xl mx-auto border-4 border-amber-400 object-cover shadow-md"
                  />
                  <div>
                    <h3 className="font-extrabold text-lg text-fg">{topClippers[0].fullName}</h3>
                    <span className="text-xs text-amber-400 font-bold">{topClippers[0].username}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)]">
                    <span className="text-xs text-fg-subtle block font-medium">Juara 1 Bulan Ini</span>
                    <span className="text-2xl font-black text-[var(--cpm)] font-mono">
                      Rp {topClippers[0].totalEarned.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-fg-muted block mt-1 font-semibold">
                      {topClippers[0].totalViews.toLocaleString('id-ID')} views • {topClippers[0].clipsCount} klip
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topClippers[2] && (
                <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--line)] text-center space-y-3 relative order-3">
                  <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 shadow-md">
                    3
                  </div>
                  <img
                    src={topClippers[2].avatar}
                    alt={topClippers[2].username}
                    className="w-20 h-20 rounded-2xl mx-auto border-2 border-amber-700/60 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-base text-fg">{topClippers[2].fullName}</h3>
                    <span className="text-xs text-fg-subtle font-semibold">{topClippers[2].username}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)]">
                    <span className="text-xs text-fg-subtle block">Penghasilan</span>
                    <span className="text-lg font-black text-[var(--cpm)] font-mono">
                      Rp {topClippers[2].totalEarned.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-fg-subtle block mt-1">
                      {topClippers[2].totalViews.toLocaleString('id-ID')} views • {topClippers[2].clipsCount} klip
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* FULL LEADERBOARD TABLE */}
            <div className="rounded-2xl p-6 bg-[var(--surface)] border border-[var(--line)] space-y-4">
              <h2 className="text-lg font-bold text-fg">
                Peringkat Keseluruhan
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--line)] text-fg-subtle uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Kreator</th>
                      <th className="py-3 px-4">Total Views Klip</th>
                      <th className="py-3 px-4">Jumlah Klip</th>
                      <th className="py-3 px-4 text-right">Total Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {topClippers.map((clp) => (
                      <tr key={clp.rank} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3.5 px-4 font-black text-sm text-fg">
                          #{clp.rank}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={clp.avatar}
                              alt={clp.username}
                              className="w-9 h-9 rounded-xl object-cover border border-[var(--line)]"
                            />
                            <div>
                              <span className="font-bold text-fg block">{clp.fullName}</span>
                              <span className="text-[11px] text-fg-subtle font-medium">{clp.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-fg font-mono">
                          {clp.totalViews.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-fg-muted font-mono">
                          {clp.clipsCount} Klip
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-[var(--cpm)] font-mono text-sm">
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
