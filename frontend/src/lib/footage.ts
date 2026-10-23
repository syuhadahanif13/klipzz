const SAVEFROM_INDONESIA_URL = 'https://savefrom.co.id/youtube-video-downloader';

/**
 * Default download destination for every "Unduh Footage" button.
 * SaveFrom Indonesia accepts the source URL as a query parameter; if a
 * campaign has no source URL yet, fall back to the downloader homepage.
 */
export function getFootageDownloadUrl(sourceYoutubeUrl?: string | null): string {
  const source = sourceYoutubeUrl?.trim();
  if (!source) return SAVEFROM_INDONESIA_URL;

  return `${SAVEFROM_INDONESIA_URL}?url=${encodeURIComponent(source)}`;
}
