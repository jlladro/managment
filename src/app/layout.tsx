import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "HK Management",
  description: "Trocken- und Innenausbau Management System",
  manifest: "/manifest.json?v=2",
  icons: {
    icon: "/icon-512x512.png?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className={`${inter.className} bg-[#0B0E14] text-white antialiased h-full overflow-x-hidden selection:bg-orange-500/30`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
