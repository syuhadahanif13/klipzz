'use client';

import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Search,
  CheckCircle2,
  Play,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { BioChallengeModal } from '../components/BioChallengeModal';
import { SubmitClipModal } from '../components/SubmitClipModal';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { CampaignDetailModal } from '../components/CampaignDetailModal';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Campaign, SocialAccount } from '../types';

type FilterTab = 'all' | 'newest' | 'highest_budget' | 'highest_rate';

export default function HomePage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(true);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  // Hero Carousel
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);
  const [heroPaused, setHeroPaused] = useState(false);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculator
  const [viewsEstimate, setViewsEstimate] = useState<number>(50000);

  // Modals
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchLivePlatformData() {
      setIsLoadingCampaigns(true);
      try {
        const { data: dbCampaigns } = await supabase
          .from('campaigns')
          .select('*')
          .neq('status', 'draft')
          .order('created_at', { ascending: false });

        // Never fall back to mock campaigns: an empty database must look empty.
        setCampaigns((dbCampaigns as Campaign[]) || []);
      } catch (e) {
        console.error('Error fetching platform data:', e);
      } finally {
        setIsLoadingCampaigns(false);
      }
    }
    fetchLivePlatformData();
  }, []);

  useEffect(() => {
    async function fetchUserAccounts() {
      if (!user) { setSocialAccounts([]); return; }
      try {
        const { data } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', user.id);
        if (data) setSocialAccounts(data as SocialAccount[]);
      } catch (err) {
        console.warn('Failed to load user social accounts:', err);
      }
    }
    fetchUserAccounts();
  }, [user?.id]);

  // Auto-advance hero carousel
  useEffect(() => {
    if (campaigns.length <= 1 || heroPaused) return;
    const t = setInterval(() => {
      setActiveHeroIndex((i) => (i + 1) % Math.min(campaigns.length, 5));
    }, 7000);
    return () => clearInterval(t);
  }, [campaigns.length, heroPaused]);

  const openSubmitFor = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setIsSubmitModalOpen(true);
  };

  const openCreatorKit = (camp: Campaign) => {
    setDetailCampaign(camp);
  };

  // Filter & Sort
  const filteredCampaigns = campaigns
    .filter((camp) => {
      const q = searchQuery.toLowerCase();
      return (
        camp.title.toLowerCase().includes(q) ||
        (camp.episode_guest || '').toLowerCase().includes(q) ||
        (camp.channel_name || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (activeTab === 'newest') {
        const dB = new Date(b.created_at || b.start_date || '').getTime() || 0;
        const dA = new Date(a.created_at || a.start_date || '').getTime() || 0;
        return dB - dA;
      }
      if (activeTab === 'highest_budget') {
        return (Number(b.remaining_pool) || 0) - (Number(a.remaining_pool) || 0);
      }
      if (activeTab === 'highest_rate') {
        return (Number(b.rate_per_1k_views) || 0) - (Number(a.rate_per_1k_views) || 0);
      }
      return 0;
    });

  const featuredCampaigns = campaigns.slice(0, 5);
  const featuredCampaign = featuredCampaigns[activeHeroIndex] ?? campaigns[0] ?? null;

  // Calculator — derive the best available rate instead of hardcoding one.
  const maxPayoutPerClip = campaigns.reduce(
    (max, camp) => Math.max(max, Number(camp.max_payout_per_clip) || 0),
    0
  ) || 1_500_000;
  const calculatorRate = campaigns.reduce(
    (max, camp) => Math.max(max, Number(camp.rate_per_1k_views) || 0),
    0
  ) || 15_000;
  const rawEarnings = Math.round((viewsEstimate / 1000) * calculatorRate);
  const isCapped = rawEarnings >= maxPayoutPerClip;
  const estimatedEarnings = Math.min(rawEarnings, maxPayoutPerClip);

  return (
    <div className="min-h-screen surface-app flex flex-col antialiased">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 pb-24 md:pb-6">

        {/* ============================================================
            HERO — Full-bleed cinematic banner (ala TernakKlip)
            ============================================================ */}
        {featuredCampaign ? (
        <section
          aria-label="Featured campaigns"
          className="relative w-full shrink-0"
        >
          {/* Full-bleed image container */}
          <div className="relative overflow-hidden bg-surface-2"
            style={{ height: 'clamp(21rem,52vh,27rem)' }}>

            {/* Background image */}
            <img
              src={featuredCampaign.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1600'}
              alt={featuredCampaign.title}
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.03] transition-opacity duration-700"
            />

            {/* Gradient overlays — exactly TernakKlip style */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgb(0 0 0 / 0.85), rgb(0 0 0 / 0.42) 42%, transparent 72%)' }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.75), transparent 44%)' }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 sm:hidden"
              style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.9), rgb(0 0 0 / 0.6) 52%, transparent 88%)' }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28"
              style={{ background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent)' }}
            />

            {/* Hero Content */}
            <div className="relative flex h-full flex-col justify-end pt-24 pb-16 sm:pb-20">
              <div className="w-full px-5 sm:px-[4vw]">
                <div className="flex max-w-xl flex-col items-start gap-3">
                  {/* Brand / channel */}
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[0.75rem] font-medium text-white/80 sm:text-[0.875rem]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {featuredCampaign.channel_name || 'klipzz.vid'}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  </div>

                  {/* Title */}
                  <h2 className="line-clamp-3 text-[1.4rem] leading-[1.1] font-semibold text-white sm:text-[2.25rem]">
                    {featuredCampaign.title}
                  </h2>

                  {/* Rate & budget */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.875rem] text-white/65">
                    <span>Campaign</span>
                    <span className="font-semibold text-white">
                      Rp {(Number(featuredCampaign.rate_per_1k_views) || 0).toLocaleString('id-ID')} / 1k views
                    </span>
                    <span>
                      Rp {((Number(featuredCampaign.remaining_pool) || 0) / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt tersisa
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => openCreatorKit(featuredCampaign)}
                      className="flex h-11 flex-1 items-center justify-center rounded-[40px] bg-white px-5 text-[0.875rem] font-semibold whitespace-nowrap text-black transition-colors hover:bg-white/90 sm:flex-none sm:px-7"
                    >
                      Buka Creator Kit
                    </button>
                    <button
                      onClick={() => openSubmitFor(featuredCampaign)}
                      className="flex h-11 flex-1 items-center justify-center rounded-[40px] border border-white/30 px-5 text-[0.875rem] font-medium whitespace-nowrap text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:flex-none sm:px-6"
                    >
                      <Scissors className="w-4 h-4 -rotate-45 mr-2" />
                      Setor Klip
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel dots — bottom left (TernakKlip style) */}
            {featuredCampaigns.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
                <div className="w-full px-5 sm:px-[4vw] flex justify-start pb-4 sm:pb-5">
                  <div className="pointer-events-auto flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur-md">
                    <div className="flex items-center gap-1">
                      {featuredCampaigns.map((_, idx) => (
                        <button
                          key={idx}
                          aria-label={`Slide ${idx + 1}`}
                          onClick={() => { setActiveHeroIndex(idx); setHeroPaused(true); }}
                          className="py-1.5"
                        >
                          <span
                            className={`block h-1 overflow-hidden rounded-full transition-[width] duration-300 ${
                              activeHeroIndex === idx ? 'w-8 bg-white/70' : 'w-2 bg-white/25'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      aria-label={heroPaused ? 'Resume' : 'Pause'}
                      onClick={() => setHeroPaused((p) => !p)}
                      className="grid size-5 shrink-0 place-items-center rounded text-white/50 hover:text-white transition-colors"
                    >
                      {heroPaused ? (
                        <Play className="size-3 fill-current" />
                      ) : (
                        <span className="flex gap-0.5">
                          <span className="w-0.5 h-3 bg-current rounded" />
                          <span className="w-0.5 h-3 bg-current rounded" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        ) : (
          <section
            aria-label="No active campaigns"
            className="w-full border-b border-[var(--line)] bg-[var(--surface)]"
          >
            <div className="mx-auto flex min-h-[16rem] max-w-3xl flex-col items-center justify-center gap-3 px-5 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center">
                <Scissors className="w-6 h-6 -rotate-45 text-fg-muted" />
              </div>
              <h2 className="text-lg font-semibold text-fg">Belum ada campaign aktif</h2>
              <p className="text-sm text-fg-muted max-w-md">
                Campaign baru akan tampil di sini setelah brand menerbitkannya. Cek kembali nanti.
              </p>
            </div>
          </section>
        )}

        {/* ============================================================
            DISCOVER BAR — Filter tabs + search (TernakKlip style)
            ============================================================ */}
        <div className="w-full px-5 sm:px-[4vw] pt-5 flex flex-wrap items-center gap-x-3 sm:h-14 sm:flex-nowrap border-b border-[var(--line)]">

          {/* Sort tabs + search */}
          <div className="order-last flex h-11 min-w-0 basis-full items-center gap-2 sm:order-none sm:contents">
            <div className="relative h-full min-w-0 flex-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10"
                style={{ background: 'linear-gradient(to left, var(--bg) 20%, transparent)' }}
              />
              <div role="tablist" id="campaigns-section" className="no-scrollbar flex h-full items-stretch gap-0.5 overflow-x-auto">
                {[
                  { id: 'all', label: 'Terbaru' },
                  { id: 'newest', label: 'Newest' },
                  { id: 'highest_budget', label: 'Budget Terbesar' },
                  { id: 'highest_rate', label: 'CPM Tertinggi' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id as FilterTab)}
                    className={`relative flex h-full shrink-0 items-center px-3 text-[0.9375rem] font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id ? 'text-fg' : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 bottom-0 h-0.5 rounded-t bg-[var(--accent)]"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative flex h-9 shrink-0 items-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface-2)] w-9 sm:w-56 transition-all focus-within:w-64 focus-within:border-[var(--line-hover)]">
              <span className="pointer-events-none absolute left-0 grid size-9 place-items-center text-fg-muted">
                <Search className="size-[1rem]" />
              </span>
              <input
                type="search"
                aria-label="Cari campaign"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari campaign..."
                className="h-full w-full bg-transparent pl-9 pr-3 text-[0.875rem] outline-none placeholder:text-fg-subtle text-fg"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            CAMPAIGN GRID — Clean cards ala TernakKlip
            ============================================================ */}
        <div className="w-full px-5 sm:px-[4vw] mt-6">
          {isLoadingCampaigns ? (
            <div className="grid w-full gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,18.75rem),1fr))]">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden animate-pulse">
                  <div className="h-[11.5rem] bg-[var(--surface-2)]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-[var(--surface-3)] rounded w-1/3" />
                    <div className="h-4 bg-[var(--surface-3)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--surface-3)] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-fg-muted text-sm">
                {searchQuery
                  ? `Tidak ada campaign yang cocok dengan "${searchQuery}".`
                  : 'Belum ada campaign aktif.'}
              </p>
            </div>
          ) : (
            <div className="grid w-full items-start gap-2.5 grid-cols-[repeat(auto-fill,minmax(min(100%,18.75rem),1fr))]">
              {filteredCampaigns.map((camp) => {
                const pool = Number(camp.reward_pool) || 1;
                const rem = Number(camp.remaining_pool) || 0;
                const pct = Math.min(100, Math.max(0, Math.round((rem / pool) * 100)));
                const rate = Number(camp.rate_per_1k_views) || 0;
                const rateLabel =
                  rate >= 1000
                    ? `Rp ${(rate / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}rb/1K`
                    : `Rp ${rate}/1K`;

                return (
                  <div
                    key={camp.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition-colors duration-300 hover:border-[var(--accent-line)]"
                  >
                    {/* Thumbnail */}
                    <div className="p-1 pb-0">
                      <div className="relative h-[11.5rem] w-full overflow-hidden rounded-xl bg-[var(--surface-2)]">
                        <img
                          src={camp.thumbnail_url}
                          alt={camp.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                          style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.7), transparent)' }}
                        />
                        {/* Guest pill */}
                        {camp.episode_guest && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                            {camp.episode_guest}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex min-h-[7.75rem] flex-col gap-2 px-4 pt-3 pb-2">
                      {/* Channel + platforms */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-[0.8125rem] leading-none font-medium text-fg">
                            {camp.channel_name || 'klipzz.vid'}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--accent)] fill-[var(--accent)]" />
                        </span>
                        <span className="text-[0.6875rem] text-fg-subtle shrink-0">
                          {camp.status === 'active' ? 'Aktif' : camp.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold text-fg">
                        {camp.title}
                      </h3>

                      {/* Budget & CPM */}
                      <div className="mt-auto flex min-w-0 items-center justify-between gap-2">
                        <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap text-[0.75rem] text-fg-subtle">
                          <span className="text-[0.8125rem] font-bold text-fg">{pct}%</span> budget left
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className="flex items-center gap-1 rounded-full border border-[var(--cpm-line)] bg-[var(--cpm-soft)] px-2.5 py-0.5 text-[0.6875rem] font-bold text-[var(--cpm)]">
                            {rateLabel}
                          </span>
                        </span>
                      </div>

                      {/* Hover reveal: action */}
                      <div className="-my-1 grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
                        <div className="overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                          <div className="flex items-center gap-2 pt-2 pb-1">
                            <button
                              type="button"
                              onClick={() => openCreatorKit(camp)}
                              className="relative z-10 flex h-9 items-center rounded-full bg-[var(--accent)] px-4 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                            >
                              Buka Creator Kit
                            </button>
                            <button
                              onClick={() => openSubmitFor(camp)}
                              className="relative z-10 flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 text-[0.8125rem] font-medium text-fg-muted hover:text-fg transition-colors"
                            >
                              <Scissors className="w-3.5 h-3.5 -rotate-45" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget progress bar */}
                    <div className="h-[3px] w-full bg-[var(--surface-3)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Full-card click target */}
                    <button
                      type="button"
                      onClick={() => openCreatorKit(camp)}
                      className="absolute inset-0 rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      <span className="sr-only">Lihat detail {camp.title}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================
            KALKULATOR CUAN
            ============================================================ */}
        <div className="w-full px-5 sm:px-[4vw] mt-12">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Left: description */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5" />
                  Kalkulator Penghasilan
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-fg leading-snug">
                  Simulasi Cuan dari Views-mu
                </h2>
                <p className="text-[0.875rem] text-fg-muted leading-relaxed max-w-sm">
                  Tiap 1.000 views di TikTok / Reels menghasilkan komisi otomatis. Geser slider untuk proyeksi dari 1 klip video.
                </p>

                {/* View presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: '25K', value: 25000 },
                    { label: '50K FYP', value: 50000 },
                    { label: '150K Viral', value: 150000 },
                    { label: '500K Mega', value: 500000 },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setViewsEstimate(p.value)}
                      className={`px-3 py-1 rounded-full text-[0.8125rem] font-medium transition-all border ${
                        viewsEstimate === p.value
                          ? 'bg-white text-black border-white font-bold'
                          : 'border-[var(--line)] text-fg-muted hover:text-fg hover:border-[var(--line-hover)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: slider + result */}
              <div className="w-full lg:max-w-sm bg-[var(--surface-2)] rounded-2xl p-5 border border-[var(--line)] space-y-5">
                <div>
                  <div className="flex justify-between items-center text-[0.8125rem] mb-2">
                    <span className="text-fg-muted">Estimasi Views:</span>
                    <span className="text-fg font-mono font-bold">
                      {viewsEstimate.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="1000000"
                    step="5000"
                    value={viewsEstimate}
                    onChange={(e) => setViewsEstimate(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--surface-3)] accent-[var(--accent)]"
                  />
                </div>

                <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-4 text-center space-y-0.5">
                  <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-fg-subtle">
                    Estimasi Komisi
                  </span>
                  <div className="text-3xl font-black text-[var(--cpm)] font-mono tracking-tight">
                    Rp {estimatedEarnings.toLocaleString('id-ID')}
                  </div>
                  {isCapped && (
                    <p className="text-[0.6875rem] text-amber-400 pt-0.5">
                      *Maks. Rp {maxPayoutPerClip.toLocaleString('id-ID')} per klip
                    </p>
                  )}
                </div>

                <button
                  onClick={() => document.getElementById('campaigns-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full h-10 rounded-full font-semibold text-[0.875rem] bg-white text-black hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  Pilih Episode Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            3-STEP GUIDE
            ============================================================ */}
        <div className="w-full px-5 sm:px-[4vw] mt-10 mb-4">
          <h2 className="text-lg font-semibold text-fg mb-4">Cara Kerja klipzz.vid</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                n: '1',
                title: 'Pilih Episode & Creator Kit',
                desc: 'Tonton cuplikan podcast, unduh footage resolusi asli, dan cek momen punchline lucu.',
              },
              {
                n: '2',
                title: 'Edit & Upload ke TikTok / Reels',
                desc: 'Potong 30–60 detik vertikal 9:16, pasang subtitle rapi, dan sertakan hashtag wajib di caption.',
              },
              {
                n: '3',
                title: 'Setor Link & Cairkan Komisi',
                desc: 'Tempel link video. Sistem otomatis menghitung views dan komisi masuk ke saldo dompetmu.',
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-2"
              >
                <span className="w-7 h-7 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-fg border border-[var(--line)]">
                  {s.n}
                </span>
                <h4 className="text-[0.875rem] font-semibold text-fg">{s.title}</h4>
                <p className="text-[0.8125rem] text-fg-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={(acc) => setSocialAccounts((prev) => [acc, ...prev])}
      />
      <SubmitClipModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={selectedCampaign}
        socialAccounts={socialAccounts}
        onSubmitSuccess={() => {
          // The modal closes on success; dashboard shows the new submission.
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => {
          setCampaigns((prev) => [camp, ...prev]);
          setDetailCampaign(camp);
        }}
      />
      <CampaignDetailModal
        isOpen={Boolean(detailCampaign)}
        campaign={detailCampaign}
        onClose={() => setDetailCampaign(null)}
        socialAccounts={socialAccounts}
        onAccountVerified={(acc) => setSocialAccounts((prev) => [acc, ...prev])}
      />
      <BottomNav
        onOpenSubmit={() => { if (campaigns.length > 0) openSubmitFor(campaigns[0]); }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
