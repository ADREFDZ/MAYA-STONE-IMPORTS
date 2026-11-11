import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import ExportSubscribersButton from "@/components/admin/dashboard/ExportSubscribersButton";
import { getInventorySummary } from "../inventory/actions";
import {
  CLIENT_TYPE_LABELS,
  REASON_LABELS,
  getDashboardData,
  type CountItem,
} from "./data";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
};

// -----------------------------------------------------------------------------
// Piezas visuales (tokens MAYA; un solo tono para magnitudes)
// -----------------------------------------------------------------------------

function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-surface border border-border-light p-5 md:p-6 space-y-5 ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-border-light pb-3">
        <h3 className="font-sans font-light text-maya-h4 tracking-editorial text-black-neutral uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className="font-mono text-maya-label uppercase tracking-data text-text-muted block">
        {label}
      </span>
      <p className="font-sans font-light text-3xl text-black-neutral tabular-nums mt-1">
        {value}
      </p>
      {note && <p className="text-maya-small text-text-secondary mt-1">{note}</p>}
    </>
  );
  const cls =
    "block bg-surface border border-border-light p-5 transition-colors";
  return href ? (
    <Link href={href} className={`${cls} hover:border-black-neutral`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Barras horizontales: valor visible al final (pocas categorías) */
function BarList({ items, empty }: { items: CountItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-maya-small text-text-secondary">{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3">
          <span className="text-maya-small text-black-neutral truncate" title={i.label}>
            {i.label}
          </span>
          <span className="h-2 bg-black-neutral/10 overflow-hidden">
            <span
              className="block h-full bg-black-neutral rounded-r-[4px]"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
          </span>
          <span className="text-maya-small text-text-secondary tabular-nums text-right">
            {i.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Leads por semana: columnas con valor al pasar el cursor + tabla accesible */
function WeeklyBars({
  weeks,
}: {
  weeks: { label: string; count: number; current: boolean }[];
}) {
  const max = Math.max(...weeks.map((w) => w.count), 1);
  return (
    <figure className="space-y-2">
      <div className="h-40 flex items-end gap-2 border-b border-border-light" aria-hidden="true">
        {weeks.map((w) => (
          <div key={w.label} className="group relative flex-1 h-full flex items-end">
            <span
              className={`block w-full rounded-t-[4px] transition-opacity ${
                w.current ? "bg-accent" : "bg-black-neutral"
              } group-hover:opacity-80`}
              style={{ height: `${Math.max((w.count / max) * 100, w.count ? 4 : 1)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black-neutral text-gray-warm text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {w.count} {w.count === 1 ? "lead" : "leads"}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {weeks.map((w) => (
          <span key={w.label} className="flex-1 text-center text-[11px] text-text-muted">
            {w.label}
          </span>
        ))}
      </div>
      <figcaption className="text-[11px] text-text-muted">
        Semana que inicia el lunes indicado. En bronce, la semana actual.
      </figcaption>
      <table className="sr-only">
        <caption>Leads por semana</caption>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.label}>
              <th scope="row">{w.label}</th>
              <td>{w.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// -----------------------------------------------------------------------------

export default async function DashboardPage({ params }: Props) {
  const { lang } = await params;
  const [d, inventory] = await Promise.all([
    getDashboardData(),
    getInventorySummary(),
  ]);

  const k = d.kpis;
  const diff = k.last7 - k.prev7;
  const trend =
    k.prev7 === 0 && k.last7 === 0
      ? "Sin leads en las últimas 2 semanas"
      : diff === 0
        ? "Igual que la semana anterior"
        : `${diff > 0 ? "+" : ""}${diff} vs. semana anterior`;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  const pendingGaps = d.gaps.filter((g) => g.items.length > 0);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-6 md:space-y-8 font-sans">
        <header className="border-b border-border-light pb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-sans font-light text-maya-h2 tracking-editorial text-black-neutral uppercase leading-tight">
            Resumen
          </h2>
          <div className="flex flex-wrap gap-2 text-maya-small">
            {gaId ? (
              <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="border border-border-strong px-3 py-1.5 hover:bg-black-neutral hover:text-gray-warm transition-colors">
                Google Analytics ↗
              </a>
            ) : (
              <span className="border border-border-light px-3 py-1.5 text-text-muted">Analytics sin configurar</span>
            )}
            {clarityId ? (
              <a href={`https://clarity.microsoft.com/projects/view/${clarityId}/dashboard`} target="_blank" rel="noopener noreferrer" className="border border-border-strong px-3 py-1.5 hover:bg-black-neutral hover:text-gray-warm transition-colors">
                Mapa de calor (Clarity) ↗
              </a>
            ) : (
              <span className="border border-border-light px-3 py-1.5 text-text-muted">Clarity sin configurar</span>
            )}
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Kpi label="Leads · 7 días" value={k.last7} note={trend} href={`/${lang}/admin/leads`} />
          <Kpi label="Leads · 30 días" value={k.last30} note={`${k.totalLeads} en total`} href={`/${lang}/admin/leads`} />
          <Kpi
            label="Suscriptores"
            value={k.subscribers}
            note={`+${k.subscribers30} en 30 días`}
          />
          <Kpi
            label="Enviados al CRM · 30 días"
            value={k.crmSyncedPct === null ? "—" : `${k.crmSyncedPct}%`}
            note={
              k.crmFailed > 0 ? (
                <span className="text-red-800">⚠ {k.crmFailed} sin enviar · reenvíalos en Leads</span>
              ) : (
                "Sin errores de envío"
              )
            }
            href={`/${lang}/admin/leads`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
          <Panel title="Leads por semana" className="lg:col-span-7">
            <WeeklyBars weeks={d.weeks} />
          </Panel>

          <Panel
            title="Últimos leads"
            className="lg:col-span-5"
            action={
              <Link href={`/${lang}/admin/leads`} className="text-maya-small text-text-secondary hover:text-accent-ink">
                Ver todos
              </Link>
            }
          >
            {d.recentLeads.length === 0 ? (
              <p className="text-maya-small text-text-secondary">Aún no hay leads del formulario.</p>
            ) : (
              <ul className="divide-y divide-border-light -my-2">
                {d.recentLeads.map((l) => (
                  <li key={l.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-maya-small text-black-neutral truncate">
                        {[l.company, l.name].filter(Boolean).join(" / ")}
                      </p>
                      <p className="text-[12px] text-text-secondary truncate">
                        {[
                          REASON_LABELS[l.contact_reason] || l.contact_reason,
                          CLIENT_TYPE_LABELS[l.profile_type] || l.profile_type,
                          l.location,
                        ]
                          .filter(Boolean)
                          .join(" — ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] text-text-muted">{fmtDate(l.created_at)}</p>
                      <p className={`text-[11px] ${l.crm_lead_code ? "text-text-secondary" : "text-red-800"}`}>
                        {l.crm_lead_code || "No enviado"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 items-start">
          <Panel title="Motivo · 90 días">
            <BarList items={d.byReason} empty="Sin datos todavía." />
          </Panel>
          <Panel title="Tipo de cliente · 90 días">
            <BarList items={d.byClientType} empty="Sin datos todavía." />
          </Panel>
          <Panel title="Materiales más solicitados">
            <BarList items={d.topMaterials} empty="Se llena con los leads que llegan desde “Consultar disponibilidad”." />
          </Panel>
          <Panel title="Ubicaciones · 90 días">
            <BarList items={d.topLocations} empty="Sin datos todavía." />
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
          <Panel
            title="Suscriptores de catálogos"
            className="lg:col-span-5"
            action={<ExportSubscribersButton />}
          >
            {d.recentSubscribers.length === 0 ? (
              <p className="text-maya-small text-text-secondary">
                Aún no hay registros del aviso de catálogos.
              </p>
            ) : (
              <ul className="divide-y divide-border-light -my-2">
                {d.recentSubscribers.map((s) => (
                  <li key={s.email} className="py-2.5 flex items-center justify-between gap-3 text-maya-small">
                    <span className="truncate">{s.email}</span>
                    <span className="text-[12px] text-text-muted shrink-0">
                      {s.collection_slug ? `${s.collection_slug} — ` : ""}
                      {fmtDate(s.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Pendientes de contenido" className="lg:col-span-7">
            {pendingGaps.length === 0 ? (
              <p className="text-maya-small text-text-secondary">Todo el contenido está completo.</p>
            ) : (
              <ul className="space-y-3">
                {pendingGaps.map((g) => (
                  <li key={g.label}>
                    <details className="group border border-border-light bg-background/40">
                      <summary className="flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer text-maya-small">
                        <span>{g.label}</span>
                        <span className="flex items-center gap-3">
                          <span className="tabular-nums text-text-secondary">{g.items.length}</span>
                          <Link href={`/${lang}/admin/${g.href}`} className="text-[12px] text-accent-ink hover:underline">
                            Corregir
                          </Link>
                        </span>
                      </summary>
                      <p className="px-3.5 pb-3 text-[12px] text-text-secondary leading-relaxed">
                        {g.items.slice(0, 30).join(", ")}
                        {g.items.length > 30 ? ` y ${g.items.length - 30} más` : ""}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border-light pt-4 grid grid-cols-3 gap-3 text-maya-small">
              <div>
                <p className="text-[12px] text-text-muted">SKUs</p>
                <p className="text-xl font-light tabular-nums">{inventory?.total ?? 0}</p>
              </div>
              <div>
                <p className="text-[12px] text-text-muted">Activos</p>
                <p className="text-xl font-light tabular-nums">{inventory?.active ?? 0}</p>
              </div>
              <div>
                <p className="text-[12px] text-text-muted">Ocultos / agotados</p>
                <p className="text-xl font-light tabular-nums">{inventory?.outOfStock ?? 0}</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
}
