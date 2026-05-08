export function normalizeSearchTerm(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.trim() ?? "";
}

export function buildHomePath(searchTerm?: string | string[]) {
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  if (!normalizedSearchTerm) {
    return "/";
  }

  const searchParams = new URLSearchParams({ q: normalizedSearchTerm });
  return `/?${searchParams.toString()}`;
}
