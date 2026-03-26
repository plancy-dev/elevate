import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist_Mono, Noto_Sans_JP, Noto_Sans_KR, Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";
import { LocaleHtmlAttributes } from "@/components/i18n/locale-html-attributes";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-locale-kr",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-locale-sc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-locale-tc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-locale-jp",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function localeFontClass(locale: string): string {
  switch (locale) {
    case "ko":
      return `${notoSansKR.variable} ${notoSansKR.className}`;
    case "zh-CN":
      return `${notoSansSC.variable} ${notoSansSC.className}`;
    case "zh-TW":
      return `${notoSansTC.variable} ${notoSansTC.className}`;
    case "ja":
      return `${notoSansJP.variable} ${notoSansJP.className}`;
    default:
      return "font-sans";
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlAttributes />
      <div
        className={cn(
          geistMono.variable,
          localeFontClass(locale),
          "min-h-screen",
        )}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
