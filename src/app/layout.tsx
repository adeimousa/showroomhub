import type { Metadata } from "next";
import { Inter, Playfair_Display, Lora, Space_Grotesk, DM_Sans, Archivo, Fraunces, Cormorant_Garamond, Merriweather, Plus_Jakarta_Sans, JetBrains_Mono, Archivo_Black, Space_Mono, Caveat, VT323, Noto_Serif_SC, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const merriweather = Merriweather({ variable: "--font-merriweather", subsets: ["latin"], weight: ["400", "700"] });
const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const archivoBlack = Archivo_Black({ variable: "--font-archivo-black", subsets: ["latin"], weight: ["400"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["400", "700"] });
const vt323 = VT323({ variable: "--font-vt323", subsets: ["latin"], weight: ["400"] });
const notoSerifSc = Noto_Serif_SC({ variable: "--font-noto-serif-sc", subsets: ["latin"], weight: ["400", "700"] });
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "ShowroomHub — Multi-Tenant Furniture SaaS",
  description: "Build, manage, and preview beautiful storefronts for furniture brands across 30 unique layouts.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${lora.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${archivo.variable} ${fraunces.variable} ${cormorant.variable} ${merriweather.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${archivoBlack.variable} ${spaceMono.variable} ${caveat.variable} ${vt323.variable} ${notoSerifSc.variable} ${lato.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
