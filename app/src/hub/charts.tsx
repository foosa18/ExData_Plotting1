import { useEffect, useRef, useState } from "react";
import { fmt } from "../ui/format";
import type { Point } from "./data/history.sample";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
const dfmt = (t: Date, long = false) => t.toLocaleDateString("en-US", long ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });

/**
 * Single-series value line (the "one big number + range" pattern). The line takes the direction colour
 * of the selected range, and the dashed baseline marks where the range started. Crosshair on hover or touch.
 */
export function TrendChart({ points, height = 200, onHover }: { points: Point[]; height?: number; onHover?: (p: Point | null) => void }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padT = 12, padB = 20, padX = 2;
  const n = points.length - 1;
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const x = (i: number) => padX + (i / Math.max(1, n)) * (w - 2 * padX);
  const y = (v: number) => padT + (1 - (v - lo) / span) * (height - padT - padB);
  const up = vs[n] >= vs[0];
  const d = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1)).join("");
  const area = d + "L" + x(n).toFixed(1) + " " + (height - padB) + "L" + x(0) + " " + (height - padB) + "Z";
  const set = (i: number | null) => { setHover(i); onHover?.(i === null ? null : points[i]); };
  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    set(Math.max(0, Math.min(n, Math.round(((clientX - r.left - padX) / (w - 2 * padX)) * n))));
  };
  const ticks = [0, Math.round(n / 2), n];
  return (
    <div className="chart trend" ref={ref} data-dir={up ? "up" : "down"}>
      <svg width={w} height={height} role="img" aria-label={"Value from " + fmt(vs[0]) + " to " + fmt(vs[n]) + " between " + dfmt(points[0].t, true) + " and " + dfmt(points[n].t, true)}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)} onPointerDown={(e) => pick(e.clientX, e.currentTarget)} onPointerLeave={() => set(null)}>
        <line x1={0} x2={w} y1={y(vs[0])} y2={y(vs[0])} className="base" />
        <path d={area} className="area" />
        <path d={d} className="line" />
        {ticks.map((i, k) => <text key={i} x={x(i)} y={height - 5} className="axis" textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>{dfmt(points[i].t)}</text>)}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT - 6} y2={height - padB} className="cross" />
            <circle cx={x(hover)} cy={y(vs[hover])} r={4.5} className="dot" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tt" style={{ left: Math.min(Math.max(x(hover), 70), w - 70) }}>
          <b>{fmt(vs[hover])}</b>
          <span className="muted">{dfmt(points[hover].t, true)}</span>
        </div>
      )}
    </div>
  );
}

/** Net saved each month: bars grow up from zero for months that saved, down for months that overspent. */
export function NetBars({ rows, height = 150, partial }: { rows: { label: string; net: number; income: number; spent: number }[]; height?: number; partial?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padT = 16, padB = 20;
  const m = Math.max(1, ...rows.map((r) => Math.abs(r.net)));
  const hasNeg = rows.some((r) => r.net < 0);
  const zero = hasNeg ? padT + (height - padT - padB) / 2 : height - padB;
  const scale = (zero - padT) / m;
  const slot = w / rows.length, bw = Math.min(36, slot * 0.56);
  return (
    <div className="chart netbars" ref={ref}>
      <svg width={w} height={height} role="img" aria-label={"Net saved per month: " + rows.map((r) => r.label + " " + fmt(r.net)).join(", ")}>
        <line x1={0} x2={w} y1={zero} y2={zero} className="grid" />
        {rows.map((r, i) => {
          const h = Math.max(2, Math.abs(r.net) * scale), cx = slot * i + slot / 2;
          return (
            <g key={r.label} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <rect x={slot * i} y={0} width={slot} height={height} fill="transparent" />
              <rect x={cx - bw / 2} y={r.net >= 0 ? zero - h : zero} width={bw} height={h} rx={3} className={(r.net >= 0 ? "b-pos" : "b-neg") + (partial && i === rows.length - 1 ? " partial" : "")} opacity={hover === null || hover === i ? 1 : 0.45} />
              {i === rows.length - 1 && <text x={cx} y={r.net >= 0 ? zero - h - 4 : zero + h + 11} className="val" textAnchor="middle">{(r.net < 0 ? "−" : "") + fmt(Math.abs(r.net))}{partial ? " so far" : ""}</text>}
              <text x={cx} y={height - 5} className="axis" textAnchor="middle">{r.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tt" style={{ left: Math.min(Math.max(slot * hover + slot / 2, 80), w - 80) }}>
          <b>{rows[hover].label}: {rows[hover].net < 0 ? "−" + fmt(-rows[hover].net) + " overspent" : fmt(rows[hover].net) + " saved"}{partial && hover === rows.length - 1 ? " so far" : ""}</b>
          <span className="muted">In {fmt(rows[hover].income)} · Out {fmt(rows[hover].spent)}</span>
        </div>
      )}
    </div>
  );
}

/** Spent-versus-limit bar with a tick at where spending "should" be by today. */
export function BudgetBar({ pct, frac, tone }: { pct: number; frac: number; tone: string }) {
  return (
    <span className={"bbar " + tone} aria-hidden="true">
      <i style={{ width: Math.min(100, pct * 100) + "%" }} />
      <em style={{ left: frac * 100 + "%" }} />
    </span>
  );
}
