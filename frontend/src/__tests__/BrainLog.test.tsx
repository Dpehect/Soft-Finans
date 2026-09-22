import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecondBrainPanel } from "../components/brain/SecondBrainPanel";
import { BrainLogPanel } from "../components/brain/BrainLogPanel";

const askBrainStreamMock = vi.fn();
const fetchBrainStatusMock = vi.fn();
const createBrainMemoMock = vi.fn();
const listBrainMemosMock = vi.fn();
const getBrainMemoMock = vi.fn();
const updateBrainMemoMock = vi.fn();
const deleteBrainMemoMock = vi.fn();

vi.mock("../api/brain", () => ({
  askBrainStream: (...args: unknown[]) => askBrainStreamMock(...args),
  fetchBrainStatus: (...args: unknown[]) => fetchBrainStatusMock(...args),
  reindexBrain: vi.fn(),
}));
vi.mock("../api/brainMemos", () => ({
  createBrainMemo: (...args: unknown[]) => createBrainMemoMock(...args),
  listBrainMemos: (...args: unknown[]) => listBrainMemosMock(...args),
  getBrainMemo: (...args: unknown[]) => getBrainMemoMock(...args),
  updateBrainMemo: (...args: unknown[]) => updateBrainMemoMock(...args),
  deleteBrainMemo: (...args: unknown[]) => deleteBrainMemoMock(...args),
}));

const citation = {
  n: 1, source: "note", title: "Current thesis", symbol: "MSFT",
  snippet: "New guidance", score: 0.9, ref_id: "note-1", content_hash: "abc123",
  effective_at: "2026-09-20T10:00:00Z", route: "/equity/notes",
};
const memo = {
  id: "memo-1", title: "What changed?", question: "What changed?", answer: "Guidance improved [1].",
  answer_preview: "Guidance improved [1].", symbol: null, tags: [], annotation: "", pinned: false,
  citation_count: 1, generated_at: "2026-09-21T10:00:00Z", created_at: "2026-09-21T10:01:00Z",
  updated_at: "2026-09-21T10:01:00Z", sources: ["note"], citations: [citation],
  llm: true, llm_provider: "test", llm_model: "test-model",
};

function renderWithProviders(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("Brain Log browser flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchBrainStatusMock.mockResolvedValue({
      indexed_chunks: 1, source_counts: { note: 1, journal: 0, portfolio: 0, holding: 0, transaction: 0 },
      backend: "numpy", embed_model: "test",
    });
    createBrainMemoMock.mockResolvedValue(memo);
    listBrainMemosMock.mockResolvedValue([memo]);
    getBrainMemoMock.mockResolvedValue(memo);
    updateBrainMemoMock.mockImplementation(async (_id: string, changes: object) => ({ ...memo, ...changes }));
    deleteBrainMemoMock.mockResolvedValue(undefined);
  });

  it("offers Save only after a complete answer and preserves the answer snapshot", async () => {
    let finish: ((value: unknown) => void) | undefined;
    askBrainStreamMock.mockImplementation(async (_question: string, _k: number, _sources: string[], onUpdate: (value: unknown) => void) => {
      onUpdate({ answer: "Partial", citations: [citation], sources: ["note"], llm: true });
      return await new Promise((resolve) => { finish = resolve; });
    });
    renderWithProviders(<SecondBrainPanel />);
    await screen.findByText(/1 indexed/);
    fireEvent.change(screen.getByPlaceholderText(/Ask your second brain/), { target: { value: "What changed?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("Partial")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save answer" })).not.toBeInTheDocument();

    finish?.({ answer: memo.answer, citations: [citation], sources: ["note"], llm: true,
      generated_at: memo.generated_at, llm_provider: memo.llm_provider, llm_model: memo.llm_model });
    fireEvent.click(await screen.findByRole("button", { name: "Save answer" }));
    await waitFor(() => expect(createBrainMemoMock).toHaveBeenCalledWith({
      question: memo.question, answer: memo.answer, citations: [citation], sources: ["note"],
      generated_at: memo.generated_at, llm: true, llm_provider: "test", llm_model: "test-model",
    }));
    expect(await screen.findByRole("button", { name: "Saved to Brain Log" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "View log" })).toHaveAttribute("href", "#brain-log");
  });

  it("keeps incomplete or degraded responses unsaveable", async () => {
    askBrainStreamMock.mockResolvedValue({ ...memo, generated_at: null, error: "provider failed" });
    renderWithProviders(<SecondBrainPanel />);
    await screen.findByText(/1 indexed/);
    fireEvent.change(screen.getByPlaceholderText(/Ask your second brain/), { target: { value: memo.question } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(memo.answer)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save answer" })).not.toBeInTheDocument();
  });

  it("reads saved evidence, updates organization, and explicitly confirms deletion", async () => {
    renderWithProviders(<BrainLogPanel />);
    fireEvent.click(await screen.findByRole("button", { name: /What changed\?/ }));
    expect(await screen.findByRole("region", { name: "Saved research memo" })).toBeInTheDocument();
    expect(screen.getByText("Current thesis")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New title" } });
    fireEvent.change(screen.getByLabelText("Tags (comma-separated)"), { target: { value: "research, macro" } });
    fireEvent.change(screen.getByLabelText("Your annotation"), { target: { value: "Review quarterly" } });
    fireEvent.click(screen.getByLabelText("Pin this memo"));
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));
    await waitFor(() => expect(updateBrainMemoMock).toHaveBeenCalledWith("memo-1", {
      title: "New title", symbol: null, tags: ["research", "macro"], annotation: "Review quarterly", pinned: true,
    }));
    fireEvent.click(screen.getByRole("button", { name: "Delete memo" }));
    expect(deleteBrainMemoMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    await waitFor(() => expect(deleteBrainMemoMock).toHaveBeenCalledWith("memo-1"));
  });

  it("filters the log through the server-side symbol and pinned contract", async () => {
    renderWithProviders(<BrainLogPanel />);
    await screen.findByRole("button", { name: /What changed\?/ });
    fireEvent.change(screen.getByLabelText("Filter by symbol"), { target: { value: "msft" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(listBrainMemosMock).toHaveBeenCalledWith(0, 25, "MSFT", undefined));
    fireEvent.click(screen.getByLabelText("Pinned only"));
    await waitFor(() => expect(listBrainMemosMock).toHaveBeenCalledWith(0, 25, "MSFT", true));
  });
});
