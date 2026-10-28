import type { ChangeEvent, ReactNode } from 'react';

export function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} /></label>;
}
export function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  const sectionIds: Record<string, string> = { '1. Project and template': 'project-panel', '2. Brand Kit': 'brand-panel', '3. Match data': 'match-panel', '4. Photo and layers': 'photo-panel' };
  return <details className="panel" id={id ?? sectionIds[title]} open><summary><h2>{title}</h2><span aria-hidden="true">⌄</span></summary><div className="panel-content">{children}</div></details>;
}
