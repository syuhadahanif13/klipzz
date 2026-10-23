'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Scissors,
  Youtube,
  Hash,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Clock,
  ExternalLink,
  Flame,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { BottomNav } from '../../../components/BottomNav';
import { BioChallengeModal } from '../../../components/BioChallengeModal';
import { SubmitClipModal } from '../../../components/SubmitClipModal';
import { CreateCampaignModal } from '../../../components/CreateCampaignModal';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { Campaign, SocialAccount, Submission } from '../../../types';

function withTimeout<T>(promise: PromiseLike<T>, ms = 12000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LOAD_TIMEOUT')), ms)
    ),
  ]);
}

function extractYoutubeId(url?: string, defaultId?: string): string {
  if (defaultId && defaultId.length === 11) return defaultId;
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : '';
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = (params?.id as string) || '';
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [campaignSubmissions, setCampaignSubmissions] = useState<Submission[]>([]);

  // Modals & Interactivity
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRealCampaignData() {
      if (!campaignId) {
        if (isMounted) {
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      setNotFound(false);
      setCampaign(null);

      try {
        let foundCampaign: Campaign | null = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          campaignId
        );

        if (isUuid) {
          const { data: byId, error } = await withTimeout(
            supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle()
          );
          if (error) throw error;
          foundCampaign = (byId as Campaign) || null;
        } else {
          const { data: bySlug, error } = await withTimeout(
            supabase.from('campaigns').select('*').eq('slug', campaignId).maybeSingle()
          );
          if (error) throw error;
          foundCampaign = (bySlug as Campaign) || null;
        }

        if (!foundCampaign) {
          if (isMounted) setNotFound(true);
          return;
        }

        if (isMounted) {
          setCampaign(foundCampaign);
        }

        const { data: dbSubs, error: subsError } = await withTimeout(
          supabase
            .from('submissions')
            .select('*')
            .eq('campaign_id', foundCampaign.id)
            .order('created_at', { ascending: false })
        );

        if (subsError) {
          console.warn('Could not load campaign submissions:', subsError.message);
        } else if (dbSubs && isMounted) {
          setCampaignSubmissions(dbSubs as Submission[]);
        }
      } catch (err: any) {
        console.error('Error fetching campaign detail:', err);
        if (isMounted) {
          if (err?.message === 'LOAD_TIMEOUT') {
            setLoadError('Koneksi ke server terlalu lama. Silakan coba lagi.');
          } else {
            setLoadError('Gagal memuat detail campaign. Silakan coba lagi.');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRealCampaignData();

    return () => {
      isMounted = false;
    };
  }, [campaignId, reloadKey]);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserAccounts() {
      if (!user?.id) {
        if (isMounted) setSocialAccounts([]);
        return;
      }

      try {
        const { data: userAccs } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', user.id);

        if (userAccs && isMounted) {
          setSocialAccounts(userAccs as SocialAccount[]);
        }
      } catch (err) {
        console.error('Error fetching user accounts in campaign detail:', err);
      }
    }

    fetchUserAccounts();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen surface-app flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen surface-app flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 w-full px-5 sm:px-[4vw] flex flex-col items-center justify-center text-center space-y-4 py-24">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-rose-400">
            <RefreshCw className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-fg">Gagal Memuat Campaign</h1>
          <p className="text-xs text-fg-muted leading-relaxed max-w-sm">{loadError}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setReloadKey((key) => key + 1)}
              className="py-2.5 px-6 rounded-full font-semibold text-xs bg-white text-black hover:bg-white/90 transition-all"
            >
              Coba Lagi
            </button>
            <Link
              href="/"
              className="py-2.5 px-6 rounded-full font-semibold text-xs bg-[var(--surface-2)] text-fg border border-[var(--line)] hover:bg-[var(--surface-3)] transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen surface-app flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 w-full px-5 sm:px-[4vw] flex flex-col items-center justify-center text-center space-y-4 py-24">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-amber-400">
            <Flame className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-fg">Campaign Tidak Ditemukan</h1>
          <p className="text-xs text-fg-muted leading-relaxed">
            Episode yang kamu tuju tidak terdaftar atau link salah.
          </p>
          <Link
            href="/"
            className="py-2.5 px-6 rounded-full font-semibold text-xs bg-white text-black hover:bg-white/90 transition-all"
          >
            Kembali ke Semua Campaign
          </Link>
        </main>
      </div>
    );
  }

  const targetCampaign = campaign;
  const hashtagRequirements = Array.isArray(targetCampaign.hashtag_requirements)
    ? targetCampaign.hashtag_requirements
    : [];
  const rewardPool = Number(targetCampaign.reward_pool || 0);
  const remainingPool = Number(targetCampaign.remaining_pool || 0);
  const ratePer1k = Number(targetCampaign.rate_per_1k_views || 0);
  const maxPayout = Number(targetCampaign.max_payout_per_clip || 0);

  const handleCopyTags = () => {
    navigator.clipboard.writeText(hashtagRequirements.join(' '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const videoEmbedId = extractYoutubeId(
    targetCampaign.source_youtube_url,
    targetCampaign.youtube_video_id || undefined
  );

  const remainingPercentage =
    rewardPool > 0
      ? Math.min(100, Math.max(0, Math.round((remainingPool / rewardPool) * 100)))
      : 0;

  const punchlineTimestamps = [
    { time: '04:15', seconds: 255, title: 'Momen Pembuka & Reaksi Panik Guest' },
    { time: '12:30', seconds: 750, title: 'Punchline Utama / Debat Adu Argumen' },
    { time: '21:45', seconds: 1305, title: 'Roasting Keras Arif Brata & Dara' },
    { time: '34:20', seconds: 2060, title: 'Punchline Penutup / Momen Amplop' },
  ];

  return (
    <div className="min-h-screen surface-app flex flex-col antialiased">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 w-full px-5 sm:px-[4vw] py-6 space-y-8 pb-28 md:pb-16">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Semua Campaign</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* HEADER: TITLE, CHANNEL & ACTION BUTTONS                                  */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs font-semibold text-fg">
                  <span>{targetCampaign.channel_name || '@DipanggilKeRuangan'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]" />
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs text-fg-muted font-medium">
                  Guest: {targetCampaign.episode_guest}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--cpm-soft)] border border-[var(--cpm-line)] text-[var(--cpm)] text-xs font-mono font-bold">
                  Aktif Payout
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-fg leading-tight">
                {targetCampaign.title}
              </h1>

              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                {targetCampaign.description}
              </p>
            </div>

            {/* Main Action Callouts */}
            <div className="flex sm:flex-row lg:flex-col gap-2.5 shrink-0 pt-2 lg:pt-0">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-white hover:bg-white/90 text-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Setor Link Klip</span>
              </button>

              <a
                href={`https://en.savefrom.net/20/#url=${encodeURIComponent(targetCampaign?.source_youtube_url || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-5 py-3 rounded-full font-semibold text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-fg border border-[var(--line)] transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Footage</span>
              </a>
            </div>
          </div>

          {/* 3 Metric Pills ala TernakKlip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-fg-subtle font-medium block">Tarif per 1.000 Views (CPM)</span>
              <div className="text-lg font-black text-[var(--cpm)] font-mono">
                Rp {ratePer1k.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
              <div className="flex justify-between items-center text-[11px] text-fg-subtle">
                <span>Sisa Budget Pool</span>
                <span className="font-bold text-fg">{remainingPercentage}%</span>
              </div>
              <div className="text-lg font-black text-fg font-mono">
                Rp {remainingPool.toLocaleString('id-ID')}
              </div>
              <div className="w-full h-1 rounded-full bg-[var(--surface-3)] overflow-hidden mt-1">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
                  style={{ width: `${remainingPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] text-fg-subtle font-medium block">Maksimal Komisi / Klip</span>
              <div className="text-lg font-black text-fg font-mono">
                Rp {maxPayout.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2-COLUMN MAIN: VIDEO PLAYER & DETAILS                                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Player & Timestamps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Iframe Player */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-fg flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Video Footage Resmi</span>
                </span>
                <a
                  href={targetCampaign?.source_youtube_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <span>Buka di YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[var(--line)]">
                {videoEmbedId ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoEmbedId}${
                      activeTimestamp ? `?start=${activeTimestamp}&autoplay=1` : ''
                    }`}
                    title={targetCampaign.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/60">
                    Video sumber belum tersedia.
                  </div>
                )}
              </div>
            </div>

            {/* Punchline Bookmarks */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  <span>Rekomendasi Menit Punchline (Viral Potential)</span>
                </h3>
                <span className="text-[11px] text-fg-subtle">Klik untuk lompat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {punchlineTimestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTimestamp(ts.seconds)}
                    className="p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] transition-all text-left flex items-start gap-2.5 group"
                  >
                    <span className="px-2 py-0.5 rounded-md bg-white/10 group-hover:bg-white text-white group-hover:text-black text-xs font-mono font-bold shrink-0 transition-colors">
                      {ts.time}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-fg group-hover:text-[var(--accent)] block truncate transition-colors">
                        {ts.title}
                      </span>
                      <span className="text-[10px] text-fg-subtle block">
                        Durasi klip ideal 30–60 dtk
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editorial Guidelines (Do's & Don'ts) */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-3">
              <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span>Ketentuan Format Konten</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                  <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[10px]">
                    Wajib Dilakukan:
                  </span>
                  <ul className="space-y-1 text-fg-muted">
                    <li>• Format vertikal 9:16 untuk TikTok / Reels</li>
                    <li>• Pasang subtitle font tebal yang mudah dibaca</li>
                    <li>• Ambil punchline lucu di 3 detik awal (hook)</li>
                    <li>• Wajib cantumkan semua hashtag kampanye</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                  <span className="font-bold text-rose-400 block uppercase tracking-wider text-[10px]">
                    Dilarang Keras:
                  </span>
                  <ul className="space-y-1 text-fg-muted">
                    <li>• Dilarang membuat hoaks atau clickbait SARA</li>
                    <li>• Dilarang reupload tanpa subtitle / crop</li>
                    <li>• Dilarang bot views (terdeteksi auto-reject)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Hashtags, Submissions */}
          <div className="space-y-6">
            {/* HASHTAG BOX */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Hashtag Wajib Postingan</span>
                </h3>
                <button
                  onClick={handleCopyTags}
                  className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-white text-fg hover:text-black border border-[var(--line)] text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  {copiedTags ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTags ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {hashtagRequirements.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs font-medium text-fg"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-[10px] text-fg-subtle leading-relaxed">
                Hashtag ini dicek otomatis oleh scraper Apify saat kamu menyetor video.
              </p>
            </div>

            {/* SUBMISSIONS LIST */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-bold text-fg">Klip yang Sudah Masuk</h3>
                <span className="font-mono text-fg-muted">{campaignSubmissions.length} Klip</span>
              </div>

              {campaignSubmissions.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
                  <Scissors className="w-5 h-5 text-fg-subtle mx-auto -rotate-45" />
                  <p className="text-xs text-fg-muted">Belum ada klip yang disetor untuk episode ini.</p>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="text-xs font-bold text-[var(--accent)] hover:underline pt-1 inline-block"
                  >
                    Jadilah yang Pertama →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {campaignSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[var(--surface-3)] flex items-center justify-center font-bold text-[9px] text-fg uppercase">
                          {sub.platform === 'tiktok' ? 'TT' : 'IG'}
                        </span>
                        <div>
                          <span className="font-bold text-fg block">
                            {Number(sub.current_views || 0).toLocaleString('id-ID')} Views
                          </span>
                          <span className="text-[10px] text-[var(--cpm)] font-mono">
                            Rp {Number(sub.earnings || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <a
                        href={sub.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[var(--surface-3)] hover:bg-white/20 text-fg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        campaign={targetCampaign}
        socialAccounts={socialAccounts}
        onSubmitSuccess={(newSub) => {
          setCampaignSubmissions((prev) => [newSub, ...prev]);
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => {
          router.push(`/campaign/${camp.slug || camp.id}`);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenSubmit={() => setIsSubmitModalOpen(true)}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
