import { createServerFn } from "@tanstack/react-start";

import { fetchInstrument, fetchInstruments, fetchPartners, fetchPriceHistory } from "./catalogue.server";

export const listSukuk = createServerFn({ method: "GET" }).handler(async () => fetchInstruments());

export const getInstrument = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => fetchInstrument(data.slug));

export const getPriceHistory = createServerFn({ method: "GET" })
  .validator((data: { instrumentId: string }) => data)
  .handler(async ({ data }) => fetchPriceHistory(data.instrumentId));

export const listPartners = createServerFn({ method: "GET" }).handler(async () => fetchPartners());
