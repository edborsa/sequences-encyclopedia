import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSequencesPath, getSequence, getSequences } from "./api";

describe("buildSequencesPath", () => {
  it("returns the default sequences path without a search term", () => {
    expect(buildSequencesPath()).toBe("/sequences");
    expect(buildSequencesPath("   ")).toBe("/sequences");
  });

  it("appends a query string for a simple search term", () => {
    expect(buildSequencesPath("prime")).toBe("/sequences?q=prime");
  });

  it("appends a trimmed and encoded query string when a search term exists", () => {
    expect(buildSequencesPath("  a b  ")).toBe("/sequences?q=a+b");
  });
});

describe("api results", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok with parsed data on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );
    const result = await getSequences();
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("returns not-ok with status when the backend errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 })),
    );
    const result = await getSequences("prime");
    expect(result).toEqual({ ok: false, status: 500 });
  });

  it("maps a network failure to a 503 result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const result = await getSequences("prime");
    expect(result).toEqual({ ok: false, status: 503 });
  });

  it("preserves a 404 status from the detail endpoint so the page can call notFound()", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );
    const result = await getSequence("A0000000");
    expect(result).toEqual({ ok: false, status: 404 });
  });
});
