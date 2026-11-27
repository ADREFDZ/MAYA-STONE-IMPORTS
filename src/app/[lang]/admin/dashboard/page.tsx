import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import ExportSubscribersButton from "@/components/admin/dashboard/ExportSubscribersButton";
import { getInventorySummary } from "../inventory/actions";
import {
  CLIENT_TYPE_LABELS,
  REASON_LABELS,
  SUBSCRIBER_SOURCE_LABELS,
  getDashboardData,
  type CatalogRow,
  type CountItem,
} from "./data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };
type Week = { label: string; count: number; current: boolean };

// =============================================================================
// DASHBOARD MAYA — tarjetas suaves sobre el fondo cálido de la marca.
// Paleta: solo tonos de la identidad (Neutral Black → Warm Gray). Las gráficas
// usan una escala de grises cálidos; la jerarquía la dan tamaño y contraste.
// =============================================================================

const nf = new Intl.NumberFormat("es-MX");
const SHADES = ["#252525", "#57534e", "#8a847c", "#b3ada4", "#cfcac2"];

const plural = (n: number, one: string, many: string) =>
  `${nf.format(n)} ${n === 1 ? one : many}`;

/** Tarjeta base: superficie clara translúcida, esquinas suaves, sombra difusa */
function Card({
  children,
  className = "",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`min-w-0 rounded-[22px] p-5 sm:p-6 ${
        dark
          ? "bg-black-neutral text-gray-warm"
          : "bg-white/50 border border-white/70 backdrop-blur-sm"
      } shadow-[0_1px_2px_rgba(37,37,37,0.05),0_18px_40px_-24px_rgba(37,37,37,0.35)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({
  title,
  action,
  note,
}: {
  title: string;
  action?: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="text-[15px] font-normal text-black-neutral">{title}</h3>
        {note && <p className="text-[12px] text-text-muted mt-0.5">{note}</p>}
      </div>
      {action}
    </div>
  );
}

/** Botón redondo con flecha (lleva a la sección completa) */
function ArrowLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="shrink-0 h-9 w-9 rounded-full bg-white/80 border border-black-neutral/10 flex items-center justify-center text-black-neutral hover:bg-black-neutral hover:text-gray-warm transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
        <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

/** Variación en una píldora: ▲ 3 / ▼ 2 / = */
function DeltaPill({ now, before }: { now: number; before: number }) {
  const d = now - before;
  const text = d === 0 ? "= sem. anterior" : `${d > 0 ? "▲" : "▼"} ${Math.abs(d)} vs. sem. anterior`;
  return (
    <span className="inline-flex items-center rounded-full bg-black-neutral/[0.06] px-2.5 py-1 text-[11px] text-black-neutral tabular-nums">
      {text}
    </span>
  );
}

// ---- Iconos (trazo fino) ---------------------------------------------------
const ICONS: Record<string, string> = {
  lead: "M4 6h16v12H4zM4 7l8 6 8-6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  chart: "M4 19h16M7 16V10M12 16V6M17 16v-4",
};
function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <span className="h-8 w-8 rounded-full bg-white/80 border border-black-neutral/10 flex items-center justify-center text-black-neutral shrink-0">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// ---- Gráficas --------------------------------------------------------------

/** Medidor semicircular (0–100 %) */
function Gauge({ value, label }: { value: number | null; label: string }) {
  const v = value ?? 0;
  const R = 92;
  const C = Math.PI * R;
  const angle = Math.PI * (1 - v / 100);
  const kx = 110 + R * Math.cos(angle);
  const ky = 110 - R * Math.sin(angle);
  return (
    <svg viewBox="-16 -10 252 146" className="w-full max-w-[280px] mx-auto" role="img" aria-label={`${label}: ${value ?? "sin datos"}%`}>
      <path d="M18 110 A92 92 0 0 1 202 110" fill="none" className="stroke-black-neutral/10" strokeWidth={16} strokeLinecap="round" />
      <path
        d="M18 110 A92 92 0 0 1 202 110"
        fill="none"
        className="stroke-black-neutral"
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={`${(C * v) / 100} ${C}`}
      />
      {value !== null && v > 3 && v < 92 && <circle cx={kx} cy={ky} r={9} className="fill-background stroke-black-neutral" strokeWidth={4} />}
      {[0, 50, 100].map((t) => {
        const a = Math.PI * (1 - t / 100);
        return (
          <text key={t} x={110 + 114 * Math.cos(a)} y={t === 50 ? -2 : 128} textAnchor="middle" className="fill-text-muted text-[10px]">
            {t}
          </text>
        );
      })}
      <text x={110} y={96} textAnchor="middle" className="fill-black-neutral text-[34px] font-light tabular-nums">
        {value === null ? "—" : `${value}%`}
      </text>
      <text x={110} y={118} textAnchor="middle" className="fill-text-muted text-[11px]">
        {label}
      </text>
    </svg>
  );
}

/** Línea por semana con área y valor al pasar el cursor */
function LineChart({ weeks, unit }: { weeks: Week[]; unit: [string, string] }) {
  const W = 560;
  const H = 190;
  const pad = { t: 14, r: 8, b: 32, l: 8 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = Math.max(...weeks.map((w) => w.count), 3) * 1.15;
  const x = (i: number) => pad.l + (i * iw) / (weeks.length - 1);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = weeks.map((w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(w.count).toFixed(1)}`).join(" ");
  const slot = iw / (weeks.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${unit[1]} por semana`}>
      <defs>
        <linearGradient id={`fade-${unit[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#252525" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#252525" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad.l} x2={W - pad.r} y1={y(max / 2.3)} y2={y(max / 2.3)} className="stroke-black-neutral/10" strokeDasharray="3 4" />
      <path d={`${line} L${x(weeks.length - 1)},${pad.t + ih} L${pad.l},${pad.t + ih} Z`} fill={`url(#fade-${unit[0]})`} />
      <path d={line} fill="none" className="stroke-black-neutral" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {weeks.map((w, i) => (
        <g key={w.label} className="group">
          <rect x={x(i) - slot / 2} y={0} width={slot} height={H} className="fill-transparent" />
          <circle cx={x(i)} cy={y(w.count)} r={w.current ? 5 : 4} className={`fill-background stroke-black-neutral ${w.current ? "" : "opacity-0 group-hover:opacity-100"}`} strokeWidth={2.5} />
          <g className="opacity-0 group-hover:opacity-100 pointer-events-none">
            <rect x={Math.min(Math.max(x(i) - 56, 0), W - 112)} y={Math.max(y(w.count) - 44, 0)} width={112} height={30} rx={15} className="fill-black-neutral" />
            <text x={Math.min(Math.max(x(i), 56), W - 56)} y={Math.max(y(w.count) - 24, 20)} textAnchor="middle" className="fill-gray-warm text-[15px] tabular-nums">
              {plural(w.count, unit[0], unit[1])}
            </text>
          </g>
          {(i % 3 === (weeks.length - 1) % 3) && (
            <text x={x(i)} y={H - 4} textAnchor={i === weeks.length - 1 ? "end" : "middle"} className={`text-[15px] ${w.current ? "fill-black-neutral" : "fill-text-muted"}`}>
              {w.current ? "Hoy" : w.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Barras verticales con porcentaje en una burbuja (tipo de cliente) */
function ColumnBars({ items }: { items: CountItem[] }) {
  if (items.length === 0) return <p className="text-[13px] text-text-muted">Sin datos todavía.</p>;
  const top = items.slice(0, 4);
  const total = items.reduce((a, i) => a + i.count, 0) || 1;
  const max = Math.max(...top.map((i) => i.count), 1);
  return (
    <div className="flex items-stretch gap-2">
      {top.map((it, idx) => {
        const pct = Math.round((it.count / total) * 100);
        const dark = idx < 2;
        return (
          <div key={it.label} className="flex-1 min-w-0 flex flex-col group" title={`${it.label}: ${it.count}`}>
            <div className="h-[160px] flex flex-col justify-end">
              <div
                className="rounded-[14px] flex justify-center pt-2 transition-opacity group-hover:opacity-90"
                style={{ height: `${Math.max((it.count / max) * 100, 22)}%`, background: SHADES[idx] }}
              >
                <span className={`h-fit rounded-full px-2 py-0.5 text-[11px] tabular-nums ${dark ? "bg-white/15 text-gray-warm" : "bg-white/60 text-black-neutral"}`}>
                  {pct}%
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-tight text-center text-text-secondary truncate">{it.label}</p>
            <p className="text-[11px] text-center text-text-muted tabular-nums">{it.count}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Lista con barra fina y porcentaje */
function RankList({ items, empty }: { items: CountItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-[13px] text-text-muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  const sum = items.reduce((a, i) => a + i.count, 0) || 1;
  return (
    <ol className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-black-neutral" title={i.label}>{i.label}</span>
            <span className="tabular-nums shrink-0">
              {i.count}
              <span className="text-text-muted text-[11px] ml-1.5">{Math.round((i.count / sum) * 100)}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-black-neutral/[0.07] overflow-hidden">
            <div className="h-full rounded-full bg-black-neutral" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return mins <= 1 ? "Ahora" : `Hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return days === 1 ? "Ayer" : `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function originOf(l: { utm_source?: string | null; utm_campaign?: string | null; fbclid?: string | null }) {
  const src = (l.utm_source || (l.fbclid ? "facebook" : "")).toLowerCase();
  if (!src && !l.utm_campaign) return "Directo";
  if (["facebook", "fb", "ig", "instagram", "meta"].includes(src)) return "Meta";
  return src || "Campaña";
}

// -----------------------------------------------------------------------------

export default async function DashboardPage({ params }: Props) {
  const { lang } = await params;
  const [d, inventory] = await Promise.all([getDashboardData(), getInventorySummary()]);
  const k = d.kpis;
  const pendingGaps = d.gaps.filter((g) => g.items.length > 0);
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  const tz = "America/Mexico_City";
  const hour = Number(new Intl.DateTimeFormat("es-MX", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()));
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const today = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date());

  const catalogCards: CatalogRow[] = d.catalogs.rows.slice(0, 5);

  return (
    <AdminLayout lang={lang}>
      <div className="font-sans text-black-neutral grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* ── SALUDO + CIFRAS ─────────────────────────────────────────── */}
        <Card className="lg:col-span-8 sm:p-7 bg-gradient-to-br from-white/70 to-white/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] text-text-muted">Admin <span className="mx-1">/</span> Resumen</p>
              <h2 className="mt-3 text-[30px] sm:text-[36px] font-light tracking-[-0.02em] leading-tight">{greeting}, MAYA</h2>
              <p className="mt-1 text-[13px] text-text-secondary first-letter:uppercase">{today}</p>
            </div>
            <div className="flex gap-2">
              {clarityId && (
                <a href={`https://clarity.microsoft.com/projects/view/${clarityId}/dashboard`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center h-9 rounded-full bg-white/80 border border-black-neutral/10 px-3.5 text-[12px] hover:bg-black-neutral hover:text-gray-warm transition-colors">
                  Mapa de calor
                </a>
              )}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center h-9 rounded-full bg-white/80 border border-black-neutral/10 px-3.5 text-[12px] hover:bg-black-neutral hover:text-gray-warm transition-colors">
                Visitas
              </a>
            </div>
          </div>

          <div className="mt-8 h-px bg-black-neutral/10" />

          <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
            {[
              { icon: "lead" as const, value: k.last7, label: "Leads esta semana" },
              { icon: "user" as const, value: d.subscribers.last7, label: "Nuevos suscriptores" },
              { icon: "download" as const, value: d.catalogs.last7, label: "Catálogos descargados" },
              { icon: "chart" as const, value: k.last30, label: "Leads en 30 días" },
            ].map((m) => (
              <div key={m.label} className="flex items-start gap-3">
                <Icon name={m.icon} />
                <div>
                  <dd className="text-[34px] font-light leading-none tracking-[-0.02em] tabular-nums">{nf.format(m.value)}</dd>
                  <dt className="mt-1.5 text-[12px] text-text-secondary">{m.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="lg:col-span-4 flex flex-col">
          <CardTitle title="Leads enviados al CRM" note="Últimos 30 días" action={<ArrowLink href={`/${lang}/admin/leads`} label="Ver leads" />} />
          <div className="flex-1 flex items-center">
            <Gauge value={k.crmSyncedPct} label="sincronizados" />
          </div>
          <p className="mt-2 text-center text-[12px] text-text-secondary">
            {k.crmFailed > 0 ? `${k.crmFailed} pendientes de reenviar` : "Sin errores de envío"}
          </p>
        </Card>

        {/* ── TENDENCIA · TIPO DE CLIENTE · ORIGEN ───────────────────── */}
        <Card className="lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[34px] font-light leading-none tracking-[-0.02em] tabular-nums">{nf.format(k.last30)}</p>
              <p className="mt-1.5 text-[12px] text-text-secondary">Leads en 30 días · {nf.format(k.totalLeads)} en total</p>
            </div>
            <ArrowLink href={`/${lang}/admin/leads`} label="Ver leads" />
          </div>
          <div className="mt-3"><DeltaPill now={k.last7} before={k.prev7} /></div>
          <div className="mt-4"><LineChart weeks={d.weeks} unit={["lead", "leads"]} /></div>
        </Card>

        <Card className="lg:col-span-4">
          <CardTitle title="Tipo de cliente" note="Leads de los últimos 90 días" />
          <ColumnBars items={d.byClientType} />
        </Card>

        <Card className="lg:col-span-3">
          <CardTitle title="De dónde llegan" note={`${d.campaigns.withCampaign} de ${d.campaigns.total} con campaña`} />
          <RankList items={d.campaigns.bySource} empty="Sin leads todavía." />
          {d.campaigns.byCampaign.length > 0 && (
            <div className="mt-6">
              <p className="text-[12px] text-text-muted mb-2.5">Campañas</p>
              <RankList items={d.campaigns.byCampaign.slice(0, 4)} empty="" />
            </div>
          )}
        </Card>

        {/* ── CATÁLOGOS (tarjetas) ───────────────────────────────────── */}
        <div className="lg:col-span-12">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3 px-1">
            <h3 className="text-[15px]">Catálogos descargados</h3>
            <p className="text-[12px] text-text-muted">{plural(d.catalogs.last30, "descarga", "descargas")} en 30 días · conteo propio, incluye a quien no aceptó cookies</p>
          </div>
          {catalogCards.length === 0 ? (
            <Card><p className="text-[13px] text-text-muted">Aún no hay descargas registradas.</p></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {catalogCards.map((c, i) => (
                <Card key={c.label} className="!p-4 sm:!p-5" dark={i === 0}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-gray-warm" : "bg-black-neutral"}`} />
                    <p className={`text-[12px] truncate ${i === 0 ? "text-gray-warm/80" : "text-text-secondary"}`} title={c.label}>{c.label}</p>
                  </div>
                  <p className="mt-3 text-[28px] font-light leading-none tabular-nums">{nf.format(c.d30)}</p>
                  <p className={`mt-1 text-[11px] ${i === 0 ? "text-gray-warm/70" : "text-text-muted"}`}>en 30 días</p>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${i === 0 ? "border-gray-warm/15 text-gray-warm/80" : "border-black-neutral/10 text-text-secondary"}`}>
                    <span>7 días: {c.d7}</span>
                    <span>90 días: {c.d90}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── ACTIVIDAD · QUÉ PIDEN · DÓNDE ESTÁN ────────────────────── */}
        <Card className="lg:col-span-4">
          <CardTitle title="Suscriptores" note={`${nf.format(k.subscribers)} activos · +${k.subscribers30} en 30 días`} action={<ExportSubscribersButton />} />
          <RankList items={d.subscribers.bySource} empty="Sin registros todavía." />
          <div className="mt-6">
            <p className="text-[12px] text-text-muted mb-2.5">Interés por colección</p>
            <RankList items={d.subscribers.byInterest.slice(0, 5)} empty="Sin registros todavía." />
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardTitle title="Qué piden" note="Motivo · 90 días" />
          <RankList items={d.byReason} empty="Sin datos todavía." />
          {d.topMaterials.length > 0 && (
            <div className="mt-6">
              <p className="text-[12px] text-text-muted mb-2.5">Materiales consultados</p>
              <RankList items={d.topMaterials.slice(0, 5)} empty="" />
            </div>
          )}
        </Card>

        <Card className="lg:col-span-4">
          <CardTitle title="Dónde están" note="Ubicación · 90 días" />
          <RankList items={d.topLocations} empty="Sin datos todavía." />
        </Card>

        {/* ── ÚLTIMOS LEADS (tabla) ──────────────────────────────────── */}
        <Card className="lg:col-span-12 !p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6">
            <h3 className="text-[15px]">Últimos leads</h3>
            <Link href={`/${lang}/admin/leads`} className="inline-flex items-center h-9 rounded-full bg-white/80 border border-black-neutral/10 px-3.5 text-[12px] hover:bg-black-neutral hover:text-gray-warm transition-colors">
              Ver todos
            </Link>
          </div>
          {d.recentLeads.length === 0 ? (
            <p className="px-6 py-6 text-[13px] text-text-muted">Aún no hay leads del formulario.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead>
                  <tr className="bg-black-neutral/[0.04] text-[11px] text-text-muted text-left">
                    <th className="font-normal px-6 py-2.5">Nombre</th>
                    <th className="font-normal px-3 py-2.5">Motivo</th>
                    <th className="font-normal px-3 py-2.5">Perfil</th>
                    <th className="font-normal px-3 py-2.5">Ubicación</th>
                    <th className="font-normal px-3 py-2.5">Origen</th>
                    <th className="font-normal px-3 py-2.5">Fecha</th>
                    <th className="font-normal px-6 py-2.5 text-right">CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentLeads.map((l) => (
                    <tr key={l.id} className="border-t border-black-neutral/[0.06] hover:bg-white/40 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full bg-black-neutral text-gray-warm flex items-center justify-center text-[11px] shrink-0">
                            {(l.name || "?").trim().split(/\s+/).slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-black-neutral">{l.name}</p>
                            {l.company && <p className="truncate text-[11px] text-text-muted">{l.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-text-secondary">{REASON_LABELS[l.contact_reason] || l.contact_reason}</td>
                      <td className="px-3 py-3 text-text-secondary">{CLIENT_TYPE_LABELS[l.profile_type] || l.profile_type}</td>
                      <td className="px-3 py-3 text-text-secondary truncate max-w-[180px]">{l.location}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-black-neutral/[0.06] px-2.5 py-0.5 text-[11px]">{originOf(l)}</span>
                      </td>
                      <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{timeAgo(l.created_at)}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${l.crm_lead_code ? "bg-black-neutral text-gray-warm" : "border border-black-neutral/30 text-black-neutral"}`}>
                          {l.crm_lead_code || "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── CONTENIDO · INVENTARIO ─────────────────────────────────── */}
        <Card className="lg:col-span-8">
          <CardTitle title="Pendientes de contenido" note={pendingGaps.length ? "Lo que falta para que el sitio esté completo" : "Todo el contenido está completo"} />
          {pendingGaps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pendingGaps.map((g) => (
                <Link key={g.label} href={`/${lang}/admin/${g.href}`} title={g.items.slice(0, 20).join(", ")} className="flex items-center justify-between gap-3 rounded-[14px] bg-white/60 border border-black-neutral/[0.06] px-4 py-3 hover:bg-white transition-colors">
                  <span className="text-[13px]">{g.label}</span>
                  <span className="rounded-full bg-black-neutral text-gray-warm text-[11px] px-2 py-0.5 tabular-nums">{g.items.length}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-4" dark>
          <div className="flex items-start justify-between">
            <h3 className="text-[15px] text-gray-warm">Inventario</h3>
            <Link href={`/${lang}/admin/inventory`} aria-label="Ver inventario" className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["SKUs", inventory?.total ?? 0],
              ["Activos", inventory?.active ?? 0],
              ["Ocultos", inventory?.outOfStock ?? 0],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dd className="text-[28px] font-light leading-none tabular-nums text-gray-warm">{nf.format(value as number)}</dd>
                <dt className="mt-1.5 text-[11px] text-gray-warm/65">{label}</dt>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </AdminLayout>
  );
}
