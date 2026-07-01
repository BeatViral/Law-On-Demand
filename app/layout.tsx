import type { Metadata, Viewport } from "next";
import "./globals.css";

const metadataBasePath = process.env.GITHUB_PAGES === "true" ? "/Law-On-Demand" : "";

export const metadata: Metadata = {
  title: "Lawyer On Demand",
  description: "Connect with an available attorney in 3 clicks.",
  applicationName: "Lawyer On Demand",
  manifest: `${metadataBasePath}/manifest.webmanifest`,
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
  themeColor: "#0B1C3D"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
