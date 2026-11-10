import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cls } from "./format";

export function Card({ children, className, pad = true, onClick, as }: { children: ReactNode; className?: string; pad?: boolean; onClick?: () => void; as?: "button" | "div" }) {
  if (as === "button" || onClick) {
    return <button type="button" className={cls("card", "card-btn", pad && "pad", className)} onClick={onClick}>{children}</button>;
  }
  return <div className={cls("card", pad && "pad", className)}>{children}</div>;
}

/** Uppercase card label with an optional "?" tip that opens on hover, focus or tap. */
export function Label({ children, tip, right }: { children: ReactNode; tip?: string; right?: ReactNode }) {
  return (
    <div className="lbl-row">
      <span className="lbl">{children}{tip && <Tip text={tip} />}</span>
      {right}
    </div>
  );
}

export function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [open]);
  return (
    <span ref={ref} className={cls("tip", open && "open")} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="tip-btn" aria-describedby={id} aria-label="What is this?" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} onBlur={() => setOpen(false)}>?</button>
      <span role="tooltip" id={id} className="tip-tt">{text}</span>
    </span>
  );
}

export function Seg<T extends string | number>({ value, options, onChange, label, size }: { value: T; options: { v: T; l: ReactNode }[]; onChange: (v: T) => void; label: string; size?: "sm" }) {
  return (
    <div className={cls("seg", size === "sm" && "seg-sm")} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} className={cls(o.v === value && "on")} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

export function Chip({ on, children, onClick }: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return <button type="button" className={cls("chip", on && "on")} aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Flag({ tone, title, children }: { tone: "ok" | "warn" | "bad"; title: string; children?: ReactNode }) {
  return <div className={cls("flag", tone)}><b>{title}</b> {children}</div>;
}

export function KpiRow({ k, v, tip, tone }: { k: ReactNode; v: ReactNode; tip?: string; tone?: string }) {
  return (
    <div className="kpi">
      <span className="k">{k}{tip && <Tip text={tip} />}</span>
      <span className={cls("v num", tone)}>{v}</span>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="stat">
      <span className="lbl">{label}</span>
      <b className={cls("num", tone)}>{value}</b>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    document.body.classList.add("sheet-open");
    return () => { document.removeEventListener("keydown", key); document.body.classList.remove("sheet-open"); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

const PATHS: Record<string, string> = {
  today: "M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  portfolio: "M12 3a9 9 0 1 0 9 9h-9V3zM15 2.5A9 9 0 0 1 21.5 9H15V2.5z",
  options: "M4 19h16M6 15l4-5 3 3 5-7M18 6h-3M18 6v3",
  plan: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  chev: "M9 6l6 6-6 6",
  sun: "M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  auto: "M12 3a9 9 0 1 0 0 18V3z M12 3a9 9 0 0 1 0 18",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  reset: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
  info: "M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] || ""} />
    </svg>
  );
}

/** Numeric field that edits freely and commits on blur or Enter. Uses a 16px font on phones so iOS does not zoom. */
export function NumField({ value, onCommit, min = 0, max, step = 1, label, prefix, suffix, width }: { value: number; onCommit: (n: number) => void; min?: number; max?: number; step?: number; label: string; prefix?: string; suffix?: string; width?: number }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => setTxt(String(value)), [value]);
  const commit = () => { const n = Math.max(min, Math.min(max ?? Infinity, +txt || 0)); onCommit(n); setTxt(String(n)); };
  return (
    <label className="numfield" style={width ? { width } : undefined}>
      {prefix && <span className="affix">{prefix}</span>}
      <input inputMode="decimal" type="number" min={min} max={max} step={step} value={txt} aria-label={label}
        onChange={(e) => setTxt(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      {suffix && <span className="affix">{suffix}</span>}
    </label>
  );
}
