# Clario: AI PayPal Dispute Evidence Copilot

> **Built for the PayPal AI Hackathon**  
> An intelligent evidence copilot and defense workstation for merchants responding to customer disputes on the PayPal Customer Disputes API (`v1/customer/disputes`). Anchored directly to official PayPal dispute reason guidance and strict HATEOAS lifecycle state rules.

---

## 1. Problem & Innovation

Merchant dispute defense is error-prone, fragmented, and governed by strict regulatory windows. Merchants frequently submit the wrong evidence types (e.g. submitting generic invoices for Item Not Received claims instead of carrier tracking and delivery signatures), make unverified factual claims that trigger automatic claim forfeiture, or miss strict PayPal deadlines.

**Clario** provides a verified, AI-powered defense copilot:
- **Grounded in Official PayPal Truth**: Grounded directly in the official `v1/customer/disputes` schemas and the 32-value `evidence_type` specification.
- **Strict Evidence Citation & Anti-Hallucination**: Every AI finding and every sentence in the response draft must cite an existing input `source_id`. Facts without proof are explicitly marked `UNVERIFIED`.
- **Reason-Specific Compliance**: Differentiates between Item Not Received (requiring carrier tracking and signature proof), Not As Described (detecting listing vs complaint contradictions), and Credit Not Processed (requiring verified PayPal ledger refund IDs).
- **Enforced Guardrails**:
  - **Explicit Merchant Approval Gate**: No API call or submission ever occurs without merchant authorization.
  - **HATEOAS Invariant Enforcement**: Evidence submission is only offered if the dispute status is `WAITING_FOR_SELLER_RESPONSE` and PayPal exposes `rel: "provide-evidence"`.
  - **2000-Character Notes Limit**: Strict payload validation preventing truncated notes.
  - **File Restrictions**: Validates `.jpg`, `.jpeg`, `.gif`, `.png`, `.pdf` up to 10 MB per file.
  - **Zero Fake Statistics**: Internal readiness indicator is calculated deterministically from verified defense criteria satisfaction, never presented as a "win probability".

---

## 2. Quickstart & Installation

Clario is designed with zero bloated dependencies and runs immediately with Node.js v20+:

```bash
# Clone the repository and navigate into the workspace
git clone <repo-url>
cd Clario

# 1. Copy environment template
cp .env.example .env

# 2. Configure credentials in .env (Optional for local simulation)
# PAYPAL_CLIENT_ID=your_sandbox_client_id
# PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
# AI_API_KEY=your_gemini_api_key

# 3. Run regression and vertical slice test suites
npm test

# 4. Run automated AI evaluation suite
npm run eval

# 5. Start the web application
npm start
# Open http://localhost:3000 in your browser
```

---

## 3. PayPal Sandbox Configuration & Manual Buyer Steps

Per official PayPal requirements, disputes must originate from a **buyer payment** and cannot be created out of thin air.

### Step 1: Sandbox Accounts Setup
1. Log into the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Under **Testing Tools > Sandbox Accounts**, you will find two accounts auto-created:
   - A **Business Account** (your sandbox merchant receiving payments).
   - A **Personal Account** (your sandbox buyer paying for goods).
3. Under **Apps & Credentials**, create a REST App associated with the Business Account. Copy the `Client ID` and `Secret` to `.env`.

