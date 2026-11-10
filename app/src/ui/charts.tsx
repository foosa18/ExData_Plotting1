import { useEffect, useRef, useState } from "react";
import { ACCOUNT_COLORS } from "../core/desk";
import type { Account } from "../data/types";
import { fmtK } from "./format";

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

/** Median path inside a low-to-high band, with a crosshair tooltip on hover or touch. */
export function ProjectionChart({ median, low, high, height = 190 }: { median: number[]; low: number[]; high: number[]; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 46, padR = 10, padT = 10, padB = 22;
  const n = median.length - 1;
  const max = Math.max(...high) * 1.04, min = 0;
  const x = (i: number) => padL + (i / n) * (w - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (height - padT - padB);
  const line = (arr: number[]) => arr.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("");
  const band = line(high) + arr2(low);
  function arr2(arr: number[]) { return arr.map((_, j) => { const i = arr.length - 1 - j; return "L" + x(i).toFixed(1) + " " + y(arr[i]).toFixed(1); }).join("") + "Z"; }
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min));
  const xt = Array.from(new Set([0, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n]));
  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left - padL) / (w - padL - padR)) * n);
    setHover(Math.max(0, Math.min(n, i)));
  };
  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={height} role="img" aria-label={"Projected value: median " + fmtK(median[n]) + " after " + n + " years, range " + fmtK(low[n]) + " to " + fmtK(high[n])}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)} onPointerDown={(e) => pick(e.clientX, e.currentTarget)} onPointerLeave={() => setHover(null)}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={padL - 6} y={y(t) + 3.5} className="axis" textAnchor="end">{fmtK(t)}</text>
          </g>
        ))}
        {xt.map((i) => <text key={i} x={x(i)} y={height - 6} className="axis" textAnchor="middle">{i === 0 ? "Now" : "Yr " + i}</text>)}
        <path d={band} className="band" />
        <path d={line(median)} className="median" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={height - padB} className="cross" />
            <circle cx={x(hover)} cy={y(median[hover])} r={4.5} className="dot" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tt" style={{ left: Math.min(Math.max(x(hover), 80), w - 80) }}>
          <b>{hover === 0 ? "Now" : "Year " + hover}</b>
          <span>Median {fmtK(median[hover])}</span>
          <span className="muted">{fmtK(low[hover])} – {fmtK(high[hover])}</span>
        </div>
      )}
    </div>
  );
}

/** Stacked share of value by account, always paired with a labelled legend. */
export function AccountBar({ accounts, bal, total }: { accounts: Account[]; bal: (k: string) => number; total: number }) {
  return (
    <>
      <div className="acct-bar" role="img" aria-label="Value by account">
        {accounts.map((a, i) => { const b = bal(a.k); return b > 0 ? <i key={a.k} title={a.n + " " + fmtK(b)} style={{ width: (total ? (b / total) * 100 : 0) + "%", background: ACCOUNT_COLORS[i] }} /> : null; })}
      </div>
      <div className="acct-legend">
        {accounts.map((a, i) => { const b = bal(a.k); return b > 0 ? <span key={a.k}><i style={{ background: ACCOUNT_COLORS[i] }} />{a.n} <span className="num">{fmtK(b)}</span></span> : null; })}
      </div>
    </>
  );
}

export function Meter({ value, max = 100, tone }: { value: number; max?: number; tone?: string }) {
  return <span className={"meter " + (tone || "")}><i style={{ width: Math.max(0, Math.min(100, (value / max) * 100)) + "%" }} /></span>;
}
