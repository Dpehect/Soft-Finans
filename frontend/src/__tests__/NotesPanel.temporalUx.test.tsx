import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotesPanel } from "../components/notes/NotesPanel";
import type { Note } from "../api/notes";

const createNoteMock = vi.fn();
const deleteNoteMock = vi.fn();
const listNotesMock = vi.fn();
const updateNoteMock = vi.fn();

vi.mock("../api/notes", () => ({
  createNote: (...args: unknown[]) => createNoteMock(...args),
  deleteNote: (...args: unknown[]) => deleteNoteMock(...args),
  listNotes: (...args: unknown[]) => listNotesMock(...args),
  updateNote: (...args: unknown[]) => updateNoteMock(...args),
}));

const datedNote: Note = {
  id: "note-1",
  symbol: "AAPL",
  context: "general",
  ref_id: null,
  title: "",
  body: "Demand accelerated after guidance.",
  tags: [],
  effective_at: "2026-09-15T14:30:00+00:00",
  created_at: "2026-09-16T10:00:00+00:00",
  updated_at: "2026-09-16T10:00:00+00:00",
};

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotesPanel context="general" allowSymbolInput />
    </QueryClientProvider>,
  );
}

describe("NotesPanel temporal UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listNotesMock.mockResolvedValue([]);
    createNoteMock.mockResolvedValue(datedNote);
    updateNoteMock.mockResolvedValue(datedNote);
  });

  it("shows that notes are loading instead of presenting an empty surface", () => {
    listNotesMock.mockReturnValue(new Promise(() => undefined));
    renderPanel();

    expect(screen.getByText("Loading notes…")).toBeInTheDocument();
    expect(screen.queryByText("No notes yet.")).not.toBeInTheDocument();
  });

  it("shows load failures and lets the user retry", async () => {
    listNotesMock.mockRejectedValueOnce(new Error("Notes service unavailable"));
    renderPanel();

    expect(await screen.findByText("Notes service unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(listNotesMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No notes yet.")).toBeInTheDocument();
  });

  it("sends a timezone-aware effective time when creating a note", async () => {
    renderPanel();
    await screen.findByText("No notes yet.");

    fireEvent.change(screen.getByPlaceholderText("Jot a note…"), {
      target: { value: "A newer view of demand" },
    });
    fireEvent.change(screen.getByLabelText(/Effective date and time/), {
      target: { value: "2026-09-15T14:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));

    await waitFor(() =>
      expect(createNoteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: "A newer view of demand",
          effective_at: new Date("2026-09-15T14:30").toISOString(),
        }),
      ),
    );
    expect(await screen.findByText(/indexing was queued/i)).toBeInTheDocument();
  });

  it("displays effective time and allows it to be cleared while editing", async () => {
    listNotesMock.mockResolvedValue([datedNote]);
    renderPanel();

    expect(await screen.findByText(/Effective .*2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Edit"));
    const effectiveInputs = screen.getAllByLabelText(/Effective date and time/);
    fireEvent.change(effectiveInputs[1], { target: { value: "" } });
    fireEvent.click(screen.getByTitle("Save"));

    await waitFor(() =>
      expect(updateNoteMock).toHaveBeenCalledWith("note-1", {
        body: datedNote.body,
        effective_at: null,
      }),
    );
  });
});