### Step 2: Manual Buyer Payment (Cannot Be Automated)
1. In an Incognito window, go to [https://sandbox.paypal.com](https://sandbox.paypal.com) and log in as your **Personal Sandbox Account**.
2. Click **Send & Request** and send money (e.g. `$25.00 USD`) to the **Business Sandbox Account** email.
3. Once completed, go to the buyer's **Activity** page. Click on the transaction to view details.
4. Copy the **Transaction ID** (e.g., `8AA1234567890123C`). This is your `BUYER_TRANSACTION_ID`.

### Step 3: Create Sandbox Dispute via Script
Clario provides an automated script that signs an unsigned JWT assertion and submits a multipart dispute creation request:

```bash
node --experimental-strip-types scripts/create-sandbox-dispute.ts <BUYER_TRANSACTION_ID> <BUYER_EMAIL> [REASON] [AMOUNT] [CURRENCY]
```

*Note on Sandbox Scope Restrictions:* The buyer-side endpoint `POST /v1/customer/disputes` requires the `DISPUTE_CREATE` scope (`https://uri.paypal.com/services/disputes/create`), which PayPal developer docs state is enabled by PayPal account managers. If your sandbox app lacks this scope, the script will print a clear scope notice. Clario handles this cleanly by supporting real merchant-side listing/retrieval against existing sandbox disputes, or falling back to verified fixtures labeled `SIMULATION`.

---

## 4. Test & Evaluation Commands

| Command | Purpose |
|---|---|
| `npm run test` | Runs the Stage 2 Vertical Slice Test Suite (`scripts/test-dispute-service.ts`) checking HATEOAS locks, notes limit, and approval gates. |
| `npm run eval` | Runs the Stage 3 Automated Regression Check (`scripts/run-eval.ts`) against the 3 synthetic dispute scenarios and measures accuracy. |
| `npm run smoke` | Runs the live PayPal credentials smoke test (`scripts/smoke-test.ts`). |
| `node --experimental-strip-types scripts/test-e2e.ts` | Runs the in-process Full-Stack End-to-End Suite (11 comprehensive tests). |

---

## 5. System Architecture & Dual-Mode Operation

```
┌─────────────────────────────────────────────────────────────┐
│                       Clario UI                             │
│    (Dashboard · Evidence Workspace · AI Copilot Panel)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
┌──────────────────────────────▼──────────────────────────────┐
│                  Clario Server Engine                       │
│              (src/server/index.ts - Node v24)               │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│       Dispute Service       │ │     AI Evidence Engine      │
│  (src/lib/dispute-service)  │ │   (src/lib/ai-service.ts)   │
└──────┬───────────────┬──────┘ └──────┬───────────────┬──────┘
       │ Live Creds?   │               │ AI Key?       │
       ▼ (Yes)         ▼ (No)          ▼ (Yes)         ▼ (No)
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│PayPal Sandbox││  Simulated   ││Google Gemini ││ Deterministic│
│  REST API    ││   Service    ││Live Generative││  DEMO Rules  │
│(paypal-client││(mock-dispute-││  API Engine  ││    Engine    │
│     .ts)     ││  service.ts) ││              ││ (EVIDENCE_MAP│
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
```

- **Dual-Mode Dispatcher**: Automatically detects whether `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are configured.
- **Transparent Simulation**: Any simulated record or action is visibly labeled `SIMULATION` in the UI and server logs. A simulated action is **never** presented as a real PayPal submission.
- **Evidence Schema Validation**: The AI response passes through `validateAIAnalysisResult`, ensuring that every citation references a real input source and that all recommended actions map to the official PayPal enum.

---

## 6. Project Structure

```
├── .env.example               # Environment variables template
├── .gitignore                 # Secrets and build ignore rules
├── CHECKPOINTS.md             # Engineering checkpoint logs across all 4 stages
├── DEVPOST.md                 # Hackathon project submission summary
├── LICENSE                    # MIT License
├── README.md                  # This documentation
├── SELF_EVALUATION.md         # Transparent self-evaluation and score out of 100
├── VIDEO_SCRIPT.md            # Honest, 3-minute video walkthrough script
├── docs/
│   └── paypal-facts.md        # Official PayPal technical reference & facts
├── fixtures/
│   └── evaluation-scenarios.json # 3 synthetic dispute scenarios for regression eval
├── public/
│   ├── index.html             # Responsive fintech dashboard & workspace UI
│   ├── app.js                 # Frontend application controller
│   └── styles.css             # Fintech design system & styling
├── scripts/
│   ├── create-sandbox-dispute.ts # Buyer dispute creation & assertion script
│   ├── run-eval.ts            # Automated regression evaluation harness
│   ├── smoke-test.ts          # Sandbox connection & credentials smoke test
│   ├── test-dispute-service.ts# Stage 2 vertical slice test suite
│   └── test-e2e.ts            # Stage 4 full-stack end-to-end test suite
└── src/
    ├── lib/
    │   ├── ai-schema.ts       # AI output schema & citation validation
    │   ├── ai-service.ts      # Live Gemini + Deterministic DEMO engine
    │   ├── dispute-service.ts # Unified dispatcher with simulation fallback
    │   ├── evidence-map.ts    # Reason-to-evidence matrix grounded in PayPal docs
    │   ├── mock-dispute-service.ts # Isolated simulation fixtures & state
    │   ├── paypal-client.ts   # Live PayPal sandbox REST client
    │   └── paypal-types.ts    # Strongly typed PayPal dispute models
    └── server/
        └── index.ts           # HTTP server, REST endpoints, file validator
```

---

## 7. License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
