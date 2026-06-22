import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K8s GitOps Platform",
  description: "K8s GitOps Self-Service Platform — 삼성 사내 DevOps 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
