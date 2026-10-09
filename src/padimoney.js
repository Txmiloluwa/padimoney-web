// Padimoney: the money logic, kept separate from the page so it can be tested.
// All amounts are whole naira. Nothing here touches the page (DOM).

export const PLAN = [
  { key: "needs", label: "Needs", share: 50, examples: "rent, food, transport, bills" },
  { key: "wants", label: "Wants", share: 30, examples: "eating out, outings, subscriptions" },
  { key: "savings", label: "Savings", share: 20, examples: "emergency fund, goals, investments" },
];

/** Turn what a person typed ("250,000", "₦ 250000", "250000.50") into whole naira, or null. */
export function parseAmount(text) {
  if (text === null || text === undefined) return null;
  const cleaned = String(text).replace(/[₦,\s]/g, "").replace(/^N/i, "");
  if (cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned));
}

/** 250000 -> "₦250,000" */
export function formatNaira(amount) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}₦${Math.abs(Math.round(amount)).toLocaleString("en-NG")}`;
}

/**
 * Split a monthly income using the 50/30/20 rule.
 * Rounding leftovers go to savings, so the three parts always add up to the income.
 */
export function splitIncome(income) {
  if (!Number.isInteger(income) || income <= 0) {
    throw new Error("Income must be a whole number greater than zero");
  }
  const needs = Math.floor((income * 50) / 100);
  const wants = Math.floor((income * 30) / 100);
  const savings = income - needs - wants;
  return { needs, wants, savings };
}

/**
 * Compare what someone actually spends with their plan.
 * Returns one row per category: planned, actual, difference (positive = over plan) and status.
 */
export function compareWithPlan(plan, actual) {
  return PLAN.map(({ key, label }) => {
    const planned = plan[key];
    const spent = actual[key] ?? 0;
    const difference = spent - planned;
    let status = "on-track";
    if (key === "savings") {
      // For savings, putting away LESS than planned is the problem.
      if (spent < planned) status = "under";
    } else if (spent > planned) {
      status = "over";
    }
    return { key, label, planned, actual: spent, difference, status };
  });
}

/** How many months to reach a goal, saving `monthly` each month. Null if it can never be reached. */
export function monthsToGoal(target, alreadySaved, monthly) {
  const remaining = target - alreadySaved;
  if (remaining <= 0) return 0;
  if (monthly <= 0) return null;
  return Math.ceil(remaining / monthly);
}

/** How much to save each month to reach a goal in a given number of months. */
export function monthlyNeeded(target, alreadySaved, months) {
  if (!Number.isInteger(months) || months <= 0) {
    throw new Error("Months must be a whole number greater than zero");
  }
  const remaining = Math.max(0, target - alreadySaved);
  return Math.ceil(remaining / months);
}

/**
 * Plain-language advice based on the comparison rows.
 * Returns a short list of messages, most important first.
 */
export function adviceFor(rows) {
  const tips = [];
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  const totalSpent = rows.reduce((sum, r) => sum + r.actual, 0);
  const income = rows.reduce((sum, r) => sum + r.planned, 0);

  if (totalSpent > income) {
    tips.push(`You are spending ${formatNaira(totalSpent - income)} more than you earn. Start by cutting wants before anything else.`);
  }
  if (byKey.needs.status === "over") {
    tips.push(`Needs are ${formatNaira(byKey.needs.difference)} over plan. Rent and transport are usually the biggest levers. Check if either can come down.`);
  }
  if (byKey.wants.status === "over") {
    tips.push(`Wants are ${formatNaira(byKey.wants.difference)} over plan. Try a weekly limit for eating out and outings.`);
  }
  if (byKey.savings.status === "under") {
    tips.push(`You are saving ${formatNaira(-byKey.savings.difference)} less than planned. Move savings out on payday, before you spend, so it happens automatically.`);
  }
  if (tips.length === 0) {
    tips.push("You are on plan this month. Build an emergency fund of 3 to 6 months of needs before investing.");
  }
  return tips;
}
