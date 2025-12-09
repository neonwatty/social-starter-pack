import { describe, it, expect } from "vitest";

describe("questions module", () => {
  it("should export addQuestion function", async () => {
    const { addQuestion } = await import("./questions");
    expect(typeof addQuestion).toBe("function");
  });

  it("should export updateQuestion function", async () => {
    const { updateQuestion } = await import("./questions");
    expect(typeof updateQuestion).toBe("function");
  });

  it("should export deleteQuestion function", async () => {
    const { deleteQuestion } = await import("./questions");
    expect(typeof deleteQuestion).toBe("function");
  });

  it("should export moveQuestion function", async () => {
    const { moveQuestion } = await import("./questions");
    expect(typeof moveQuestion).toBe("function");
  });

  it("should export addSection function", async () => {
    const { addSection } = await import("./questions");
    expect(typeof addSection).toBe("function");
  });
});
