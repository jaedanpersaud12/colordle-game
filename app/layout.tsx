import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/lib/trpc/Provider";
import type { Metadata } from "next";
import { Barlow, Pirata_One } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const pirataOne = Pirata_One({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Colordle - Daily Color Guessing Game",
  description: "A retro color guessing game. Guess the daily color!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${pirataOne.variable} antialiased`}>
        <TRPCProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
