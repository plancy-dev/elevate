import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MarketingSiteJsonLd } from "@/components/seo/marketing-site-jsonld";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <MarketingSiteJsonLd locale={locale} />
      <div className="elevate-marketing-chrome flex min-h-dvh flex-col bg-marketing-canvas">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
