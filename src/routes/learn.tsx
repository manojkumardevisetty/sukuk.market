import { createFileRoute } from "@tanstack/react-router";

import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { abs, ldScript, SITE_NAME } from "@/lib/seo";

const structures = [
  {
    name: "Ijarah",
    en: "Sale-and-leaseback of a tangible asset. Investors own the asset and receive lease rentals as periodic distributions.",
    ar: "بيع وإعادة استئجار أصل ملموس. يملك المستثمرون الأصل ويحصلون على أجرة دورية.",
    ms: "Jualan dan pajakan semula aset ketara. Pelabur memiliki aset dan menerima sewa berkala.",
  },
  {
    name: "Wakalah",
    en: "An agent (wakeel) invests the proceeds in a Shariah-compliant portfolio and targets an expected profit rate for holders.",
    ar: "يستثمر الوكيل الحصيلة في محفظة متوافقة مع الشريعة ويستهدف معدل ربح متوقع.",
    ms: "Ejen (wakil) melabur hasil dalam portfolio patuh Syariah dan menyasarkan kadar keuntungan jangkaan.",
  },
  {
    name: "Murabahah",
    en: "Cost-plus sale of commodities. The deferred sale price creates the fixed payment obligation to certificate holders.",
    ar: "بيع مرابحة للسلع بتكلفة زائد ربح، ويولّد الثمن المؤجل التزام الدفع لحملة الصكوك.",
    ms: "Jualan komoditi kos tambah untung. Harga tertangguh mewujudkan obligasi bayaran tetap.",
  },
  {
    name: "Mudarabah",
    en: "Profit-sharing partnership between capital providers (holders) and the issuer as managing partner.",
    ar: "شراكة مضاربة لتقاسم الأرباح بين أصحاب رأس المال والمُصدر بصفته المضارب.",
    ms: "Perkongsian untung antara penyedia modal (pemegang) dan penerbit sebagai pengurus.",
  },
  {
    name: "Musharakah",
    en: "Joint venture where holders and the issuer both contribute capital and share profits by an agreed ratio.",
    ar: "مشاركة يساهم فيها الطرفان برأس المال ويتقاسمان الأرباح بنسبة متفق عليها.",
    ms: "Usaha sama di mana kedua-dua pihak menyumbang modal dan berkongsi untung.",
  },
  {
    name: "Manafae / Hybrid",
    en: "Usufruct-based or blended structures combining tangible assets with commodity Murabahah to meet tradability rules.",
    ar: "هياكل قائمة على المنافع أو مختلطة تجمع الأصول الملموسة مع المرابحة لضمان قابلية التداول.",
    ms: "Struktur manfaat atau gabungan aset ketara dengan Murabahah komoditi untuk kebolehdagangan.",
  },
];

const steps = [
  { en: "Browse the catalogue and filter by country, structure, currency or yield.", ar: "تصفح الكتالوج وصفِّ حسب الدولة أو الهيكل أو العملة أو العائد.", ms: "Layari katalog dan tapis mengikut negara, struktur, mata wang atau hasil." },
  { en: "Open an instrument for full terms, Shariah structure, ratings and pricing.", ar: "افتح الأداة للاطلاع على الشروط الكاملة والهيكل الشرعي والتصنيفات والتسعير.", ms: "Buka instrumen untuk terma penuh, struktur Syariah, penarafan dan harga." },
  { en: "Add it to your watchlist, save the screen, or set a yield alert.", ar: "أضفها إلى قائمة المتابعة أو احفظ الفرز أو اضبط تنبيه عائد.", ms: "Tambah ke senarai pantau, simpan tapisan, atau tetapkan makluman hasil." },
  { en: "Register interest and we route your enquiry to a licensed partner desk in your jurisdiction.", ar: "سجّل اهتمامك ونوجّه استفسارك إلى جهة مرخّصة في نطاقك القضائي.", ms: "Daftar minat dan kami salurkan pertanyaan anda ke desk rakan berlesen di bidang kuasa anda." },
  { en: "The partner handles onboarding and execution — Sukuk Market does not execute trades.", ar: "يتولى الشريك إجراءات القبول والتنفيذ — سوق الصكوك لا ينفّذ الصفقات.", ms: "Rakan mengendalikan onboarding dan pelaksanaan — Sukuk Market tidak melaksanakan dagangan." },
];

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn Sukuk — Structures & Workflow | Sukuk Market" },
      {
        name: "description",
        content:
          "A plain-language guide to Ijarah, Wakalah, Murabahah, Mudarabah and Musharakah sukuk structures, key terminology, and how the Sukuk Market screener works.",
      },
      { property: "og:title", content: "Learn Sukuk — Structures & Workflow" },
      { property: "og:description", content: "How Ijarah, Wakalah, Murabahah, Mudarabah and Musharakah sukuk work, and how to use the screener." },
      { property: "og:url", content: "https://sukuk-haven-global.lovable.app/learn" },
    ],
    links: [{ rel: "canonical", href: "https://sukuk-haven-global.lovable.app/learn" }],
    scripts: [
      ldScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Sukuk structures explained: Ijarah, Wakalah, Murabahah, Mudarabah and Musharakah",
        description:
          "A plain-language guide to the main sukuk structures, the terminology used in Islamic fixed income, and how to screen sukuk on Sukuk Market.",
        articleSection: "Islamic finance",
        about: structures.map((structure) => ({ "@type": "Thing", name: `${structure.name} sukuk` })),
        articleBody: [
          ...structures.map((structure) => `${structure.name}: ${structure.en}`),
          ...steps.map((step, index) => `Step ${index + 1}: ${step.en}`),
        ].join("\n"),
        inLanguage: ["en", "ar", "ms"],
        isAccessibleForFree: true,
        mainEntityOfPage: abs("/learn"),
        publisher: { "@type": "Organization", name: SITE_NAME, url: abs("/") },
        author: { "@type": "Organization", name: SITE_NAME, url: abs("/") },
      }),
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { t, lang } = useI18n();
  const pick = (o: Record<string, string>) => o[lang] ?? o['en'] ?? "";

  return (
    <>
      <PageHeader title={t("learn.title")} subtitle={t("learn.sub")} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {structures.map((s) => (
            <article key={s.name} className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold">{s.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pick(s)}</p>
            </article>
          ))}
        </div>

        <ol className="mt-12 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <span className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{pick(s)}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
