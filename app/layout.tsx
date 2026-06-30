import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lawyer On Demand",
  description: "Connect with an available attorney in 3 clicks.",
  applicationName: "Lawyer On Demand",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Lawyer On Demand",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#155dfc"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
