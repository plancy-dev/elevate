import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-locale-jp",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function getLocaleFontClasses(): string {
  return `${notoSansJP.variable} ${notoSansJP.className}`;
}
