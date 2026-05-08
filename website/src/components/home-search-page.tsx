import Link from "next/link";
import type { Sequence } from "@/lib/api";

type HomeSearchPageProps = {
  searchTerm: string;
  sequences: Sequence[] | null;
};

export function HomeSearchPage({ searchTerm, sequences }: HomeSearchPageProps) {
  const hasSearchTerm = searchTerm.length > 0;

  return (
    <main>
      <h1>Sequences Encyclopedia</h1>
      <form action="/" className="search-form" method="get" role="search">
        <label className="search-label" htmlFor="sequence-search">
          Search by sequence name
        </label>
        <div className="search-controls">
          <input
            className="search-input"
            defaultValue={searchTerm}
            id="sequence-search"
            name="q"
            placeholder="Try Fibonacci"
            type="search"
          />
          <button className="search-button" type="submit">
            Search
          </button>
        </div>
      </form>
      {sequences === null ? (
        <div className="empty-state" role="alert">
          <h2>Couldn&apos;t load sequences.</h2>
          <p>The API returned an error. Try again in a moment.</p>
        </div>
      ) : sequences.length === 0 ? (
        <div className="empty-state">
          <h2>
            {hasSearchTerm ? "No matching sequences" : "No sequences available"}
          </h2>
          <p>
            {hasSearchTerm
              ? "Try a different name or a shorter phrase."
              : "The API returned an empty default list."}
          </p>
        </div>
      ) : (
        <ul>
          {sequences.map((sequence) => (
            <li key={sequence.id}>
              <Link href={`/sequences/${sequence.id}`}>{sequence.id}</Link>
              <span>{sequence.name}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
