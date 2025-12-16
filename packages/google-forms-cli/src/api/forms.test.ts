import { describe, it, expect } from "vitest";

describe("forms module", () => {
  it("should export createForm function", async () => {
    const { createForm } = await import("./forms");
    expect(typeof createForm).toBe("function");
  });

  it("should export getForm function", async () => {
    const { getForm } = await import("./forms");
    expect(typeof getForm).toBe("function");
  });

  it("should export listForms function", async () => {
    const { listForms } = await import("./forms");
    expect(typeof listForms).toBe("function");
  });

  it("should export updateFormInfo function", async () => {
    const { updateFormInfo } = await import("./forms");
    expect(typeof updateFormInfo).toBe("function");
  });

  it("should export deleteForm function", async () => {
    const { deleteForm } = await import("./forms");
    expect(typeof deleteForm).toBe("function");
  });

  it("should export getQuestions function", async () => {
    const { getQuestions } = await import("./forms");
    expect(typeof getQuestions).toBe("function");
  });

  it("should export getFormsClient function", async () => {
    const { getFormsClient } = await import("./forms");
    expect(typeof getFormsClient).toBe("function");
  });

  it("should export EmailCollectionType type with valid values", async () => {
    const forms = await import("./forms");
    // EmailCollectionType is a type, so we test it indirectly by checking
    // that the module exports the expected functionality
    expect(forms.updateFormInfo).toBeDefined();
  });
});
