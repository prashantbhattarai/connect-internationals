import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Connect Internationals", description: "A local prototype for friendship and shared ambitions." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
