import { describe, expect, it } from "vitest";
import { buildHomePath, normalizeSearchTerm } from "./search";

describe("normalizeSearchTerm", () => {
  it("trims a plain string value", () => {
    expect(normalizeSearchTerm("  prime  ")).toBe("prime");
  });

  it("reads the first string when the query param is repeated", () => {
    expect(normalizeSearchTerm([" first ", "second"])).toBe("first");
  });

  it("returns an empty string for missing or blank values", () => {
    expect(normalizeSearchTerm()).toBe("");
    expect(normalizeSearchTerm("   ")).toBe("");
  });
});

describe("buildHomePath", () => {
  it("returns the root path for a blank search", () => {
    expect(buildHomePath()).toBe("/");
    expect(buildHomePath("   ")).toBe("/");
  });

  it("builds an encoded home-page query string", () => {
    expect(buildHomePath("  a b  ")).toBe("/?q=a+b");
  });
});
