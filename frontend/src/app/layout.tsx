import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'klipzz.vid - Platform Clipping Campaign DiPanggil ke Ruangan',
  description: 'Platform clipping campaign menghubungkan channel YouTube DiPanggil ke Ruangan dengan para clipper konten komedi TikTok & Instagram Reels.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#210635] text-[#F5D5E0] antialiased selection:bg-[#7B337E] selection:text-[#F5D5E0]">
        {children}
      </body>
    </html>
  );
}
