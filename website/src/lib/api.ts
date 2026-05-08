export type Sequence = {
  id: string;
  number: number;
  name: string;
  data: string;
  terms: string[];
  keywords: string | null;
  offset: string | null;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

const API_URL = process.env.API_URL ?? "http://localhost:5053";

async function get<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return { ok: false, status: response.status };
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, status: 503 };
  }
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
