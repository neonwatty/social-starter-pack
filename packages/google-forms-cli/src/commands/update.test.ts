import { describe, it, expect } from "vitest";
import { parseUpdateArgs, VALID_COLLECT_EMAILS_VALUES } from "./update";

describe("update command", () => {
  describe("parseUpdateArgs", () => {
    it("should parse formId and title", () => {
      const result = parseUpdateArgs(["abc123", "--title", "New Title"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.args.formId).toBe("abc123");
        expect(result.args.title).toBe("New Title");
      }
    });

    it("should parse formId and description", () => {
      const result = parseUpdateArgs(["abc123", "--description", "New Description"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.args.formId).toBe("abc123");
        expect(result.args.description).toBe("New Description");
      }
    });

    it("should parse short flags -t and -d", () => {
      const result = parseUpdateArgs(["abc123", "-t", "Title", "-d", "Desc"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.args.title).toBe("Title");
        expect(result.args.description).toBe("Desc");
      }
    });

    describe("--collect-emails flag", () => {
      it("should accept 'verified' value", () => {
        const result = parseUpdateArgs(["abc123", "--collect-emails", "verified"]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.args.collectEmails).toBe("verified");
        }
      });

      it("should accept 'input' value", () => {
        const result = parseUpdateArgs(["abc123", "--collect-emails", "input"]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.args.collectEmails).toBe("input");
        }
      });

      it("should accept 'none' value", () => {
        const result = parseUpdateArgs(["abc123", "--collect-emails", "none"]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.args.collectEmails).toBe("none");
        }
      });

      it("should reject invalid values", () => {
        const result = parseUpdateArgs(["abc123", "--collect-emails", "invalid"]);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Invalid --collect-emails value");
          expect(result.error).toContain("invalid");
        }
      });

      it("should work with other flags", () => {
        const result = parseUpdateArgs([
          "abc123",
          "--title", "New Title",
          "--collect-emails", "verified",
          "--description", "New Desc",
        ]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.args.formId).toBe("abc123");
          expect(result.args.title).toBe("New Title");
          expect(result.args.description).toBe("New Desc");
          expect(result.args.collectEmails).toBe("verified");
        }
      });
    });

    describe("error cases", () => {
      it("should fail without formId", () => {
        const result = parseUpdateArgs(["--title", "Title"]);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Usage:");
        }
      });

      it("should fail without any update flags", () => {
        const result = parseUpdateArgs(["abc123"]);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Please specify at least one update");
        }
      });

      it("should fail with empty args", () => {
        const result = parseUpdateArgs([]);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("VALID_COLLECT_EMAILS_VALUES", () => {
    it("should contain all valid email collection types", () => {
      expect(VALID_COLLECT_EMAILS_VALUES).toContain("none");
      expect(VALID_COLLECT_EMAILS_VALUES).toContain("verified");
      expect(VALID_COLLECT_EMAILS_VALUES).toContain("input");
      expect(VALID_COLLECT_EMAILS_VALUES).toHaveLength(3);
    });
  });
});
