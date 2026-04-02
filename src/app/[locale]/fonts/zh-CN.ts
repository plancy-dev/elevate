import { Noto_Sans_SC } from "next/font/google";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-locale-sc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function getLocaleFontClasses(): string {
  return `${notoSansSC.variable} ${notoSansSC.className}`;
}
