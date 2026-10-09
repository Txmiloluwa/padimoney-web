# Padimoney

![Test and deploy](https://github.com/Txmiloluwa/padimoney-web/actions/workflows/deploy.yml/badge.svg)

**Live site: [txmiloluwa.github.io/padimoney-web](https://txmiloluwa.github.io/padimoney-web/)**

Padimoney ("padi" is Nigerian Pidgin for friend) helps salaried workers in Nigeria answer one question: *what should I do with my salary this month?*

It started as a [UX case study](https://txmiloluwa.framer.website) on financial literacy for Nigerian income earners. User interviews showed people wanted clear, practical money advice without jargon. This repository is the working version of that design.

## What it does

1. **Plans your salary.** Type your take-home pay and it splits instantly into needs (50%), wants (30%) and savings (20%), shown as a bar and in naira.
2. **Checks your spending.** Enter what actually went out in each group to see where you are over or under plan, with plain-language advice on what to change first.
3. **Plans a savings goal.** Enter a goal (rent, a laptop, school fees) to see how many months it will take, and how much to save each month to hit your deadline.

Nothing you type is sent anywhere. Everything runs in your browser.

## Design decisions

| Decision | Why |
|---|---|
| The salary input is the hero, in very large type | The first thing a user does is the most important thing on the page |
| Atkinson Hyperlegible for body text | A typeface designed for readability, matching the case study's focus on accessibility |
| Three colours checked for colour-blind safety | Every colour also has a visible text label, so meaning never relies on colour alone |
| Advice in plain sentences, biggest problem first | Interviewees wanted to know what to do, not just see numbers |
| Amounts accept `250000`, `250,000` or `₦250,000` | People type money in different ways, and the form should not fight them |

**Accessibility:** labelled form fields, live regions so screen readers announce updated results, visible keyboard focus, a skip link, a table for the comparison, a reduced-motion setting respected, and a layout that works down to phone width.

## How it is built

Plain HTML, CSS and JavaScript, with no framework and no build step.

```
index.html          the page
src/padimoney.js    the money logic (no page code, so it can be tested)
src/app.js          connects the logic to the page
src/styles.css      styles
tests/              13 automated tests (Node's built-in test runner)
```

Keeping the calculations in `padimoney.js`, separate from the page, means they can be tested on their own. The tests check things that are easy to get wrong:

- the 50/30/20 parts always add up exactly to the income (rounding leftovers go to savings)
- saving **more** than planned counts as on track, while spending more on needs or wants does not
- goal timelines round **up** to whole months, and an impossible goal is reported rather than crashing
- typed amounts with commas, spaces or the ₦ sign are understood, and invalid ones are rejected

On every push, **GitHub Actions** runs the tests and, if they pass, publishes the site to GitHub Pages.

## Run it yourself

```bash
git clone https://github.com/Txmiloluwa/padimoney-web.git
cd padimoney-web
npm test                       # run the tests (Node 20 or newer)
python3 -m http.server 8000    # then open http://localhost:8000
```

## Ideas for next steps

- Let users change the 50/30/20 split to suit their situation (e.g. high rent in Lagos)
- Save a plan on the device between visits
- A spending log that fills in the "actual" amounts over the month

*General guidance only, not financial advice.*
