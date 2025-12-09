import { describe, it, expect } from "vitest";

describe("types module", () => {
  it("should export QUESTION_TYPE_MAP", async () => {
    const { QUESTION_TYPE_MAP } = await import("./types");
    expect(typeof QUESTION_TYPE_MAP).toBe("object");
  });

  it("should have correct question type mappings", async () => {
    const { QUESTION_TYPE_MAP } = await import("./types");

    expect(QUESTION_TYPE_MAP["short-answer"]).toBe("TEXT");
    expect(QUESTION_TYPE_MAP["paragraph"]).toBe("PARAGRAPH_TEXT");
    expect(QUESTION_TYPE_MAP["multiple-choice"]).toBe("RADIO");
    expect(QUESTION_TYPE_MAP["checkbox"]).toBe("CHECKBOX");
    expect(QUESTION_TYPE_MAP["dropdown"]).toBe("DROP_DOWN");
    expect(QUESTION_TYPE_MAP["linear-scale"]).toBe("SCALE");
    expect(QUESTION_TYPE_MAP["date"]).toBe("DATE");
    expect(QUESTION_TYPE_MAP["time"]).toBe("TIME");
  });
});
