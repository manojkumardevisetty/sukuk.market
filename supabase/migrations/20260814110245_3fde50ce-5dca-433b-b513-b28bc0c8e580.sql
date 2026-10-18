
-- US Treasury par yield curve, 2026-08-13 (source: US Department of the Treasury)
with curve(t, y) as (
  values (1.0,3.97),(2.0,4.15),(3.0,4.20),(5.0,4.32),(7.0,4.47),(10.0,4.63),(20.0,5.20),(30.0,5.21)
),
base as (
  select i.id,
         greatest(extract(epoch from (i.maturity_date::timestamp - timestamp '2026-08-13')) / 31557600.0, 0.25)::numeric as ttm,
         i.profit_rate, i.spread_bps
  from public.instruments i
  where i.currency = 'USD' and i.maturity_date > date '2026-08-13'
),
interp as (
  select b.id, b.ttm, b.profit_rate, b.spread_bps,
    (select case
       when b.ttm <= (select min(t) from curve) then (select y from curve order by t limit 1)
       when b.ttm >= (select max(t) from curve) then (select y from curve order by t desc limit 1)
       else (
         select lo.y + (hi.y - lo.y) * ((b.ttm - lo.t) / (hi.t - lo.t))
         from (select t,y from curve where t <= b.ttm order by t desc limit 1) lo,
              (select t,y from curve where t >= b.ttm order by t asc limit 1) hi
       )
     end)::numeric as ust
  from base b
),
priced as (
  select id, ttm, profit_rate, spread_bps,
         round(ust + spread_bps / 100.0, 2) as new_yield
  from interp
),
final as (
  select p.*,
         round((
           (p.profit_rate / 2.0) * (1 - power(1 + p.new_yield/200.0, -(p.ttm*2))) / (p.new_yield/200.0)
           + 100 * power(1 + p.new_yield/200.0, -(p.ttm*2))
         )::numeric, 2) as new_price
  from priced p
)
insert into public.price_history (instrument_id, price, yield_to_maturity, spread_bps, source, as_of)
select id, new_price, new_yield, spread_bps, 'ust-curve-2026-08-13', timestamptz '2026-08-13 21:00:00+00'
from final;

update public.instruments i
set indicative_price = ph.price,
    yield_to_maturity = ph.yield_to_maturity,
    price_source = ph.source,
    price_as_of = ph.as_of
from public.price_history ph
where ph.instrument_id = i.id and ph.source = 'ust-curve-2026-08-13';

update public.instruments
set status = 'matured'
where maturity_date < current_date and status <> 'matured';
