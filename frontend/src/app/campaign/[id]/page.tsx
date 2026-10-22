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
  Sparkles,
  Copy,
  Check,
  Download,
  Clock,
  ExternalLink,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { BottomNav } from '../../../components/BottomNav';
import { BioChallengeModal } from '../../../components/BioChallengeModal';
import { SubmitClipModal } from '../../../components/SubmitClipModal';
import { CreateCampaignModal } from '../../../components/CreateCampaignModal';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { Campaign, SocialAccount, Submission } from '../../../types';
import { MOCK_CAMPAIGNS } from '../../../data/mockData';

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

  // Cari campaign dari data lokal agar render langsung siap (0ms)
  const localCamp =
    MOCK_CAMPAIGNS.find((c) => c.slug === campaignId || c.id === campaignId) || MOCK_CAMPAIGNS[0];

  const [campaign, setCampaign] = useState<Campaign>(localCamp);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [campaignSubmissions, setCampaignSubmissions] = useState<Submission[]>([]);

  // Modals & Interactivity
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);

  // Ambil data detail campaign dari Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadRealCampaignData() {
      if (!campaignId) return;

      try {
        let foundCampaign: Campaign | null = null;

        // 1. Cari lewat kolom slug di Supabase
        const { data: bySlug } = await supabase
          .from('campaigns')
          .select('*')
          .eq('slug', campaignId)
          .maybeSingle();

        if (bySlug) {
          foundCampaign = bySlug as Campaign;
        } else {
          // 2. Jika tidak ada lewat slug, cari lewat id
          const { data: byId } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .maybeSingle();

          if (byId) {
            foundCampaign = byId as Campaign;
          }
        }

        // 3. Fallback ke data lokal
        if (!foundCampaign) {
          const matchLocal = MOCK_CAMPAIGNS.find(
            (c) => c.slug === campaignId || c.id === campaignId
          );
          if (matchLocal) {
            foundCampaign = matchLocal;
          }
        }

        if (foundCampaign && isMounted) {
          setCampaign(foundCampaign);
          setNotFound(false);

          // Ambil submissions terkait
          const { data: dbSubs } = await supabase
            .from('submissions')
            .select('*')
            .eq('campaign_id', foundCampaign.id)
            .order('created_at', { ascending: false });

          if (dbSubs && isMounted) {
            setCampaignSubmissions(dbSubs as Submission[]);
          }
        }
      } catch (err) {
        console.error('Error fetching campaign detail:', err);
      }
    }

    loadRealCampaignData();

    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  // Ambil akun sosmed milik user yang sedang login
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

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen bg-[#190428] text-[#F5D5E0] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 flex flex-col items-center justify-center text-center space-y-4 py-24">
          <div className="w-14 h-14 rounded-2xl bg-[#26073d] border border-[#7B337E]/40 flex items-center justify-center text-[#6667AB]">
            <Flame className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Campaign Tidak Ditemukan</h1>
          <p className="text-xs text-[#F5D5E0]/70 leading-relaxed">
            Episode yang kamu tuju tidak terdaftar atau link salah.
          </p>
          <Link
            href="/"
            className="py-2.5 px-6 rounded-full font-bold text-xs bg-white text-black hover:bg-white/90 transition-all"
          >
            Kembali ke Semua Campaign
          </Link>
        </main>
      </div>
    );
  }

  const targetCampaign = campaign || localCamp;
  const hashtagRequirements =
    targetCampaign?.hashtag_requirements && Array.isArray(targetCampaign.hashtag_requirements) && targetCampaign.hashtag_requirements.length > 0
      ? targetCampaign.hashtag_requirements
      : ['#DipanggilKeRuangan', '#KlipzzViral'];
  const rewardPool = Number(targetCampaign?.reward_pool || 0) || 25000000;
  const remainingPool = Number(targetCampaign?.remaining_pool || 0) || 16800000;
  const ratePer1k = Number(targetCampaign?.rate_per_1k_views || 0) || 18000;
  const minViews = Number(targetCampaign?.min_views_threshold || 0) || 1000;
  const maxPayout = Number(targetCampaign?.max_payout_per_clip || 0) || 2000000;

  const handleCopyTags = () => {
    navigator.clipboard.writeText(hashtagRequirements.join(' '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const videoEmbedId = extractYoutubeId(
    targetCampaign?.source_youtube_url,
    targetCampaign?.youtube_video_id || 'DHiELGxnAS4'
  );

  const remainingPercentage = rewardPool > 0
    ? Math.min(100, Math.max(0, Math.round((remainingPool / rewardPool) * 100)))
    : 70;

  const punchlineTimestamps = [
    { time: '04:15', seconds: 255, title: 'Momen Pembuka & Reaksi Panik Guest' },
    { time: '12:30', seconds: 750, title: 'Punchline Utama / Debat Adu Argumen' },
    { time: '21:45', seconds: 1305, title: 'Roasting Keras Arif Brata & Dara' },
    { time: '34:20', seconds: 2060, title: 'Punchline Penutup / Momen Amplop' },
  ];

  return (
    <div className="min-h-screen bg-[#190428] text-[#F5D5E0] flex flex-col font-sans antialiased selection:bg-[#7B337E] selection:text-white">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28 md:pb-16">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F5D5E0]/70 hover:text-white transition-colors"
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
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#26073d] border border-[#7B337E]/40 text-xs font-semibold text-white">
                  <span>{targetCampaign.channel_name || '@DipanggilKeRuangan'}</span>
                  <CheckCircle2 className="w-3 h-3 text-[#6667AB]" />
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium">
                  Guest: {targetCampaign.episode_guest}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  Aktif Payout
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {targetCampaign.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#F5D5E0]/75 leading-relaxed">
                {targetCampaign.description}
              </p>
            </div>

            {/* Main Action Callouts */}
            <div className="flex sm:flex-row lg:flex-col gap-2.5 shrink-0 pt-2 lg:pt-0">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-white hover:bg-white/90 text-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Setor Link Klip</span>
              </button>

              <a
                href={`https://en.savefrom.net/20/#url=${encodeURIComponent(targetCampaign?.source_youtube_url || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-5 py-3 rounded-full font-semibold text-xs bg-[#26073d] hover:bg-[#420D4B] text-white border border-[#7B337E]/40 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Footage</span>
              </a>
            </div>
          </div>

          {/* 3 Metric Pills ala TernakKlip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#26073d]/70 border border-[#7B337E]/30 space-y-1">
              <span className="text-[11px] text-[#F5D5E0]/60 font-medium block">Tarif per 1.000 Views (CPM)</span>
              <div className="text-lg font-black text-emerald-400 font-mono">
                Rp {ratePer1k.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#26073d]/70 border border-[#7B337E]/30 space-y-1">
              <div className="flex justify-between items-center text-[11px] text-[#F5D5E0]/60">
                <span>Sisa Budget Pool</span>
                <span className="font-bold text-white">{remainingPercentage}%</span>
              </div>
              <div className="text-lg font-black text-white font-mono">
                Rp {remainingPool.toLocaleString('id-ID')}
              </div>
              <div className="w-full h-1 rounded-full bg-[#190428] overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] rounded-full"
                  style={{ width: `${remainingPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#26073d]/70 border border-[#7B337E]/30 space-y-1">
              <span className="text-[11px] text-[#F5D5E0]/60 font-medium block">Maksimal Komisi / Klip</span>
              <div className="text-lg font-black text-white font-mono">
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
            <div className="rounded-2xl bg-[#26073d]/60 border border-[#7B337E]/30 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Video Footage Resmi</span>
                </span>
                <a
                  href={targetCampaign?.source_youtube_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#6667AB] hover:text-white flex items-center gap-1"
                >
                  <span>Buka di YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoEmbedId}${activeTimestamp ? `?start=${activeTimestamp}&autoplay=1` : ''}`}
                  title={targetCampaign?.title || 'Video Campaign'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Punchline Bookmarks */}
            <div className="rounded-2xl bg-[#26073d]/60 border border-[#7B337E]/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#6667AB]" />
                  <span>Rekomendasi Menit Punchline (Viral Potential)</span>
                </h3>
                <span className="text-[11px] text-[#F5D5E0]/60">Klik untuk lompat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {punchlineTimestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTimestamp(ts.seconds)}
                    className="p-3 rounded-xl bg-[#190428] hover:bg-[#320a4d] border border-[#7B337E]/30 transition-all text-left flex items-start gap-2.5 group"
                  >
                    <span className="px-2 py-0.5 rounded-md bg-white/10 group-hover:bg-white text-white group-hover:text-black text-xs font-mono font-bold shrink-0 transition-colors">
                      {ts.time}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 block truncate transition-colors">
                        {ts.title}
                      </span>
                      <span className="text-[10px] text-[#F5D5E0]/50 block">
                        Durasi klip ideal 30–60 dtk
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editorial Guidelines (Do's & Don'ts) */}
            <div className="rounded-2xl bg-[#26073d]/60 border border-[#7B337E]/30 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#6667AB]" />
                <span>Ketentuan Format Konten</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                  <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[10px]">
                    Wajib Dilakukan:
                  </span>
                  <ul className="space-y-1 text-[#F5D5E0]/80">
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
                  <ul className="space-y-1 text-[#F5D5E0]/80">
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
            <div className="rounded-2xl bg-[#26073d]/60 border border-[#7B337E]/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#6667AB]" />
                  <span>Hashtag Wajib Postingan</span>
                </h3>
                <button
                  onClick={handleCopyTags}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  {copiedTags ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTags ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {hashtagRequirements.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-[#190428] border border-[#7B337E]/40 text-xs font-medium text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-[10px] text-[#F5D5E0]/60 leading-relaxed">
                Hashtag ini dicek otomatis oleh scraper Apify saat kamu menyetor video.
              </p>
            </div>

            {/* SUBMISSIONS LIST */}
            <div className="rounded-2xl bg-[#26073d]/60 border border-[#7B337E]/30 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-bold text-white">Klip yang Sudah Masuk</h3>
                <span className="font-mono text-[#6667AB]">{campaignSubmissions.length} Klip</span>
              </div>

              {campaignSubmissions.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#190428] border border-[#7B337E]/25 space-y-2">
                  <Scissors className="w-5 h-5 text-[#6667AB] mx-auto -rotate-45" />
                  <p className="text-xs text-[#F5D5E0]/60">Belum ada klip yang disetor untuk episode ini.</p>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="text-xs font-bold text-white hover:underline pt-1 inline-block"
                  >
                    Jadilah yang Pertama →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {campaignSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-[#190428] border border-[#7B337E]/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#420D4B] flex items-center justify-center font-bold text-[9px] text-white uppercase">
                          {sub.platform === 'tiktok' ? 'TT' : 'IG'}
                        </span>
                        <div>
                          <span className="font-bold text-white block">
                            {Number(sub.current_views || 0).toLocaleString('id-ID')} Views
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Rp {Number(sub.earnings || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <a
                        href={sub.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-white transition-colors"
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
