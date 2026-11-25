# AVISHKAR '26 — Quality Assurance & Testing Checklist

## Test Matrix & Results
- [x] **Room Creation:** Verifies 6-digit random code generation (Passed)
- [x] **Join Routing:** Direct URL query entry `?role=join&code=756772` lands on Joiner page (Passed)
- [x] **Double-Vote Shield:** Secondary vote attempts return 429 status and trigger warning toast (Passed)
- [x] **Recharts Streaming:** Host graph updates within 800ms of joiner vote submission (Passed)
- [x] **Q&A Feed:** Pinning, upvoting, and filtering (All, Pinned, Pending, Answered) operate in real time (Passed)
- [x] **Export CSV:** Downloads session metric summary file (Passed)
