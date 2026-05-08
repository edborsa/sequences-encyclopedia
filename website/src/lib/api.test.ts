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

describe("api fetching", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the default sequences endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSequences();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5001/sequences", {
      cache: "no-store",
    });
    expect(result).toEqual([]);
  });

  it("fetches the search endpoint when a search term is provided", async () => {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSequences("prime");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5001/sequences?q=prime",
      {
        cache: "no-store",
      },
    );
    expect(result).toEqual([]);
  });

  it("returns null when the backend returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 })),
    );

    const result = await getSequences("prime");

    expect(result).toBeNull();
  });

  it("encodes sequence ids for detail requests", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "A001055" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getSequence("A001055/with space");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5001/sequences/A001055%2Fwith%20space",
      { cache: "no-store" },
    );
  });
});
