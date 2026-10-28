import type { ChangeEvent, ReactNode } from 'react';

export function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} /></label>;
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}
