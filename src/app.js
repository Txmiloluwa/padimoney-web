// Connects the page to the money logic in padimoney.js.
import {
  PLAN,
  adviceFor,
  compareWithPlan,
  formatNaira,
  monthlyNeeded,
  monthsToGoal,
  parseAmount,
  splitIncome,
} from "./padimoney.js";

const $ = (selector) => document.querySelector(selector);

const incomeInput = $("#income");
const incomeError = $("#income-error");
const bar = $("#bar");
const splitList = $("#split-list");
const spendingForm = $("#spending");
const compareBody = $("#compare tbody");
const adviceList = $("#advice");
const goalForm = $("#goal");
const goalResult = $("#goal-result");

let plan = null;

/** Re-format a field as the user types, e.g. "250000" -> "250,000", keeping it readable. */
function tidy(input) {
  const value = parseAmount(input.value);
  if (value !== null && document.activeElement !== input) {
    input.value = value.toLocaleString("en-NG");
  }
}

function markInvalid(input, invalid) {
  input.setAttribute("aria-invalid", invalid ? "true" : "false");
}

function renderSplit() {
  const income = parseAmount(incomeInput.value);
  const valid = income !== null && income > 0;
  markInvalid(incomeInput, !valid);
  incomeError.hidden = valid;

  if (!valid) {
    incomeError.textContent = "Enter your pay as a number, for example 250,000.";
    plan = null;
    bar.replaceChildren();
    splitList.replaceChildren();
    bar.setAttribute("aria-label", "");
    renderComparison();
    return;
  }

  plan = splitIncome(income);
  bar.replaceChildren(
    ...PLAN.map(({ key, share }) => {
      const segment = document.createElement("span");
      segment.className = `segment ${key}`;
      segment.style.flex = `0 0 calc(${share}% - 2px)`;
      return segment;
    })
  );
  bar.setAttribute(
    "aria-label",
    PLAN.map(({ key, label, share }) => `${label} ${share}%: ${formatNaira(plan[key])}`).join(", ")
  );

  splitList.replaceChildren(
    ...PLAN.map(({ key, label, share, examples }) => {
      const item = document.createElement("div");
      item.className = "split-item";
      item.innerHTML = `
        <dt><span class="swatch" style="background: var(--${key})"></span>${label} <span class="hint">${share}%</span></dt>
        <dd><span class="amount">${formatNaira(plan[key])}</span><span class="examples">${examples}</span></dd>`;
      return item;
    })
  );
  renderComparison();
}

function statusText(row) {
  if (row.status === "over") return `${formatNaira(row.difference)} over`;
  if (row.status === "under") return `${formatNaira(-row.difference)} short`;
  return "On track";
}

function renderComparison() {
  if (!plan) {
    compareBody.innerHTML = `<tr><td colspan="4">Enter your monthly pay above to see your plan.</td></tr>`;
    adviceList.replaceChildren();
    return;
  }

  const actual = {};
  let allValid = true;
  for (const input of spendingForm.elements) {
    const value = input.value.trim() === "" ? 0 : parseAmount(input.value);
    markInvalid(input, value === null);
    if (value === null) allValid = false;
    actual[input.name] = value ?? 0;
  }

  const rows = compareWithPlan(plan, actual);
  compareBody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <th scope="row"><span class="group-name"><span class="swatch" style="background: var(--${row.key})"></span>${row.label}</span></th>
        <td>${formatNaira(row.planned)}</td>
        <td>${formatNaira(row.actual)}</td>
        <td class="status ${row.status}">${statusText(row)}</td>
      </tr>`
    )
    .join("");

  const tips = allValid ? adviceFor(rows) : ["One of the amounts above is not a number. Fix it to see Padi's advice."];
  adviceList.replaceChildren(
    ...tips.map((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      return li;
    })
  );
}

function monthName(monthsFromNow) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function renderGoal() {
  const values = {};
  let valid = true;
  for (const input of goalForm.elements) {
    const value = input.value.trim() === "" && input.name === "saved" ? 0 : parseAmount(input.value);
    const ok = value !== null && (input.name === "saved" || value > 0);
    markInvalid(input, !ok);
    if (!ok) valid = false;
    values[input.name] = value;
  }

  if (!valid) {
    goalResult.innerHTML = `<p class="headline">Fill in every box with a number to see your timeline.</p>`;
    return;
  }

  const { target, saved, monthly, months } = values;
  if (saved >= target) {
    goalResult.innerHTML = `<p class="headline">You already have enough for this goal.</p>`;
    return;
  }

  const needed = monthsToGoal(target, saved, monthly);
  const perMonth = monthlyNeeded(target, saved, months);
  const onTime = needed <= months;

  let advice;
  if (onTime) {
    advice = `That is within your ${months}-month target.`;
  } else {
    const gap = perMonth - monthly;
    advice = `To hit your ${months}-month target, save ${formatNaira(perMonth)} a month instead, ${formatNaira(gap)} more than now.`;
    if (plan && perMonth > plan.savings) {
      advice += ` That is more than the ${formatNaira(plan.savings)} your plan sets aside, so it would have to come out of wants.`;
    }
  }

  goalResult.innerHTML = `
    <p class="headline">At ${formatNaira(monthly)} a month, you'll reach ${formatNaira(target)} in ${needed} month${needed === 1 ? "" : "s"}, around ${monthName(needed)}.</p>
    <p>${advice}</p>`;
}

incomeInput.addEventListener("input", renderSplit);
spendingForm.addEventListener("input", renderComparison);
goalForm.addEventListener("input", renderGoal);
for (const input of document.querySelectorAll("input")) {
  input.addEventListener("blur", () => tidy(input));
}
for (const form of [spendingForm, goalForm]) {
  form.addEventListener("submit", (event) => event.preventDefault());
}

renderSplit();
renderGoal();
