import { describe, it, expect } from "vitest";
import {
  createExpectedPaymentSchema,
  createInvoiceSchema,
  createRuleSchema,
  updateTransactionSchema,
  createAlertRuleSchema,
  updateAlertStatusSchema,
  approvalResponseSchema,
  upsertDataSourceConfigSchema,
  updateAgentFileSchema,
  createCheckoutSchema,
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

describe("createAlertRuleSchema", () => {
  const validRule = {
    listenerType: "brand" as const,
    ruleName: "Brand Mention Rule",
    condition: { keyword: "criteria" },
    severity: "warning" as const,
  };

  it("should accept valid input", () => {
    const result = createAlertRuleSchema.safeParse(validRule);
    expect(result.success).toBe(true);
  });

  it("should default notificationChannels to empty array", () => {
    const result = createAlertRuleSchema.safeParse(validRule);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notificationChannels).toEqual([]);
    }
  });

  it("should accept all valid listenerType values", () => {
    for (const lt of ["brand", "culture", "industry", "competitive", "opportunity"] as const) {
      const result = createAlertRuleSchema.safeParse({ ...validRule, listenerType: lt });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid listenerType", () => {
    const result = createAlertRuleSchema.safeParse({ ...validRule, listenerType: "social" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid severity", () => {
    const result = createAlertRuleSchema.safeParse({ ...validRule, severity: "low" });
    expect(result.success).toBe(false);
  });

  it("should reject empty ruleName", () => {
    const result = createAlertRuleSchema.safeParse({ ...validRule, ruleName: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing condition", () => {
    const { condition, ...withoutCondition } = validRule;
    const result = createAlertRuleSchema.safeParse(withoutCondition);
    expect(result.success).toBe(false);
  });
});

describe("updateAlertStatusSchema", () => {
  it("should accept valid statuses", () => {
    for (const status of ["open", "acknowledged", "resolved", "dismissed"] as const) {
      const result = updateAlertStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status", () => {
    const result = updateAlertStatusSchema.safeParse({ status: "active" });
    expect(result.success).toBe(false);
  });

  it("should reject missing status", () => {
    const result = updateAlertStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("approvalResponseSchema", () => {
  const validResponse = {
    status: "approved" as const,
    respondedBy: "john@example.com",
  };

  it("should accept valid input", () => {
    const result = approvalResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("should accept all valid statuses", () => {
    for (const status of ["approved", "rejected", "escalated", "expired"] as const) {
      const result = approvalResponseSchema.safeParse({ ...validResponse, status });
      expect(result.success).toBe(true);
    }
  });

  it("should reject pending as a response status", () => {
    const result = approvalResponseSchema.safeParse({ ...validResponse, status: "pending" });
    expect(result.success).toBe(false);
  });

  it("should reject missing respondedBy", () => {
    const { respondedBy, ...withoutResponder } = validResponse;
    const result = approvalResponseSchema.safeParse(withoutResponder);
    expect(result.success).toBe(false);
  });

  it("should accept optional note", () => {
    const result = approvalResponseSchema.safeParse({ ...validResponse, note: "LGTM" });
    expect(result.success).toBe(true);
  });
});

describe("upsertDataSourceConfigSchema", () => {
  it("should accept valid config without schedule", () => {
    const result = upsertDataSourceConfigSchema.safeParse({ config: { apiKey: "abc123" } });
    expect(result.success).toBe(true);
  });

  it("should accept valid cron schedule", () => {
    const result = upsertDataSourceConfigSchema.safeParse({
      config: { apiKey: "abc123" },
      schedule: "0 6 * * *",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cron schedule", () => {
    const result = upsertDataSourceConfigSchema.safeParse({
      config: {},
      schedule: "not-a-cron",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing config", () => {
    const result = upsertDataSourceConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateAgentFileSchema", () => {
  it("should accept non-empty content", () => {
    const result = updateAgentFileSchema.safeParse({ content: "# Agent\n\nsome content" });
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = updateAgentFileSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing content", () => {
    const result = updateAgentFileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject non-string content", () => {
    const result = updateAgentFileSchema.safeParse({ content: 42 });
    expect(result.success).toBe(false);
  });
});

describe("createCheckoutSchema", () => {
  const validCheckout = {
    tier: "pro" as const,
    billingPeriod: "monthly" as const,
    name: "Juan Pablo",
    email: "juan@example.com",
    company: "Criteria Agency",
  };

  it("should accept valid checkout data", () => {
    const result = createCheckoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it("should reject invalid tier", () => {
    const result = createCheckoutSchema.safeParse({ ...validCheckout, tier: "enterprise" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid billingPeriod", () => {
    const result = createCheckoutSchema.safeParse({ ...validCheckout, billingPeriod: "weekly" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = createCheckoutSchema.safeParse({ ...validCheckout, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = createCheckoutSchema.safeParse({ ...validCheckout, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing company", () => {
    const { company, ...withoutCompany } = validCheckout;
    const result = createCheckoutSchema.safeParse(withoutCompany);
    expect(result.success).toBe(false);
  });
});
