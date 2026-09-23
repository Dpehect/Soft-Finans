import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, RefreshCw, StickyNote, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";

import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
  type Note,
  type NoteContext,
} from "../../api/notes";
import { extractApiErrorMessage } from "../../api/base";
import { TerminalButton } from "../terminal/TerminalButton";
import { TerminalInput } from "../terminal/TerminalInput";

const contextBadge: Record<NoteContext, string> = {
  general: "Note",
  security: "Research",
  watchlist: "Watchlist",
  news: "News",
  holding: "Position",
  transaction: "Transaction",
  brain_memo: "From Brain Log",
};

function toIsoDateTime(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function displayDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  /** Scope notes to a symbol. Omit on the hub to show all notes. */
  symbol?: string | null;
  /** Context stamped on notes created here. */
  context?: NoteContext;
  /** Optional link back to the source object (news article id, holding id, …). */
  refId?: string | null;
  /** Compact mode for dense rows: a toggle that expands a mini composer. */
  compact?: boolean;
  /** Allow typing a symbol when none is provided (hub "general" notes). */
  allowSymbolInput?: boolean;
  className?: string;
}

export function NotesPanel({
  symbol,
  context = "general",
  refId = null,
  compact = false,
  allowSymbolInput = false,
  className = "",
}: Props) {
  const queryClient = useQueryClient();
  const effectiveAtId = useId();
  const normalizedSymbol = symbol ? symbol.toUpperCase() : undefined;
  const [body, setBody] = useState("");
  const [freeSymbol, setFreeSymbol] = useState("");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editEffectiveAt, setEditEffectiveAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(!compact);

  const queryKey = ["notes", normalizedSymbol ?? "all"] as const;
  const notesQuery = useQuery({
    queryKey,
    queryFn: () => listNotes(normalizedSymbol ? { symbol: normalizedSymbol } : undefined),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ["notes", "all"] });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      createNote({
        body,
        symbol: normalizedSymbol ?? (freeSymbol.trim().toUpperCase() || null),
        context,
        ref_id: refId,
        effective_at: toIsoDateTime(effectiveAt),
      }),
    onSuccess: () => {
      setBody("");
      setFreeSymbol("");
      setEffectiveAt("");
      setError(null);
      setNotice("Note saved. Second Brain indexing was queued and may take a moment.");
      invalidate();
    },
    onError: (err) => {
      setNotice(null);
      setError(extractApiErrorMessage(err, "Failed to save note."));
    },
  });

  const editMutation = useMutation({
    mutationFn: (id: string) =>
      updateNote(id, { body: editBody, effective_at: toIsoDateTime(editEffectiveAt) }),
    onSuccess: () => {
      setEditingId(null);
      setEditBody("");
      setEditEffectiveAt("");
      setError(null);
      setNotice("Note updated. Second Brain indexing was queued and may take a moment.");
      invalidate();
    },
    onError: (err) => {
      setNotice(null);
      setError(extractApiErrorMessage(err, "Failed to update note."));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: invalidate,
    onError: (err) => setError(extractApiErrorMessage(err, "Failed to delete note.")),
  });

  const notes = notesQuery.data ?? [];
  const count = notes.length;

  const submit = () => {
    if (!body.trim() || addMutation.isPending) return;
    setError(null);
    setNotice(null);
    addMutation.mutate();
  };

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-sm border border-terminal-border px-1.5 py-0.5 text-[10px] text-terminal-muted transition-colors hover:border-terminal-accent/40 hover:text-terminal-text ${className}`}
        title="Notes"
      >
        <StickyNote className="h-3 w-3" />
        {count > 0 ? count : "Note"}
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {compact ? (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-terminal-muted">
            <StickyNote className="h-3 w-3" /> Notes{normalizedSymbol ? ` · ${normalizedSymbol}` : ""}
          </span>
          <button type="button" onClick={() => setOpen(false)} className="text-terminal-muted hover:text-terminal-text">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="space-y-1.5">
        {allowSymbolInput && !normalizedSymbol ? (
          <TerminalInput
            size="sm"
            value={freeSymbol}
            placeholder="Symbol (optional, e.g. AAPL)"
            onChange={(e) => setFreeSymbol(e.target.value)}
          />
        ) : null}
        <TerminalInput
          as="textarea"
          rows={compact ? 2 : 3}
          value={body}
          placeholder={normalizedSymbol ? `Jot a note on ${normalizedSymbol}…` : "Jot a note…"}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <label htmlFor={effectiveAtId} className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wide text-terminal-muted">
            Effective date and time <span className="normal-case">(optional)</span>
          </span>
          <TerminalInput
            id={effectiveAtId}
            type="datetime-local"
            size="sm"
            value={effectiveAt}
            onChange={(e) => setEffectiveAt(e.target.value)}
          />
          {!compact ? (
            <span className="block text-[9px] text-terminal-muted">
              When this information applied. Leave blank to use the save time.
            </span>
          ) : null}
        </label>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-terminal-muted">⌘/Ctrl+Enter to save</span>
          <TerminalButton
            size="sm"
            variant="accent"
            loading={addMutation.isPending}
            leftIcon={<Plus className="h-3 w-3" />}
            onClick={submit}
          >
            Add note
          </TerminalButton>
        </div>
      </div>

      {error ? <p role="alert" className="text-[11px] text-terminal-neg">{error}</p> : null}
      {notice ? <p role="status" className="text-[11px] text-terminal-pos">{notice}</p> : null}

      <div className="space-y-1.5">
        {notesQuery.isPending ? (
          <p role="status" className="flex items-center gap-1.5 text-[11px] text-terminal-muted">
            <RefreshCw className="h-3 w-3 animate-spin" /> Loading notes…
          </p>
        ) : null}
        {notesQuery.isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-2 text-[11px] text-terminal-neg">
            <span>{extractApiErrorMessage(notesQuery.error, "Failed to load notes.")}</span>
            <TerminalButton size="sm" variant="ghost" onClick={() => void notesQuery.refetch()}>
              Retry
            </TerminalButton>
          </div>
        ) : null}
        {notes.map((note: Note) => (
          <div key={note.id} className="rounded-sm border border-terminal-border bg-terminal-bg/50 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-terminal-muted">
                <span className="rounded-sm border border-terminal-border px-1 text-terminal-accent">
                  {contextBadge[note.context]}
                </span>
                {note.symbol ? <span>{note.symbol}</span> : null}
                {note.context === "brain_memo" && note.ref_id ? (
                  <Link to={`/equity/brain?memo=${encodeURIComponent(note.ref_id)}#brain-log`} className="text-terminal-accent hover:underline">
                    Source memo
                  </Link>
                ) : null}
                {note.effective_at ? (
                  <span>Effective {displayDate(note.effective_at)}</span>
                ) : note.updated_at ? (
                  <span>Updated {displayDate(note.updated_at)}</span>
                ) : null}
              </span>
              <span className="flex items-center gap-1.5">
                {editingId === note.id ? (
                  <>
                    <button
                      type="button"
                      className="text-terminal-pos hover:opacity-80"
                      onClick={() => editMutation.mutate(note.id)}
                      title="Save"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="text-terminal-muted hover:text-terminal-text"
                      onClick={() => setEditingId(null)}
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-terminal-muted hover:text-terminal-text"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditBody(note.body);
                        setEditEffectiveAt(toLocalDateTime(note.effective_at));
                        setError(null);
                        setNotice(null);
                      }}
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="text-terminal-muted hover:text-terminal-neg"
                      onClick={() => removeMutation.mutate(note.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </span>
            </div>
            {editingId === note.id ? (
              <div className="mt-1.5 space-y-1.5">
                <TerminalInput
                  as="textarea"
                  rows={3}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                <label className="block space-y-1">
                  <span className="text-[9px] uppercase tracking-wide text-terminal-muted">
                    Effective date and time (optional)
                  </span>
                  <TerminalInput
                    type="datetime-local"
                    size="sm"
                    value={editEffectiveAt}
                    onChange={(e) => setEditEffectiveAt(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-terminal-text">{note.body}</p>
            )}
          </div>
        ))}
        {count === 0 && !notesQuery.isPending && !notesQuery.isError ? (
          <p className="text-[11px] text-terminal-muted">No notes yet.</p>
        ) : null}
      </div>
    </div>
  );
}
