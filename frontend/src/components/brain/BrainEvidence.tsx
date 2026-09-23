import { Link } from "react-router-dom";
import type { BrainCitation, BrainSource } from "../../api/brain";
import type { CitationEvidenceState } from "../../api/brainMemos";

const sourceLabels: Record<BrainSource, string> = {
  note: "Notes",
  journal: "Journal",
  portfolio: "Portfolio theses",
  holding: "Position notes",
  transaction: "Transaction notes",
};

export function scopeLabel(sources: BrainSource[]) {
  if (sources.length === 5) return "All private sources";
  return sources.map((source) => sourceLabels[source] ?? source).join(", ");
}

const evidenceLabels: Record<CitationEvidenceState, string> = {
  current: "Source matches",
  changed: "Source changed",
  unavailable: "Cited section unavailable",
  unverifiable: "Cannot verify",
};

export function CitationCard({ citation, evidenceStatus }: { citation: BrainCitation; evidenceStatus?: CitationEvidenceState }) {
  const evidenceTime = citation.effective_at ?? citation.updated_at ?? citation.recorded_at;
  const evidenceDate = evidenceTime
    ? new Date(evidenceTime).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;
  const body = (
    <div className="rounded-sm border border-terminal-border bg-terminal-bg/60 p-2.5 transition-colors hover:border-terminal-accent/40">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-terminal-text">
          <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-terminal-accent/50 text-[9px] text-terminal-accent">
            {citation.n}
          </span>
          {citation.title}
        </span>
        <span className="shrink-0 text-[9px] uppercase tracking-wide text-terminal-muted">
          {sourceLabels[citation.source as BrainSource] ?? citation.source}
          {evidenceDate ? ` · ${evidenceDate}` : ""}
          {citation.score ? ` · ${(citation.score * 100).toFixed(0)}%` : ""}
        </span>
      </div>
      {evidenceStatus ? <p className={`mt-1 text-[10px] uppercase tracking-wide ${evidenceStatus === "current" ? "text-terminal-pos" : evidenceStatus === "changed" || evidenceStatus === "unavailable" ? "text-terminal-neg" : "text-terminal-muted"}`}>{evidenceLabels[evidenceStatus]}</p> : null}
      <p className="mt-1 text-[11px] leading-relaxed text-terminal-muted">{citation.snippet}</p>
    </div>
  );
  return citation.route ? <Link to={citation.route} className="block">{body}</Link> : body;
}
