import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "commit-sync / svg",
  description: "Create a SVG of your synced commits from Github and Gitlab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
