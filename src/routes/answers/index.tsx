import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/SiteLayout";
import { ANSWERS } from "@/content/answers";
import { abs, breadcrumb, ldScript, faqPage } from "@/lib/seo";

const TITLE = "Sukuk Answers — Direct Answers to Common Sukuk Questions";
const DESCRIPTION =
  "Plain-English answers on sukuk: what they are, how they differ from bonds, whether they are halal, how to invest, structures, green sukuk and tokenized sukuk.";

export const Route = createFileRoute("/answers/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: abs("/answers") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: abs("/answers") }],
    scripts: [
      ldScript(breadcrumb([{ name: "Home", path: "/" }, { name: "Answers", path: "/answers" }])),
      ldScript(faqPage(ANSWERS.map((a) => ({ q: a.question, a: a.answer })))),
    ],
  }),
  component: AnswersHub,
});

function AnswersHub() {
  return (
    <>
      <PageHeader
        title="Sukuk answers"
        subtitle="Short, sourced answers to the questions investors and researchers ask most about sukuk."
      />
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {ANSWERS.map((answer) => (
            <article key={answer.slug} className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">
                <Link to="/answers/$slug" params={{ slug: answer.slug }} className="hover:text-primary">
                  {answer.question}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer.answer}</p>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
