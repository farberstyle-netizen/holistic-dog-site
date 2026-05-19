# HTDA Source Audit

Last updated: 2026-05-18

## Summary of P3 changes

### Archived (moved to `_archive/legacy-html/`)

| File | Decision | Reason |
|------|----------|--------|
| `why.html` | Archived | Orphan — not linked from nav, footer, or any page. Key ceremonial disclaimer copy ("this certification bestows no privileges…") is already covered in `faq.html` (Legal & Certification Scope section) and in `about.html`. |
| `about-holistic.html` | Archived (was already in `_archive/`, now removed from root) | Earlier draft of the About page, fully superseded by `about.html`. |
| `footer-with-seal.html` | Archived (was already in `_archive/`, now removed from root) | Dev prototype for the footer seal. Replaced by `footer.js` component injection. |
| `theme-demo.html` | Archived (was already in `_archive/`, now removed from root) | Internal style showcase, not part of the public site. |

### Kept — public-facing pages

| File | Nav/Footer? | Notes |
|------|-------------|-------|
| `index.html` | — (homepage) | P1: full product-first rewrite |
| `about.html` | Footer → Organization | Institutional about page, leadership bios |
| `diploma.html` | Header nav (first item) + Footer → Resources | Primary product page |
| `how-it-works.html` | Header nav + Footer → Organization | P3: inline styles converted to CSS classes |
| `faq.html` | Footer → Resources | P2: new page (10 questions, 5 sections) |
| `contact.html` | Footer → Organization | P2: real fetch handler, direct email shown |
| `verify.html` | Header nav + Footer → Resources | P2: buyer-flow re-entry CTAs added |
| `gallery.html` | Footer → Resources | Dynamic dog gallery from API |
| `meet-our-dogs.html` | Footer → Resources (P3) | Editorial static dog bios — distinct from dynamic gallery |
| `advocacy.html` | Footer → Resources | Animal welfare legislation, legitimacy builder |
| `privacy-policy.html` | Footer → Resources | Complete, no changes needed |
| `terms.html` | Footer → Resources | Complete, includes ADA disclaimer |
| `careers.html` | Footer → Organization | P3: hardcoded legacy footer cleaned |

### Kept — authenticated user flow

| File | Notes |
|------|-------|
| `quiz.html` | Entry point for registration (3-question quiz) |
| `signup.html` | Step 2: account creation form |
| `add-dog.html` | Step 3: dog details form |
| `checkout.html` | Step 4: Stripe payment |
| `payment-success.html` | Post-payment confirmation |
| `payment-cancel.html` | P3: hardcoded legacy footer cleaned |
| `dashboard.html` | Authenticated user portal; P3: hardcoded legacy footer cleaned |
| `account.html` | Account settings |
| `order-history.html` | Order list |
| `login.html` | Login form |
| `forgot-password.html` | Password reset request |
| `reset-password.html` | Password reset form |
| `add-dog-congrats.html` | Post-quiz banner before registration |

### Kept — admin (not public)

| File | Notes |
|------|-------|
| `admin.html` | Admin dashboard |
| `admin-shipments.html` | Shipment management |
| `admin-messages.html` | Contact message viewer |

### Already archived (prior PRs)

| Location | Files | Reason |
|----------|-------|--------|
| `_archive/legacy-html/` | `about-holistic.html`, `footer-with-seal.html`, `theme-demo.html`, `why.html` | See table above |
| `_archive/docs/` | `API-MIGRATION-GUIDE.md`, `DARK-ACADEMIA-INTEGRATION-GUIDE.md`, `MERGE-REPORT.md`, `PR-DELIVERABLES.md`, `PR-DEPLOYMENT-FINALIZATION.md`, `PR-POST-MERGE-CLEANUP.md`, `PR-REPAIR-BROKEN-AUTH.md` | Internal dev docs from prior cycles, superseded |

## Navigation state (post-P1/P2/P3, after all PRs merged)

**Header nav:** The Diploma | How It Works | About | Gallery | Verify License

**Footer — Organization:** About Us | How It Works | Careers | Contact

**Footer — Resources:** The Diploma | FAQ | Verify License | Gallery | Meet Our Dogs | Advocacy | Privacy Policy | Terms

## Pending / out of scope

- `api-contact.js` Worker needs `CONTACT_TO_EMAIL` secret set before email delivery works (see `wrangler-api-contact.toml.sample`)
- `meet-our-dogs.html` has static hardcoded dog bios — could eventually be replaced with a dynamic editorial CMS or merged into gallery
- `careers.html` has no real job listings — content is placeholder
