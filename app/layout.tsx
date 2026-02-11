import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coin Toss Blitz",
  description: "Live multiplayer coin toss game - bet, flip, win!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
