import { Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-locale-kr",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function getLocaleFontClasses(): string {
  return `${notoSansKR.variable} ${notoSansKR.className}`;
}
