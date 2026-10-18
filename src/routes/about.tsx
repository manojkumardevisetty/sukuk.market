import { createFileRoute } from "@tanstack/react-router";

import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";

const copy: Record<string, string[]> = {
  en: [
    "Sukuk Market is a reference marketplace for Islamic capital markets. We start in the UAE — the region's deepest sukuk listing venue — and extend coverage across the GCC, Malaysia, Indonesia, Türkiye and the UK.",
    "Every listing carries the terms institutional desks actually check: structure, underlying asset, Shariah advisor, AAOIFI alignment, governing law, listing venue, ratings and indicative pricing.",
    "Tokenized sukuk is on the roadmap; instruments already carry a tokenization flag and token standard field.",
  ],
  ar: [
    "سوق الصكوك منصة مرجعية لأسواق رأس المال الإسلامية. نبدأ من الإمارات — أعمق منصة إدراج للصكوك في المنطقة — ثم نتوسع إلى دول الخليج وماليزيا وإندونيسيا وتركيا والمملكة المتحدة.",
    "يتضمن كل إدراج الشروط التي تراجعها المؤسسات فعليًا: الهيكل والأصل الأساسي والمستشار الشرعي والتوافق مع أيوفي والقانون الحاكم ومكان الإدراج والتصنيفات والتسعير الاسترشادي.",
    "الصكوك والسندات المرمزة ضمن خارطة الطريق، وتتضمن الأدوات حقلًا للترميز ومعيار الرمز.",
  ],
  ms: [
    "Sukuk Market ialah pasaran rujukan untuk pasaran modal Islam. Kami bermula di UAE — venue penyenaraian sukuk terbesar di rantau ini — dan berkembang ke GCC, Malaysia, Indonesia, Turkiye dan UK.",
    "Setiap penyenaraian membawa terma yang benar-benar disemak meja institusi: struktur, aset asas, penasihat Syariah, keselarasan AAOIFI, undang-undang, venue penyenaraian, penarafan dan harga indikatif.",
    "Bon konvensional dari rantau yang sama disenaraikan bersama sukuk untuk perbandingan nilai relatif.",
    "Sukuk dan bon ditokenkan berada dalam pelan hala tuju; instrumen sudah membawa penanda tokenisasi.",
  ],
};

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Sukuk Market — UAE-First, Globally Ready" },
      {
        name: "description",
        content:
          "Sukuk Market is a reference screener for the global sukuk market, starting in the UAE and expanding across the GCC and Southeast Asia.",
      },
      { property: "og:title", content: "About Sukuk Market" },
      { property: "og:description", content: "A UAE-first, globally ready screener for the global sukuk market." },
      { property: "og:url", content: "https://sukuk.market/about" },
    ],
    links: [{ rel: "canonical", href: "https://sukuk.market/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();
  return (
    <>
      <PageHeader title={t("nav.about")} subtitle={t("brand.tagline")} />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10">
        {(copy[lang] ?? copy['en']!).map((p: string, i: number) => (
          <p key={i} className="text-base leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
        <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </>
  );
}
