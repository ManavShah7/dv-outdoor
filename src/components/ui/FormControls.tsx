"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "h-12 w-full min-w-0 rounded-[var(--radius-control)] bg-chrome-raised px-4 text-body text-ink-0 " +
  "placeholder:text-ink-500 ring-1 ring-chrome-line/70 ring-inset outline-none " +
  "transition-shadow duration-150 focus:ring-2 focus:ring-accent";

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-footnote text-ink-400">{children}</div>;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body text-ink-400">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, prefix && "pl-9")}
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, "appearance-none pr-10", !value && "text-ink-500")}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-chrome text-ink-0">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

/**
 * Company picker. Deliberately NOT a free-text field: the lifetime ledger per
 * company is the analytics the business cares most about, and it only works if
 * "Audi", "Audi India" and "audi." resolve to one entity. Existing companies
 * are matched first; creating a new one is a separate, explicit act.
 */
export function CompanyCombo({
  value,
  onChange,
  companies,
}: {
  value: string;
  onChange: (v: string) => void;
  companies: string[];
}) {
  const [open, setOpen] = useState(false);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matches = useMemo(() => {
    if (!value.trim()) return companies.slice(0, 6);
    return companies.filter((c) => norm(c).includes(norm(value))).slice(0, 6);
  }, [value, companies]);

  const exact = companies.some((c) => norm(c) === norm(value));
  const isNew = value.trim().length > 0 && !exact;

  return (
    <div className="relative">
      <input
        value={value}
        placeholder="Type or select"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        className={controlBase}
      />
      {isNew && !open && (
        <p className="mt-1.5 text-footnote" style={{ color: "var(--color-maintenance)" }}>
          New company — will be created
        </p>
      )}
      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-[var(--radius-card)] material-thick specular-edge py-1.5">
          {matches.map((c) => (
            <button
              key={c}
              onMouseDown={() => { onChange(c); setOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-subhead text-ink-100 hover:bg-white/8"
            >
              {c}
              {norm(c) === norm(value) && <Check className="size-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
