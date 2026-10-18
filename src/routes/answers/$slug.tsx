import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/SiteLayout";
import { getAnswer, type Answer } from "@/content/answers";
import { SITE_NAME, abs, breadcrumb, faqPage, ldScript } from "@/lib/seo";

export const Route = createFileRoute("/answers/$slug")({
  loader: ({ params }) => {
    const answer = getAnswer(params.slug);
    if (!answer) throw notFound();
    return answer;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Answer not found | Sukuk Market" }, { name: "robots", content: "noindex" }] };
    const url = abs(`/answers/${params.slug}`);
    const description = loaderData.answer.slice(0, 300);
    return {
      meta: [
        { title: `${loaderData.title} | ${SITE_NAME}` },
        { name: "description", content: description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loaderData.title,
          about: "Sukuk",
          description,
          mainEntityOfPage: url,
          author: { "@type": "Organization", name: SITE_NAME, url: abs("/") },
          publisher: { "@type": "Organization", name: SITE_NAME, url: abs("/") },
        }),
        ldScript(faqPage([{ q: loaderData.question, a: loaderData.answer }, ...loaderData.faqs])),
        ldScript(
          breadcrumb([
            { name: "Home", path: "/" },
            { name: "Answers", path: "/answers" },
            { name: loaderData.question, path: `/answers/${params.slug}` },
          ]),
        ),
      ],
    };
  },
  component: AnswerPage,
});

function AnswerPage() {
  const answer = Route.useLoaderData() as Answer;

  return (
    <>
      <PageHeader title={answer.question} subtitle={`Sukuk reference — ${SITE_NAME}`} />
      <main className="mx-auto max-w-3xl px-4 pb-20">
        <article>
          <h1 className="sr-only">{answer.title}</h1>

          <p className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-base leading-relaxed text-foreground">
            {answer.answer}
          </p>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Key facts</h2>
            <ul className="mt-3 space-y-2">
              {answer.keyFacts.map((fact) => (
                <li key={fact} className="flex gap-2 text-sm leading-relaxed text-foreground">
                  <span aria-hidden className="text-primary">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </section>

          {answer.sections.map((section) => (
            <section key={section.heading} className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-foreground">Frequently asked</h2>
            <dl className="mt-3 space-y-4">
              {answer.faqs.map((faq) => (
                <div key={faq.q} className="rounded-lg border border-border bg-card p-4">
                  <dt className="text-sm font-medium text-foreground">{faq.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <nav className="mt-10 flex flex-wrap gap-3 text-sm">
            <Link to="/market" className="text-primary hover:underline">
              Open the sukuk screener
            </Link>
            <Link to="/answers" className="text-primary hover:underline">
              All answers
            </Link>
            {(answer.related ?? []).map((slug) => (
              <Link key={slug} to="/answers/$slug" params={{ slug }} className="text-primary hover:underline">
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </nav>
        </article>
      </main>
    </>
  );
}
