# Clario: AI PayPal Dispute Evidence Copilot

> **Empowering merchants to defend PayPal disputes with verified facts, strict citations, and zero hallucinations.**

---

## 1. Inspiration & The Problem

Disputes and chargebacks cost merchants billions annually. When a buyer files a dispute on PayPal, merchants face strict deadlines, intricate documentation rules, and high administrative friction.

The biggest reasons merchants lose winnable disputes are procedural:
1. **Wrong Evidence Types**: Submitting a general invoice for an "Item Not Received" claim instead of carrier tracking and a signed proof of delivery.
2. **Unverified Factual Claims**: Making unsupported claims in notes (e.g. claiming an item was delivered when tracking only says "label created"), triggering immediate claim forfeiture upon reviewer verification.
3. **Contradictions with Past Records**: Providing descriptions that conflict with original catalog listings or customer correspondence.
4. **Formatting Violations**: Exceeding PayPal's 2000-character ceiling on notes, uploading unsupported file types, or ignoring HATEOAS lifecycle gates.

Merchants need an expert copilot that understands the **exact evidentiary requirements** of the PayPal Customer Disputes API (`v1/customer/disputes`), detects missing proof before submission, and prevents costly mistakes.

---

## 2. What Clario Does

**Clario** is a specialized defense workstation and AI evidence copilot:

- **Merchant Dashboard**: Real-time tracking of dispute counts by status, response deadlines, and lifecycle stages (`INQUIRY`, `CHARGEBACK`, etc.).
- **Dispute Workspace**: Inspects buyer claims, original transaction records, and provides an evidence manager utilizing a 5-status taxonomy (`Provided`, `Missing`, `Needs Verification`, `Potentially Contradictory`, `Not Relevant`).
- **AI Evidence Intelligence Panel (The Visual Centrepiece)**:
  - **Reason-Anchored Analysis**: Compares the dispute against official PayPal reason guidance (e.g. INR vs SNAD vs Credit Not Processed).
  - **Source Citation Enforcement**: Every finding and every sentence in the response draft must cite an existing input `source_id`.
  - **Anti-Hallucination Guardrails**: Any fact without documentation is labeled `UNVERIFIED`. The AI never invents tracking events, refunds, or customer statements.
  - **Contradiction Detection**: Flags discrepancies between customer complaints and catalog listings/specifications with source references.
  - **Internal Readiness Indicator**: A deterministic checklist score (0–100%) showing which defense requirements have been met. It never promises a win probability.
  - **2000-Character Notes Limit**: Dynamically drafts and truncates merchant notes to fit PayPal's strict character constraints.
- **Explicit Merchant Approval Gate**: Nothing is submitted to PayPal without explicit merchant authorization.
- **HATEOAS Invariant Enforcement**: Automatically checks whether the dispute status is `WAITING_FOR_SELLER_RESPONSE` and verifies that the `provide-evidence` HATEOAS link exists before allowing submission.

---

## 3. How PayPal is Used

Clario integrates directly with the **PayPal Customer Disputes API (v1)**:

- **OAuth 2.0 Server-Side Authentication**: `POST /v1/oauth2/token` using HTTP Basic Auth (`PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`).
- **Dispute Listing**: `GET /v1/customer/disputes` retrieving active merchant claims.
- **Dispute Details & HATEOAS Discovery**: `GET /v1/customer/disputes/{id}` parsing transaction metadata, customer narratives, existing evidence, and dynamic HATEOAS action links (`rel: provide-evidence`, `rel: accept-claim`, `rel: require-evidence`).
- **Multipart Evidence Submission**: `POST /v1/customer/disputes/{id}/provide-evidence` structured in the verified format:
  - Part `input`: JSON object containing `evidence_type` (mapped to official 32-value enum), `evidence_info` (`tracking_info`, `refund_ids`), and `notes` (strictly <= 2000 chars).
  - Part `file1`: Binary document attachment (.pdf, .jpg, .png up to 10 MB).
- **Sandbox Testing Script**: `scripts/create-sandbox-dispute.ts` generates unsigned JWT `PayPal-Auth-Assertion` headers for buyer dispute generation and triggers `POST /v1/customer/disputes/{id}/require-evidence` with `{"action":"SELLER_EVIDENCE"}` to transition claims to `WAITING_FOR_SELLER_RESPONSE`.

---

## 4. How AI is Used

Clario employs a dual AI architecture:

