# Sidebiz Project Scout - 2026-03-23 09:00 JST

## Sources used
- Reddit public JSON (r/smallbusiness, r/reselling, r/Flipping, r/jobs, r/resumes)
- HN Algolia public API
- GitHub public repository search API (light check)

## High-signal pain points found
1. Bookkeeping / invoice matching
   - r/smallbusiness: "Anyone else lose their mind doing bookkeeping every month?" (61 pts / 136 comments)
   - r/smallbusiness: "Spent my Saturday manually matching 47 invoices to bank payments, there has to be a better way" (71 pts / 77 comments)
2. Missed calls / appointment no-shows / lead follow-up
   - r/smallbusiness: "How are other solo business owners handling missed calls professionally?" (29 pts / 61 comments)
   - r/smallbusiness: "Our dental clinic cut no-shows by like half after we stopped relying on phone calls" (583 pts / 193 comments)
3. Reseller listing fatigue / cross-listing
   - r/reselling: "My \"Death Pile\" keeps getting bigger because I dislike typing descriptions. Help." (247 pts / 226 comments)
   - r/Flipping: "Opinions on crosslisting apps? (Vendoo, Crosslist, etc)" (8 pts / 61 comments)
4. Job application tailoring / ATS frustration
   - r/jobs: "Why us? What a scam" (1369 pts / 399 comments)
   - r/resumes: "Why ATS Hates Your Resume (And Companies Are Fine With It)" (301 pts / 257 comments)

## Filtered ideas worth keeping (Japan + OpenClaw automatable)
1. Reseller listing/cross-post assistant
   - Target: Mercari / Yahoo!フリマ / ラクマ sellers
   - Sell: product title/description drafting, price suggestion, listing checklist, cross-post workflow
   - OpenClaw fit: browser automation + cron + image/file handling
   - Feasibility: high
2. Appointment / inquiry follow-up assistant
   - Target: small clinics, dental offices, salons, solo service businesses
   - Sell: reminder drafting, missed-call follow-up queue, no-show recovery workflow
   - OpenClaw fit: browser/email/chat workflow + cron reminders
   - Feasibility: medium-high
3. Invoice matching / payment follow-up assistant
   - Target: freelancers / small agencies / small B2B services
   - Sell: CSV import, payment matching suggestions, unpaid invoice reminders
   - OpenClaw fit: docs/spreadsheet/browser workflow, but banking integration is the bottleneck
   - Feasibility: medium

## Ideas intentionally deprioritized
- Resume tailoring / ATS helper: demand is obvious, but competition is already dense and differentiation is weak for a small Japan-first launch.

## This cycle baseline
- No prior matching "sidebiz project scout / feasibility" report was found in memory/workspace search, so this report should be treated as the baseline for future diffs.
