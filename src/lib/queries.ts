import { queryOptions } from "@tanstack/react-query";

import { getInstrument, getPriceHistory, listPartners, listSukuk } from "./catalogue.functions";

export const sukukQuery = () =>
  queryOptions({ queryKey: ["instruments", "sukuk"], queryFn: () => listSukuk() });

/** Kept as an alias: the catalogue is sukuk-only. */
export const allInstrumentsQuery = sukukQuery;

export const instrumentQuery = (slug: string) =>
  queryOptions({
    queryKey: ["instrument", slug],
    queryFn: () => getInstrument({ data: { slug } }),
  });

export const priceHistoryQuery = (instrumentId: string) =>
  queryOptions({
    queryKey: ["price-history", instrumentId],
    queryFn: () => getPriceHistory({ data: { instrumentId } }),
  });

export const partnersQuery = () => queryOptions({ queryKey: ["partners"], queryFn: () => listPartners() });
