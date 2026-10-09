import { test } from "node:test";
import assert from "node:assert/strict";

import {
  adviceFor,
  compareWithPlan,
  formatNaira,
  monthlyNeeded,
  monthsToGoal,
  parseAmount,
  splitIncome,
} from "../src/padimoney.js";

test("parseAmount accepts the ways people type money", () => {
  assert.equal(parseAmount("250000"), 250000);
  assert.equal(parseAmount("250,000"), 250000);
  assert.equal(parseAmount("₦250,000"), 250000);
  assert.equal(parseAmount(" N 75 000 "), 75000);
  assert.equal(parseAmount("1999.6"), 2000);
});

test("parseAmount rejects anything that is not an amount", () => {
  for (const bad of ["", "abc", "-500", "12k", null, undefined, "1.2.3"]) {
    assert.equal(parseAmount(bad), null, `expected null for ${bad}`);
  }
});

test("formatNaira adds the symbol and thousands separators", () => {
  assert.equal(formatNaira(250000), "₦250,000");
  assert.equal(formatNaira(0), "₦0");
  assert.equal(formatNaira(-1500), "-₦1,500");
});

test("splitIncome follows 50/30/20", () => {
  assert.deepEqual(splitIncome(200000), { needs: 100000, wants: 60000, savings: 40000 });
});

test("splitIncome parts always add up to the income, leftovers go to savings", () => {
  for (const income of [1, 7, 99, 101, 123457, 999999]) {
    const { needs, wants, savings } = splitIncome(income);
    assert.equal(needs + wants + savings, income);
    assert.ok(savings >= Math.floor(income * 0.2));
  }
});

test("splitIncome rejects zero, negative and non-whole amounts", () => {
  for (const bad of [0, -100, 10.5, NaN]) {
    assert.throws(() => splitIncome(bad));
  }
});

test("compareWithPlan flags overspending and undersaving", () => {
  const plan = splitIncome(200000);
  const rows = compareWithPlan(plan, { needs: 120000, wants: 50000, savings: 30000 });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.equal(byKey.needs.status, "over");
  assert.equal(byKey.needs.difference, 20000);
  assert.equal(byKey.wants.status, "on-track");
  assert.equal(byKey.savings.status, "under");
});

test("saving more than planned is on track, not a problem", () => {
  const rows = compareWithPlan(splitIncome(100000), { needs: 40000, wants: 20000, savings: 40000 });
  assert.ok(rows.every((r) => r.status === "on-track"));
});

test("missing categories count as zero", () => {
  const rows = compareWithPlan(splitIncome(100000), { needs: 50000 });
  assert.equal(rows.find((r) => r.key === "wants").actual, 0);
});

test("monthsToGoal rounds up to whole months", () => {
  assert.equal(monthsToGoal(500000, 0, 40000), 13);
  assert.equal(monthsToGoal(500000, 100000, 40000), 10);
  assert.equal(monthsToGoal(500000, 600000, 40000), 0);
  assert.equal(monthsToGoal(500000, 0, 0), null);
});

test("monthlyNeeded spreads the remaining amount and rounds up", () => {
  assert.equal(monthlyNeeded(500000, 0, 12), 41667);
  assert.equal(monthlyNeeded(500000, 500000, 12), 0);
  assert.throws(() => monthlyNeeded(500000, 0, 0));
});

test("advice points at the biggest problems", () => {
  const rows = compareWithPlan(splitIncome(200000), { needs: 150000, wants: 80000, savings: 0 });
  const tips = adviceFor(rows);
  assert.match(tips[0], /more than you earn/);
  assert.ok(tips.some((t) => t.includes("Needs are ₦50,000 over plan")));
  assert.ok(tips.some((t) => t.includes("Wants are ₦20,000 over plan")));
  assert.ok(tips.some((t) => t.includes("saving ₦40,000 less")));
});

test("advice is encouraging when everything is on plan", () => {
  const plan = splitIncome(200000);
  const tips = adviceFor(compareWithPlan(plan, plan));
  assert.equal(tips.length, 1);
  assert.match(tips[0], /on plan/);
});
