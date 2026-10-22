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
  XCircle,
  Play,
  Wallet,
  Sparkles,
  Copy,
  Check,
  Download,
  Clock,
  Eye,
  Heart,
  ExternalLink,
  Share2,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { BottomNav } from '../../../components/BottomNav';
import { BioChallengeModal } from '../../../components/BioChallengeModal';
import { SubmitClipModal } from '../../../components/SubmitClipModal';
import { CreateCampaignModal } from '../../../components/CreateCampaignModal';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { Campaign, SocialAccount, Submission } from '../../../types';

function extractYoutubeId(url?: string, defaultId?: string): string {
  if (defaultId && defaultId.length === 11) return defaultId;
  if (!url) return 'DHiELGxnAS4';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : (defaultId || 'DHiELGxnAS4');
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = (params?.id as string) || '';
  const { user } = useAuth();

  // Cek apakah parameter berupa UUID atau slug (misal abdur-mamat)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [campaignSubmissions, setCampaignSubmissions] = useState<Submission[]>([]);

  // State modal aksi
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [submitSuccessNotice, setSubmitSuccessNotice] = useState<string | null>(null);

  // Menit video aktif yang diklik
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRealCampaignData() {
      setIsLoading(true);
      setNotFound(false);

      try {
        // Ambil data campaign langsung dari Supabase (bisa lewat slug atau UUID)
        const query = supabase.from('campaigns').select('*');
        const { data: dbCampaign, error: campErr } = isUuid
          ? await query.eq('id', campaignId).maybeSingle()
          : await query.eq('slug', campaignId).maybeSingle();

        if (campErr || !dbCampaign) {
          if (isMounted) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setCampaign(dbCampaign as Campaign);
        }

        // Ambil klip yang sudah disetor khusus untuk campaign ini
        const { data: dbSubs } = await supabase
          .from('submissions')
          .select('*')
          .eq('campaign_id', dbCampaign.id)
          .order('created_at', { ascending: false });

        if (dbSubs && isMounted) {
          setCampaignSubmissions(dbSubs as Submission[]);
        }

        // Akun sosmed hanya diambil kalau user sudah login
        if (user) {
          const { data: userAccs } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', user.id);

          if (userAccs && isMounted) {
            setSocialAccounts(userAccs as SocialAccount[]);
          }
        } else {
          if (isMounted) {
            setSocialAccounts([]);
          }
        }
      } catch (err) {
        console.error('Error fetching campaign from Supabase:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (campaignId) {
      loadRealCampaignData();
    }
    return () => {
      isMounted = false;
    };
  }, [campaignId, isUuid, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
          <div className="h-6 w-36 bg-[#420D4B]/60 rounded-xl" />
          <div className="h-72 rounded-3xl bg-[#420D4B]/40 border border-[#7B337E]/40" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-[#420D4B]/30" />
            <div className="h-96 rounded-2xl bg-[#420D4B]/30" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 flex flex-col items-center justify-center text-center space-y-5 py-24">
          <div className="w-16 h-16 rounded-2xl bg-[#420D4B] border border-[#7B337E]/60 flex items-center justify-center text-[#6667AB] shadow-moon-glow">
            <Flame className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-[#F5D5E0]">Campaign Tidak Ditemukan</h1>
            <p className="text-xs text-[#F5D5E0]/70 leading-relaxed">
              Episode campaign yang kamu tuju tidak terdaftar atau link salah. Silakan periksa kembali daftar episode aktif di beranda.
            </p>
          </div>
          <Link
            href="/"
            className="py-3 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow"
          >
            Kembali ke Semua Campaign
          </Link>
        </main>
      </div>
    );
  }

  const targetCampaign = campaign;
  const hashtagRequirements =
    targetCampaign.hashtag_requirements && targetCampaign.hashtag_requirements.length > 0
      ? targetCampaign.hashtag_requirements
      : ['#DipanggilKeRuangan', '#KlipzzViral'];
  const rewardPool = Number(targetCampaign.reward_pool) || 25000000;
  const remainingPool = Number(targetCampaign.remaining_pool) || 16800000;
  const ratePer1k = Number(targetCampaign.rate_per_1k_views) || 18000;
  const minViews = Number(targetCampaign.min_views_threshold) || 1000;
  const maxPayout = Number(targetCampaign.max_payout_per_clip) || 2000000;

  const handleCopyTags = () => {
    navigator.clipboard.writeText(hashtagRequirements.join(' '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const videoEmbedId = extractYoutubeId(
    targetCampaign.source_youtube_url,
    targetCampaign.youtube_video_id || 'DHiELGxnAS4'
  );

  const claimedPercentage = rewardPool > 0
    ? Math.min(100, Math.max(0, Math.round(((rewardPool - remainingPool) / rewardPool) * 100)))
    : 30;

  const punchlineTimestamps = [
    { time: '04:15', seconds: 255, title: 'Momen Pembuka & Reaksi Panik Guest' },
    { time: '12:30', seconds: 750, title: 'Punchline Utama / Debat Adu Argumen' },
    { time: '21:45', seconds: 1305, title: 'Roasting Keras Arif Brata & Dara' },
    { time: '34:20', seconds: 2060, title: 'Punchline Penutup / Momen Amplop' },
  ];

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      {/* Floating Success Banner */}
      {submitSuccessNotice && (
        <div className="sticky top-20 z-50 max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400/60 shadow-moon-glow flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{submitSuccessNotice}</span>
            </div>
            <Link
              href="/dashboard"
              className="font-bold underline text-emerald-300 hover:text-white"
            >
              Lihat di Dashboard →
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-24 md:pb-12">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5D5E0]/70 hover:text-[#F5D5E0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Semua Campaign</span>
          </Link>
        </div>

        {/* HERO CAMPAIGN HEADER */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 border border-[#7B337E]/40 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#7B337E]/40 text-[#F5D5E0] border border-[#7B337E]/60 text-xs font-bold">
                  {targetCampaign.channel_name || '@DipanggilKeRuangan'}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#420D4B] text-[#6667AB] border border-[#6667AB]/40 text-xs font-bold">
                  Bintang Tamu: {targetCampaign.episode_guest}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold">
                  Status: Active Payout
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#F5D5E0] leading-tight">
                {targetCampaign.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#F5D5E0]/80">
                {targetCampaign.description}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Submit Klip Sekarang</span>
              </button>
            </div>
          </div>

          {/* Budget Pool Bar */}
          <div className="p-4 rounded-2xl bg-[#210635]/80 border border-[#7B337E]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="text-[#F5D5E0]/70 font-semibold">
                Alokasi Dana Tersisa: <strong className="text-emerald-400 font-bold">Rp {remainingPool.toLocaleString('id-ID')}</strong> dari Rp {rewardPool.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-extrabold text-[#F5D5E0]">
                Tarif Komisi: <span className="text-emerald-400">Rp {ratePer1k.toLocaleString('id-ID')}</span> / 1.000 Views
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#420D4B] overflow-hidden border border-[#7B337E]/40">
              <div
                className="h-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] rounded-full transition-all duration-500"
                style={{ width: `${claimedPercentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* 2-COLUMN MAIN CONTENT: VIDEO & CREATOR KIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Video Player & Punchline Bookmarks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Embedded Video Player */}
            <div className="glass-card rounded-2xl p-4 sm:p-6 border border-[#7B337E]/40 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-[#F5D5E0] flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span>Video Podcast Asli (Source Footage)</span>
                </h2>
                <a
                  href={targetCampaign.source_youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#6667AB] hover:text-[#F5D5E0] flex items-center gap-1"
                >
                  <span>Buka di YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* YouTube Iframe Player */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#7B337E]/40 shadow-inner">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoEmbedId}${activeTimestamp ? `?start=${activeTimestamp}&autoplay=1` : ''}`}
                  title={targetCampaign.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Footage Download & Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-[#F5D5E0]/60">
                  Resolusi Asli: 1080p 60fps • Format Vertikal 9:16 disarankan
                </span>
                <a
                  href={`https://en.savefrom.net/20/#url=${encodeURIComponent(targetCampaign.source_youtube_url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#420D4B] hover:bg-[#7B337E] text-xs font-semibold text-[#F5D5E0] border border-[#7B337E]/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Footage Video</span>
                </a>
              </div>
            </div>

            {/* PUNCHLINE BOOKMARKS / TIMESTAMPS */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F5D5E0] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6667AB]" />
                  <span>Rekomendasi Menit Punchline (Viral Potential)</span>
                </h3>
                <span className="text-xs text-[#F5D5E0]/60">Klik untuk lompat ke menit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {punchlineTimestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTimestamp(ts.seconds)}
                    className="p-3.5 rounded-xl bg-[#210635]/80 hover:bg-[#420D4B] border border-[#7B337E]/40 hover:border-[#6667AB] transition-all text-left flex items-start gap-3 group"
                  >
                    <div className="px-2 py-1 rounded-lg bg-[#7B337E]/40 group-hover:bg-[#7B337E] text-xs font-mono font-bold text-[#F5D5E0] shrink-0">
                      {ts.time}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#F5D5E0] block leading-snug group-hover:text-emerald-300 transition-colors">
                        {ts.title}
                      </span>
                      <span className="text-[10px] text-[#F5D5E0]/50 mt-0.5 block">
                        Durasi klip ideal: 30 - 60 detik
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CREATOR GUIDELINES (DO'S & DON'TS) */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
              <h3 className="text-base font-bold text-[#F5D5E0] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6667AB]" />
                <span>Panduan Editorial & Standar Kualitas Klip</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DO's */}
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Wajib Dilakukan (Do's):
                  </span>
                  <ul className="space-y-2 text-xs text-[#F5D5E0]/90">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Fokus pada punchline lucu, reaksi mimik wajah, dan momen kaget.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Gunakan subtitle dinamis dengan font tebal (Komika Axis / Bold).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Sertakan hook visual atau teks pancingan di 3 detik awal.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Wajib sertakan seluruh hashtag kampanye di caption video.</span>
                    </li>
                  </ul>
                </div>

                {/* DONT's */}
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2.5">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                    Dilarang Keras (Don'ts):
                  </span>
                  <ul className="space-y-2 text-xs text-[#F5D5E0]/90">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>Dilarang membuat clickbait hoaks atau menggiring opini negatif SARA.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>Dilarang reupload mentah tanpa crop 9:16 atau tanpa subtitle.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>Dilarang menutup muka pembicara dengan watermark pribadi terlalu besar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>Dilarang menggunakan bot views (terdeteksi auto-reject oleh Apify).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Creator Kit, Hashtags, Payout Terms */}
          <div className="space-y-6">
            {/* HASHTAG BOX */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F5D5E0] flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-[#6667AB]" />
                  <span>Hashtag Wajib</span>
                </h3>
                <button
                  onClick={handleCopyTags}
                  className="p-1.5 rounded-lg bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] text-xs flex items-center gap-1 transition-colors"
                  title="Salin Semua Hashtag"
                >
                  {copiedTags ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTags ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {hashtagRequirements.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl bg-[#210635] border border-[#7B337E]/50 text-xs font-semibold text-[#F5D5E0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-[#F5D5E0]/60">
                Sistem Apify Scraper Engine akan memeriksa keberadaan hashtag ini secara otomatis di caption TikTok atau Instagram Reels kamu.
              </p>
            </div>

            {/* PAYOUT TERMS */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-3">
              <h3 className="text-sm font-bold text-[#F5D5E0]">
                Ketentuan Pembayaran Komisi
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#7B337E]/20">
                  <span className="text-[#F5D5E0]/60">Tarif per 1.000 Views</span>
                  <span className="font-extrabold text-emerald-400">
                    Rp {ratePer1k.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#7B337E]/20">
                  <span className="text-[#F5D5E0]/60">Minimal Views Awal</span>
                  <span className="font-bold text-[#F5D5E0]">
                    {minViews.toLocaleString('id-ID')} views
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#7B337E]/20">
                  <span className="text-[#F5D5E0]/60">Maksimal Komisi / Klip</span>
                  <span className="font-bold text-emerald-400">
                    Rp {maxPayout.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-[#F5D5E0]/60">Interval Sinkronisasi Apify</span>
                  <span className="font-bold text-[#6667AB]">Setiap 15 Menit</span>
                </div>
              </div>

              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Submit Link Video Klip</span>
              </button>
            </div>

            {/* RECENT SUBMISSIONS ON THIS CAMPAIGN */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-3">
              <h3 className="text-sm font-bold text-[#F5D5E0] flex items-center justify-between">
                <span>Klip yang Sudah Disetor</span>
                <span className="text-xs text-[#6667AB] font-semibold">{campaignSubmissions.length} Klip</span>
              </h3>

              {campaignSubmissions.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#210635]/60 border border-[#7B337E]/30 space-y-2">
                  <Scissors className="w-6 h-6 text-[#6667AB] mx-auto -rotate-45" />
                  <p className="text-xs text-[#F5D5E0]/70">
                    Belum ada klip yang disetor untuk episode ini.
                  </p>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="text-xs font-bold text-emerald-400 hover:underline inline-block pt-1"
                  >
                    Setor Klip Pertama →
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {campaignSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-[#210635]/80 border border-[#7B337E]/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#420D4B] flex items-center justify-center font-bold text-[10px] text-[#F5D5E0] uppercase">
                          {sub.platform === 'tiktok' ? 'TT' : 'IG'}
                        </div>
                        <div>
                          <span className="font-bold text-[#F5D5E0] block leading-snug">
                            {Number(sub.current_views || 0).toLocaleString('id-ID')} Views
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            Rp {Number(sub.earnings || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <a
                        href={sub.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] transition-colors"
                        title="Buka Video"
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
          setSubmitSuccessNotice(
            `Klip berhasil disetor! Views awal: ${Number(newSub.current_views || 0).toLocaleString('id-ID')}, komisi terhitung Rp ${Number(newSub.earnings || 0).toLocaleString('id-ID')}.`
          );
          setTimeout(() => setSubmitSuccessNotice(null), 8000);
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => console.log('Created campaign:', camp)}
      />

      {/* MOBILE BOTTOM APP NAVIGATION */}
      <BottomNav
        onOpenSubmit={() => setIsSubmitModalOpen(true)}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
