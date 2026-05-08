export type Sequence = {
  id: string;
  number: number;
  name: string;
  data: string;
  terms: string[];
  keywords: string | null;
  offset: string | null;
};

const API_URL = process.env.API_URL ?? "http://localhost:5001";

async function get<T>(path: string) {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export function buildSequencesPath(searchTerm?: string) {
  const normalizedSearchTerm = searchTerm?.trim();

  if (!normalizedSearchTerm) {
    return "/sequences";
  }

  const searchParams = new URLSearchParams({ q: normalizedSearchTerm });
  return `/sequences?${searchParams.toString()}`;
}

export function getSequences(searchTerm?: string) {
  return get<Sequence[]>(buildSequencesPath(searchTerm));
}

export function getSequence(id: string) {
  return get<Sequence>(`/sequences/${encodeURIComponent(id)}`);
}
