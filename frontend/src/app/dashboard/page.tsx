'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Eye,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  ShieldCheck,
  Heart,
  Share2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { BioChallengeModal } from '../../components/BioChallengeModal';
import { CreateCampaignModal } from '../../components/CreateCampaignModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  MOCK_SOCIAL_ACCOUNTS,
  MOCK_SUBMISSIONS,
} from '../../data/mockData';
import { SocialAccount, Submission } from '../../types';

export default function DashboardPage() {
  const { user, toggleRole } = useAuth();
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(MOCK_SOCIAL_ACCOUNTS);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch live user data from Supabase
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      try {
        // Fetch social accounts
        const { data: accounts } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', user.id);

        if (accounts && accounts.length > 0) {
          setSocialAccounts(accounts as SocialAccount[]);
        }

        // Fetch submissions
        const { data: userSubs } = await supabase
          .from('submissions')
          .select(`
            *,
            campaign:campaigns(id, title, channel_name, episode_guest, rate_per_1k_views)
          `)
          .eq('clipper_id', user.id);

        if (userSubs && userSubs.length > 0) {
          setSubmissions(userSubs as Submission[]);
        }
      } catch (err) {
        console.warn('Using fallback dashboard data:', err);
      }
    }

    loadUserData();
  }, [user]);

  const totalViews = submissions.reduce((sum, s) => sum + s.current_views, 0);
  const totalLikes = submissions.reduce((sum, s) => sum + s.current_likes, 0);

  const handleAccountVerified = (account: SocialAccount) => {
    setSocialAccounts((prev) => [account, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5D5E0] flex items-center gap-2.5">
              <Scissors className="w-6 h-6 text-[#7B337E] -rotate-45" />
              Clipper Studio & Tracking Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#F5D5E0]/70 mt-1">
              Pantau performa views klip TikTok & Reels-mu yang disinkronkan langsung via Apify Scraper Engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBioModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] border border-[#7B337E]/60 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi Akun</span>
            </button>

            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 text-center flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Jelajahi Episode Baru</span>
            </Link>
          </div>
        </div>

        {/* METRICS STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <div className="glass-card rounded-2xl p-5 border border-[#7B337E]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5D5E0]/70">Saldo Dapat Ditarik</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              Rp {(user?.balance || 0).toLocaleString('id-ID')}
            </div>
            <button className="text-[11px] font-bold text-[#F5D5E0] underline hover:text-emerald-300">
              Tarik Saldo ke Rekening / E-Wallet →
            </button>
          </div>

          {/* Total Views */}
          <div className="glass-card rounded-2xl p-5 border border-[#7B337E]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5D5E0]/70">Total Views Klip</span>
              <div className="w-8 h-8 rounded-lg bg-[#6667AB]/20 text-[#6667AB] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#F5D5E0]">
              {totalViews.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Bertumbuh tiap 15 menit
            </span>
          </div>

          {/* Total Likes */}
          <div className="glass-card rounded-2xl p-5 border border-[#7B337E]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5D5E0]/70">Total Likes Klip</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#F5D5E0]">
              {totalLikes.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-[#F5D5E0]/60">Engagement organik verified</span>
          </div>

          {/* Active Submissions */}
          <div className="glass-card rounded-2xl p-5 border border-[#7B337E]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5D5E0]/70">Klip Berjalan</span>
              <div className="w-8 h-8 rounded-lg bg-[#7B337E]/30 text-[#F5D5E0] flex items-center justify-center">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#F5D5E0]">
              {submissions.length} Klip
            </div>
            <span className="text-[11px] text-[#F5D5E0]/60">Status: Approved & Tracking</span>
          </div>
        </div>

        {/* LINKED SOCIAL ACCOUNTS */}
        <section className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-[#F5D5E0]">
                Akun Sosial Media Terverifikasi
              </h2>
            </div>
            <button
              onClick={() => setIsBioModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] border border-[#7B337E]/60 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hubungkan Akun Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {socialAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl bg-[#210635]/80 border border-[#7B337E]/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#420D4B] border border-[#6667AB]/40 flex items-center justify-center font-bold uppercase text-xs text-[#F5D5E0]">
                    {acc.platform === 'tiktok' ? 'TT' : 'IG'}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#F5D5E0] block leading-snug">
                      {acc.handle}
                    </span>
                    <span className="text-[11px] text-[#F5D5E0]/60">
                      {acc.follower_count.toLocaleString('id-ID')} followers
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                  <span className="text-[10px] font-mono text-[#F5D5E0]/50 mt-1">
                    {acc.verification_code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SUBMITTED CLIPS TABLE */}
        <section className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#F5D5E0]">
                Daftar Klip & Penghasilan Real-Time
              </h2>
              <p className="text-xs text-[#F5D5E0]/70">
                Pencatatan metrik views & payout dihitung dari verifikasi link postingan oleh Apify Engine.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#210635] text-[#F5D5E0]/70 uppercase tracking-wider border-b border-[#7B337E]/30">
                <tr>
                  <th className="py-3 px-4">Konten Klip</th>
                  <th className="py-3 px-4">Campaign Episode</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Likes & Shares</th>
                  <th className="py-3 px-4">Komisi Klip</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7B337E]/20">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#420D4B]/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={sub.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200'}
                          alt="thumbnail"
                          className="w-12 h-16 rounded-lg object-cover border border-[#7B337E]/40"
                        />
                        <div className="max-w-xs">
                          <span className="font-semibold text-[#F5D5E0] block line-clamp-1">
                            {sub.caption || 'Klip Komedi'}
                          </span>
                          <span className="text-[10px] text-[#F5D5E0]/50 capitalize">
                            Platform: {sub.platform}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium text-[#F5D5E0]">
                      {sub.campaign?.episode_guest || 'DiPanggil ke Ruangan'}
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-[#F5D5E0] text-sm flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#6667AB]" />
                        {sub.current_views.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[#F5D5E0]/80">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Heart className="w-3 h-3 text-rose-400" />
                          {sub.current_likes.toLocaleString('id-ID')}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#F5D5E0]/60">
                          <Share2 className="w-3 h-3 text-[#6667AB]" />
                          {sub.current_shares.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-extrabold text-emerald-400 text-sm">
                        Rp {sub.earnings.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {sub.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <a
                        href={sub.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] text-[11px] font-semibold transition-colors"
                      >
                        <span>Lihat Video</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={handleAccountVerified}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => console.log('Created:', camp)}
      />
    </div>
  );
}
