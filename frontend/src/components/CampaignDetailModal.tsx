'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Youtube,
  Download,
  Scissors,
  Clock,
  Hash,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Campaign, SocialAccount, Submission } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BioChallengeModal } from './BioChallengeModal';
import { SubmitClipModal } from './SubmitClipModal';

interface CampaignDetailModalProps {
  isOpen: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  socialAccounts?: SocialAccount[];
  onAccountVerified?: (account: SocialAccount) => void;
  onSubmissionCreated?: (submission: Submission) => void;
}

function extractYoutubeId(url?: string, defaultId?: string): string {
  if (defaultId && defaultId.length === 11) return defaultId;
  if (!url) return '';
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : '';
}

/**
 * Creator Kit is intentionally a modal instead of a separate dynamic route.
 * It avoids navigation to the [id] route chunk and keeps the user in context.
 */
export function CampaignDetailModal({
  isOpen,
  campaign,
  onClose,
  socialAccounts,
  onAccountVerified,
  onSubmissionCreated,
}: CampaignDetailModalProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>(socialAccounts || []);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setAccounts(socialAccounts || []);
  }, [socialAccounts]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !campaign) return;

    let active = true;
    setIsLoadingSubmissions(true);
    setSubmissions([]);

    supabase
      .from('submissions')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn('Could not load campaign submissions:', error.message);
        } else if (data) {
          setSubmissions(data as Submission[]);
        }
        setIsLoadingSubmissions(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, campaign?.id]);

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setAccounts([]);
      return;
    }

    let active = true;
    supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (active && data) setAccounts(data as SocialAccount[]);
      });

    return () => {
      active = false;
    };
  }, [isOpen, user?.id]);

  useEffect(() => {
    setActiveTimestamp(null);
    setCopiedTags(false);
  }, [campaign?.id]);

  if (!isOpen || !campaign) return null;

  const hashtags = Array.isArray(campaign.hashtag_requirements)
    ? campaign.hashtag_requirements
    : [];
  const guidelines = Array.isArray(campaign.guidelines) ? campaign.guidelines : [];
  const rewardPool = Number(campaign.reward_pool || 0);
  const remainingPool = Number(campaign.remaining_pool || 0);
  const ratePer1k = Number(campaign.rate_per_1k_views || 0);
  const maxPayout = Number(campaign.max_payout_per_clip || 0);
  const remainingPercentage =
    rewardPool > 0
      ? Math.min(100, Math.max(0, Math.round((remainingPool / rewardPool) * 100)))
      : 0;
  const videoEmbedId = extractYoutubeId(
    campaign.source_youtube_url,
    campaign.youtube_video_id || undefined
  );

  const punchlineTimestamps = [
    { time: '04:15', seconds: 255, title: 'Momen pembuka & reaksi guest' },
    { time: '12:30', seconds: 750, title: 'Punchline utama / debat' },
    { time: '21:45', seconds: 1305, title: 'Roasting dan reaksi host' },
    { time: '34:20', seconds: 2060, title: 'Punchline penutup' },
  ];

  const handleCopyTags = async () => {
    try {
      await navigator.clipboard.writeText(hashtags.join(' '));
      setCopiedTags(true);
      setTimeout(() => setCopiedTags(false), 2000);
    } catch {
      // Clipboard can be unavailable in some browsers; leave the tags visible.
    }
  };

  const handleVerified = (account: SocialAccount) => {
    setAccounts((prev) => [
      account,
      ...prev.filter(
        (item) =>
          item.id !== account.id &&
          !(item.platform === account.platform && item.handle === account.handle)
      ),
    ]);
    onAccountVerified?.(account);
    setIsBioModalOpen(false);
  };

  const handleSubmissionCreated = (submission: Submission) => {
    setSubmissions((prev) => [submission, ...prev]);
    onSubmissionCreated?.(submission);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Creator Kit ${campaign.title}`}
          className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur-xl sm:px-6">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] font-semibold text-fg">
                  {campaign.channel_name || '@DipanggilKeRuangan'}
                  <CheckCircle2 className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" />
                </span>
                {campaign.episode_guest && (
                  <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] text-fg-muted">
                    Guest: {campaign.episode_guest}
                  </span>
                )}
                <span className="rounded-full border border-[var(--cpm-line)] bg-[var(--cpm-soft)] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[var(--cpm)]">
                  Aktif Payout
                </span>
              </div>
              <h2 className="line-clamp-2 text-base font-black leading-snug text-fg sm:text-xl">
                {campaign.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Creator Kit"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-fg-muted transition-colors hover:bg-[var(--surface-3)] hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {/* Metrics */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                <span className="block text-[10px] font-medium text-fg-subtle">
                  Tarif per 1.000 views
                </span>
                <div className="font-mono text-lg font-black text-[var(--cpm)]">
                  Rp {ratePer1k.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                <div className="flex items-center justify-between text-[10px] text-fg-subtle">
                  <span>Sisa budget pool</span>
                  <span className="font-bold text-fg">{remainingPercentage}%</span>
                </div>
                <div className="font-mono text-lg font-black text-fg">
                  Rp {remainingPool.toLocaleString('id-ID')}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                    style={{ width: `${remainingPercentage}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                <span className="block text-[10px] font-medium text-fg-subtle">
                  Maksimal komisi / klip
                </span>
                <div className="font-mono text-lg font-black text-fg">
                  Rp {maxPayout.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md transition-all hover:bg-white/90 active:scale-95 sm:text-sm"
              >
                <Scissors className="h-4 w-4 -rotate-45" />
                Setor Link Klip
              </button>
              <a
                href={`https://en.savefrom.net/20/#url=${encodeURIComponent(
                  campaign.source_youtube_url || ''
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-5 py-2.5 text-xs font-semibold text-fg transition-colors hover:bg-[var(--surface-3)] sm:text-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh Footage
              </a>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                {/* Video */}
                <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-fg">
                      <Youtube className="h-4 w-4 text-red-500" />
                      Video Footage Resmi
                    </span>
                    {campaign.source_youtube_url && (
                      <a
                        href={campaign.source_youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                      >
                        Buka di YouTube
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--line)] bg-black">
                    {videoEmbedId ? (
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${videoEmbedId}${
                          activeTimestamp ? `?start=${activeTimestamp}&autoplay=1` : ''
                        }`}
                        title={campaign.title}
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

                {/* Timestamps */}
                <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-fg">
                      <Clock className="h-4 w-4 text-[var(--accent)]" />
                      Rekomendasi menit punchline
                    </h3>
                    <span className="text-[10px] text-fg-subtle">Klik untuk lompat</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {punchlineTimestamps.map((timestamp) => (
                      <button
                        key={timestamp.seconds}
                        type="button"
                        onClick={() => setActiveTimestamp(timestamp.seconds)}
                        className="flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-left transition-colors hover:border-[var(--accent-line)]"
                      >
                        <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-fg">
                          {timestamp.time}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-fg">
                            {timestamp.title}
                          </span>
                          <span className="block text-[10px] text-fg-subtle">
                            Durasi klip ideal 30–60 detik
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guidelines */}
                <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-fg">
                    <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                    Ketentuan format konten
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="space-y-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Wajib dilakukan
                      </span>
                      <ul className="space-y-1 text-fg-muted">
                        <li>• Format vertikal 9:16 untuk TikTok / Reels</li>
                        <li>• Subtitle tebal dan mudah dibaca</li>
                        <li>• Hook di 3 detik pertama</li>
                        <li>• Cantumkan semua hashtag kampanye</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        Dilarang keras
                      </span>
                      <ul className="space-y-1 text-fg-muted">
                        <li>• Hoaks, clickbait, atau konten SARA</li>
                        <li>• Reupload tanpa subtitle / crop</li>
                        <li>• Bot views</li>
                      </ul>
                    </div>
                  </div>
                  {guidelines.length > 0 && (
                    <ul className="space-y-1 text-[11px] text-fg-muted">
                      {guidelines.map((guideline, index) => (
                        <li key={index}>• {guideline}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {/* Hashtags */}
                <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg">
                      <Hash className="h-3.5 w-3.5 text-[var(--accent)]" />
                      Hashtag wajib
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopyTags}
                      className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-fg transition-colors hover:bg-[var(--surface-3)]"
                    >
                      {copiedTags ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedTags ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.length > 0 ? (
                      hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-fg"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-fg-subtle">
                        Belum ada hashtag wajib.
                      </span>
                    )}
                  </div>
                </div>

                {/* Submissions */}
                <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="font-bold text-fg">Klip yang sudah masuk</h3>
                    <span className="font-mono text-fg-muted">{submissions.length} klip</span>
                  </div>

                  {isLoadingSubmissions ? (
                    <div className="flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] py-6">
                      <RefreshCw className="h-4 w-4 animate-spin text-fg-subtle" />
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-center">
                      <Scissors className="mx-auto h-5 w-5 -rotate-45 text-fg-subtle" />
                      <p className="text-xs text-fg-muted">
                        Belum ada klip yang disetor untuk episode ini.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="inline-block pt-1 text-xs font-bold text-[var(--accent)] hover:underline"
                      >
                        Jadilah yang pertama →
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-3)] text-[9px] font-bold uppercase text-fg">
                              {submission.platform === 'tiktok' ? 'TT' : 'IG'}
                            </span>
                            <div>
                              <span className="block font-bold text-fg">
                                {Number(submission.current_views || 0).toLocaleString('id-ID')} views
                              </span>
                              <span className="font-mono text-[10px] text-[var(--cpm)]">
                                Rp {Number(submission.earnings || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                          <a
                            href={submission.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-[var(--surface-3)] p-1.5 text-fg transition-colors hover:bg-white/20"
                            aria-label="Buka video"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={handleVerified}
        zIndexClass="z-[110]"
      />

      <SubmitClipModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={campaign}
        socialAccounts={accounts}
        onSubmitSuccess={handleSubmissionCreated}
        onOpenBioChallenge={() => {
          setIsSubmitModalOpen(false);
          setIsBioModalOpen(true);
        }}
        zIndexClass="z-[110]"
      />
    </>
  );
}
