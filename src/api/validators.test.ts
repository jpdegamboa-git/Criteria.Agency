import { describe, it, expect } from "vitest";
import {
  createExpectedPaymentSchema,
  createInvoiceSchema,
  createRuleSchema,
  updateTransactionSchema,
} from "./validators.js";

describe("createExpectedPaymentSchema", () => {
  const validPayload = {
    clientId: "550e8400-e29b-41d4-a716-446655440000",
    amount: "100.00",
    currency: "USD",
    description: "Payment for project",
    dueDate: "2025-06-01",
  };

  it("should accept valid input", () => {
    const result = createExpectedPaymentSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("should accept numeric amount", () => {
    const result = createExpectedPaymentSchema.safeParse({
      ...validPayload,
      amount: 250.5,
    });
    expect(result.success).toBe(true);
  });

  it("should default currency to USD", () => {
    const { currency, ...withoutCurrency } = validPayload;
    const result = createExpectedPaymentSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });

  it("should fail when clientId is missing", () => {
    const { clientId, ...withoutClientId } = validPayload;
    const result = createExpectedPaymentSchema.safeParse(withoutClientId);
    expect(result.success).toBe(false);
  });

  it("should fail when clientId is not a UUID", () => {
    const result = createExpectedPaymentSchema.safeParse({
      ...validPayload,
      clientId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with negative numeric amount", () => {
    const result = createExpectedPaymentSchema.safeParse({
      ...validPayload,
      amount: -50,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid string amount", () => {
    const result = createExpectedPaymentSchema.safeParse({
      ...validPayload,
      amount: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should accept datetime string for dueDate", () => {
    const result = createExpectedPaymentSchema.safeParse({
      ...validPayload,
      dueDate: "2025-06-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("createInvoiceSchema", () => {
  const validInvoice = {
    direction: "issued" as const,
    entityId: "550e8400-e29b-41d4-a716-446655440000",
    amount: "500.00",
    currency: "USD",
    issueDate: "2025-01-15",
  };

  it("should accept valid input", () => {
    const result = createInvoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("should accept 'received' direction", () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      direction: "received",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid direction", () => {
    const result = createInvoiceSchema.safeParse({
      ...validInvoice,
      direction: "outgoing",
    });
    expect(result.success).toBe(false);
  });

  it("should fail without entityId", () => {
    const { entityId, ...withoutEntity } = validInvoice;
    const result = createInvoiceSchema.safeParse(withoutEntity);
    expect(result.success).toBe(false);
  });

  it("should default metadata to empty object", () => {
    const result = createInvoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({});
    }
  });
});

describe("createRuleSchema", () => {
  const validRule = {
    pattern: "Netflix",
    matchType: "contains" as const,
    category: "Entertainment",
    transactionType: "expense" as const,
  };

  it("should accept valid rule with contains matchType", () => {
    const result = createRuleSchema.safeParse(validRule);
    expect(result.success).toBe(true);
  });

  it("should accept valid regex pattern", () => {
    const result = createRuleSchema.safeParse({
      ...validRule,
      matchType: "regex",
      pattern: "^Netflix.*$",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid regex pattern when matchType is regex", () => {
    const result = createRuleSchema.safeParse({
      ...validRule,
      matchType: "regex",
      pattern: "[invalid(",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const patternIssue = result.error.issues.find((i) =>
        i.path.includes("pattern")
      );
      expect(patternIssue).toBeDefined();
    }
  });

  it("should allow invalid regex when matchType is contains", () => {
    const result = createRuleSchema.safeParse({
      ...validRule,
      matchType: "contains",
      pattern: "[invalid(",
    });
    expect(result.success).toBe(true);
  });

  it("should default matchType to contains", () => {
    const { matchType, ...withoutMatch } = validRule;
    const result = createRuleSchema.safeParse(withoutMatch);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.matchType).toBe("contains");
    }
  });

  it("should default priority to 10", () => {
    const result = createRuleSchema.safeParse(validRule);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(10);
    }
  });
});

describe("updateTransactionSchema", () => {
  it("should fail with empty object", () => {
    const result = updateTransactionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should accept valid partial update with category", () => {
    const result = updateTransactionSchema.safeParse({
      category: "Food",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid partial update with type", () => {
    const result = updateTransactionSchema.safeParse({
      type: "income",
    });
    expect(result.success).toBe(true);
  });

  it("should accept multiple fields", () => {
    const result = updateTransactionSchema.safeParse({
      category: "Office",
      subcategory: "Supplies",
      notes: "Bought pens",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid type value", () => {
    const result = updateTransactionSchema.safeParse({
      type: "refund",
    });
    expect(result.success).toBe(false);
  });

  it("should accept null for nullable fields", () => {
    const result = updateTransactionSchema.safeParse({
      category: "Food",
      subcategory: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});
