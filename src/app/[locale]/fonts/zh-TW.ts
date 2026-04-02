import { Noto_Sans_TC } from "next/font/google";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-locale-tc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function getLocaleFontClasses(): string {
  return `${notoSansTC.variable} ${notoSansTC.className}`;
}