1. **Live Gemini AI Provider (`gemini-2.5-flash`)**:
   - Structured JSON output mode with strict schema enforcement.
   - Grounded with the official PayPal Reason Guidance for the specific dispute reason.
   - Enforces source citation constraints: every sentence must map to a `source_id`.
   - Prompt-injection defense: untrusted customer messages and documents are encapsulated within `<UNTRUSTED_EXTERNAL_SOURCES>` tags.
2. **Deterministic DEMO Fallback Engine**:
   - Executes when no `AI_API_KEY` is present.
   - Evaluates evidence items against the `EVIDENCE_MAP` knowledge base.
   - Validates that citations exist and detects factual contradictions deterministically.
   - Clearly labeled `DEMO` in the UI to prevent misleading users.

---

## 5. What is Real vs What is Mocked / Simulated

In the spirit of total hackathon integrity:

| Feature / Operation | Status | Implementation Details |
|---|---|---|
| **Server REST Architecture & UI** | **REAL & TESTED** | Full-stack server with 11/11 passing E2E tests, serving responsive fintech dashboard. |
| **PayPal API Client Code** | **REAL & TESTED** | Live `paypal-client.ts` implementing OAuth 2.0, GET disputes, GET details, and multipart POST evidence. |
| **Evidence Map & Schema Validation** | **REAL & TESTED** | 32 PayPal `evidence_type` enums, 10 dispute reason rules, and Zod-equivalent strict runtime validation. |
| **AI Evidence Intelligence Engine** | **REAL & TESTED** | Citation enforcement, contradiction detection, checklist generation, 2000-char limits, and Gemini integration. |
| **Automated Evaluation Harness** | **REAL & TESTED** | `npm run eval` tests 3 synthetic scenarios with 100% measured accuracy on tested criteria. |
| **Merchant Approval Gate & HATEOAS Locks**| **REAL & TESTED** | Strict rejection of unapproved submissions or locked dispute statuses. |
| **Live PayPal Sandbox Calls** | **SIMULATED FALLBACK** | When `PAYPAL_CLIENT_ID` is omitted in `.env`, disputes are served from realistic response fixtures and submissions update local state. Visibly labeled `SIMULATION` in UI and logs. Live sandbox evidence submission remains **NOT TESTED** against live PayPal servers until sandbox credentials are provided. |

---

## 6. Challenges We Ran Into

1. **PayPal Sandbox Dispute Creation Constraints**:
   - Buyer-side dispute creation via `POST /v1/customer/disputes` requires the restricted `DISPUTE_CREATE` scope and a real `buyer_transaction_id` from a manual personal sandbox payment.
   - *Solution*: Built a dedicated script (`scripts/create-sandbox-dispute.ts`) that documents the manual buyer steps and detects missing scopes with helpful troubleshooting.
2. **HATEOAS Invariant Nuance**:
   - Many developers mistakenly attempt evidence submission on disputes in `UNDER_REVIEW` or `INQUIRY`.
   - *Solution*: Implemented strict HATEOAS link validation in `checkEvidenceSubmissionPermitted`, locking submission unless `WAITING_FOR_SELLER_RESPONSE` and `provide-evidence` are active.
3. **AI Hallucinations in Dispute Evidence**:
   - Standard LLMs easily claim "Package was delivered" even when tracking shows only "Label Created".
   - *Solution*: Developed a strict citation and verification schema where any delivery claim without signature proof is flagged as an unsupported claim.

---

## 7. Accomplishments We're Proud Of

- **100% Measured Accuracy on AI Evaluation**: All 9 defense criteria across the 3 synthetic regression scenarios passed during `npm run eval`.
- **Zero Bloat, Blazingly Fast**: Zero heavy dependencies, starting in under 200ms using native Node.js v24 features.
- **Enterprise Fintech Aesthetics**: Clean, restrained dark-mode interface built with accessible typography, crisp status indicators, and responsive panels.
- **Uncompromising Honesty**: Clear visual distinctions between live operations and simulations, ensuring no user is ever deceived.

---

## 8. What's Next for Clario

- **Multi-File PDF Bundler**: Merge multiple merchant documents into an indexed single PDF attachment to overcome PayPal's single `file1` form field.
- **Automated Carrier API Polling**: Direct webhooks into FedEx, UPS, and DHL to automatically fetch delivery signatures upon dispute filing.
- **Webhook Dispute Ingestion**: Support PayPal webhooks (`CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.RESOLVED`) for zero-touch background dispute defense.
