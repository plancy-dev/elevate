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
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
