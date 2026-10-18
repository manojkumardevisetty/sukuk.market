import { createFileRoute } from "@tanstack/react-router";

import { fetchInstruments } from "@/lib/catalogue.server";
import { ANSWERS } from "@/content/answers";
import { SITE_URL, byCountry, byStructure } from "@/lib/seo";

type Entry = { path: string; changefreq?: string; priority?: string; lastmod?: string };

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await fetchInstruments();

        const entries: Entry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/market", changefreq: "daily", priority: "0.9" },
          { path: "/compare", changefreq: "weekly", priority: "0.6" },
          { path: "/learn", changefreq: "weekly", priority: "0.7" },
          { path: "/answers", changefreq: "weekly", priority: "0.8" },
          { path: "/data", changefreq: "monthly", priority: "0.6" },
          { path: "/about", changefreq: "monthly", priority: "0.4" },
        ];

        for (const answer of ANSWERS) entries.push({ path: `/answers/${answer.slug}`, changefreq: "weekly", priority: "0.7" });
        for (const c of byCountry(rows)) entries.push({ path: `/country/${c.slug}`, changefreq: "daily", priority: "0.8" });
        for (const s of byStructure(rows)) entries.push({ path: `/structure/${s.slug}`, changefreq: "weekly", priority: "0.7" });
        for (const row of rows) {
          entries.push({
            path: `/instrument/${row.slug}`,
            changefreq: "daily",
            priority: "0.8",
            ...(row.price_as_of ? { lastmod: new Date(row.price_as_of).toISOString() } : {}),
          });
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              "  <url>",
              `    <loc>${SITE_URL}${e.path}</loc>`,
              e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              "  </url>",
            ]
              .filter(Boolean)
              .join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
