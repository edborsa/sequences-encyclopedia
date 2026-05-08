import Link from "next/link";
import { notFound } from "next/navigation";
import { getSequence } from "@/lib/api";

export default async function SequencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const result = await getSequence((await params).id);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <main className="seq-page seq-detail-page">
        <Link className="seq-back-link" href="/">
          All sequences
        </Link>
        <div className="seq-empty-state" role="alert">
          <h3>Couldn&apos;t reach the sequences API.</h3>
          <p>
            The backend returned status {result.status}. Try again in a moment.
          </p>
        </div>
      </main>
    );
  }
  const sequence = result.data;

  return (
    <main className="seq-page seq-detail-page">
      <Link className="seq-back-link" href="/">
        All sequences
      </Link>

      <section className="seq-detail-hero">
        <p className="seq-eyebrow">Sequence dossier</p>
        <h1>{sequence.id}</h1>
        <p className="seq-detail-summary">{sequence.name}</p>
      </section>

      <section className="seq-detail-grid">
        <article className="seq-detail-card">
          <h2>Terms</h2>
          <p className="seq-terms">{sequence.terms.join(", ")}</p>
        </article>

        <article className="seq-detail-card">
          <h2>Reference</h2>
          <dl className="seq-meta-list">
            <dt>Number</dt>
            <dd>{sequence.number}</dd>
            <dt>Keywords</dt>
            <dd>{sequence.keywords ?? "None"}</dd>
            <dt>Offset</dt>
            <dd>{sequence.offset ?? "None"}</dd>
          </dl>
        </article>
      </section>
    </main>
  );
}
