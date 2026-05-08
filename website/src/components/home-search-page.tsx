"use client";

import Link from "next/link";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { type ApiResult, buildSequencesPath, type Sequence } from "@/lib/api";
import { buildHomePath, normalizeSearchTerm } from "@/lib/search";

type HomeSearchPageProps = {
  initialResult: ApiResult<Sequence[]>;
  initialSearchTerm: string;
};

type HistoryMode = "push" | null;

async function fetchSequences(
  searchTerm: string,
  signal: AbortSignal,
): Promise<ApiResult<Sequence[]>> {
  try {
    const response = await fetch(`/api${buildSequencesPath(searchTerm)}`, {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = (await response.json()) as Sequence[];
    return { ok: true, data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    return { ok: false, status: 503 };
  }
}

function getResultMeta(
  result: ApiResult<Sequence[]>,
  submittedSearchTerm: string,
) {
  const hasSearchTerm = submittedSearchTerm.length > 0;
  const sequences = result.ok ? result.data : [];

  return {
    hasSearchTerm,
    metricValue: result.ok ? sequences.length : "—",
    metricLabel: !result.ok
      ? "API unavailable"
      : hasSearchTerm
        ? "matches for this search"
        : "entries loaded from the API",
    sequences,
  };
}

export function HomeSearchPage({
  initialResult,
  initialSearchTerm,
}: HomeSearchPageProps) {
  const [inputValue, setInputValue] = useState(initialSearchTerm);
  const [submittedSearchTerm, setSubmittedSearchTerm] =
    useState(initialSearchTerm);
  const [result, setResult] = useState(initialResult);
  const [isLoading, setIsLoading] = useState(false);
  const activeRequestRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    async (nextSearchTerm: string, historyMode: HistoryMode) => {
      activeRequestRef.current?.abort();
      const controller = new AbortController();
      activeRequestRef.current = controller;
      setIsLoading(true);

      if (historyMode === "push") {
        window.history.pushState(null, "", buildHomePath(nextSearchTerm));
      }

      try {
        const nextResult = await fetchSequences(
          nextSearchTerm,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        startTransition(() => {
          setResult(nextResult);
          setSubmittedSearchTerm(nextSearchTerm);
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          startTransition(() => {
            setResult({ ok: false, status: 503 });
            setSubmittedSearchTerm(nextSearchTerm);
          });
        }
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(normalizeSearchTerm(inputValue), "push");
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextSearchTerm = normalizeSearchTerm(
        new URLSearchParams(window.location.search).get("q") ?? "",
      );

      setInputValue(nextSearchTerm);

      if (nextSearchTerm === submittedSearchTerm) {
        return;
      }

      void runSearch(nextSearchTerm, null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      activeRequestRef.current?.abort();
    };
  }, [runSearch, submittedSearchTerm]);

  const { hasSearchTerm, metricValue, metricLabel, sequences } = getResultMeta(
    result,
    submittedSearchTerm,
  );

  return (
    <main className="seq-page seq-home-page">
      <section className="seq-hero">
        <p className="seq-eyebrow">A field guide to integer patterns</p>
        <div className="seq-hero-copy">
          <h1>Sequences Encyclopedia</h1>
          <p className="seq-hero-summary">
            Browse a live sample of OEIS entries, then drill into terms,
            keywords, and offsets one record at a time.
          </p>
        </div>
        <div className="seq-metric">
          <span className="seq-metric-value">{metricValue}</span>
          <span className="seq-metric-label">{metricLabel}</span>
        </div>
      </section>

      <section className="seq-panel" aria-busy={isLoading}>
        <div className="seq-panel-heading seq-panel-heading-search">
          <div className="seq-panel-copy">
            <h2>Indexed sequences</h2>
            <p>
              Filter the catalog by sequence name or OEIS ID, then open any
              match for the full record.
            </p>
          </div>
          <form
            action="/"
            className="seq-search-form"
            method="get"
            onSubmit={handleSubmit}
            role="search"
          >
            <label className="seq-search-label" htmlFor="seq-search-input">
              Search by name or OEIS ID
            </label>
            <div className="seq-search-controls">
              <input
                className="seq-search-input"
                id="seq-search-input"
                name="q"
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Try Fibonacci, A9001055, 9001055..."
                type="search"
                value={inputValue}
              />
              <button
                className="seq-search-button"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>
        {isLoading ? (
          <p className="seq-search-summary">Updating results…</p>
        ) : result.ok && hasSearchTerm ? (
          <p className="seq-search-summary">
            {`Showing ${sequences.length} matching sequence${sequences.length === 1 ? "" : "s"} for ${submittedSearchTerm}.`}
          </p>
        ) : result.ok && sequences.length ? (
          <p className="seq-search-summary">
            Showing the first 200 sequences, ordered by name.
          </p>
        ) : null}
        {!result.ok ? (
          <div className="seq-empty-state" role="alert">
            <h3>Couldn&apos;t reach the sequences API.</h3>
            <p>
              The backend returned status {result.status}. Try again in a
              moment.
            </p>
          </div>
        ) : sequences.length ? (
          <ul className="seq-sequence-list">
            {sequences.map((sequence) => (
              <li key={sequence.id} className="seq-sequence-item">
                <Link
                  className="seq-sequence-link"
                  href={`/sequences/${sequence.id}`}
                >
                  {sequence.id}
                </Link>
                <span className="seq-sequence-name">{sequence.name}</span>
              </li>
            ))}
          </ul>
        ) : hasSearchTerm ? (
          <div className="seq-empty-state">
            <h3>No sequences matched.</h3>
            <p>Try a shorter phrase or search for a different OEIS ID.</p>
          </div>
        ) : (
          <div className="seq-empty-state">
            <h3>No sequences available.</h3>
            <p>The API returned an empty default list.</p>
          </div>
        )}
      </section>
    </main>
  );
}
