# PayPal Customer Disputes API — Verified Technical Reference & Facts

This document compiles, cross-checks, and categorizes verified facts, setup requirements, and unverified assumptions regarding the PayPal Customer Disputes API (`v1/customer/disputes`), cross-referenced against the official PayPal Developer Documentation.

---

## 1. Official Documentation Sources

Cross-checked against the following official PayPal developer portals and API references:
1. **Use the Disputes API**: `https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api/`
2. **Integrate Disputes**: `https://developer.paypal.com/platforms/disputes/integrate-disputes/`
3. **Test and Go-Live**: `https://developer.paypal.com/disputes/test-go-live/`
4. **Dispute Reasons and Evidence Guidance**: `https://developer.paypal.com/disputes/reasons-evidence/` and `https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/`
5. **Customer Disputes API v1 Reference**: `https://developer.paypal.com/api/customer-disputes/v1/` and `https://developer.paypal.com/docs/api/customer-disputes/v1/`
6. **Supported File Types and Sizes Guide**: `https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api/#supported-file-types-and-sizes`

---

## 2. Status Classifications

### [VERIFIED] Documented in Two or More Official Pages & Confirmed
- **Base Endpoints (Merchant Side)**:
  - `GET /v1/customer/disputes`: List disputes. Query params include `dispute_state`, `page_size`, `next_page_token`.
  - `GET /v1/customer/disputes/{id}`: Show dispute details. Response provides `reason`, `status`, `dispute_amount`, `dispute_life_cycle_stage`, `disputed_transactions`, `evidences`, `offer`, `seller_response_due_date`, and `links` (HATEOAS).
  - Available merchant actions are dictated strictly by the HATEOAS `links` array in the dispute details response (`rel` values: `provide-evidence`, `accept-claim`, `make-offer`, `appeal`, etc.).
- **Evidence Submission (`POST /v1/customer/disputes/{id}/provide-evidence`)**:
  - `Content-Type`: `multipart/form-data`
  - Headers: `Authorization: Bearer <access_token>`
  - Form Parts:
    - `input`: Application/JSON string defining the evidence package.
    - `file1`: The binary document file.
  - JSON `input` structure:
    ```json
    {
      "evidences": [
        {
          "evidence_type": "PROOF_OF_FULFILLMENT",
          "evidence_info": {
            "tracking_info": [
              {
                "carrier_name": "FEDEX",
                "tracking_number": "122533485"
              }
            ]
          },
          "notes": "Delivered to buyer shipping address on record."
        }
      ]
    }
    ```
  - Refund evidence passes refund IDs in `evidence_info.refund_ids` (array of string transaction IDs).
  - Notes field constraint: strictly capped at **2000 characters**.
  - HTTP Response: `200 OK` with HATEOAS response links upon successful submission.
- **Merchant Submission Window**:
  - A merchant can provide evidence **only** when dispute status is `WAITING_FOR_SELLER_RESPONSE` and the `provide-evidence` HATEOAS link is explicitly present in `links`.
- **File Restrictions**:
  - Allowed file formats: `.jpg`, `.jpeg`, `.gif`, `.png`, `.pdf`.
  - File size limits: maximum **10 MB per individual file**; maximum **50 MB total** per API call.
- **Buyer-Side Dispute Creation (`POST /v1/customer/disputes`)**:
  - Used in sandbox testing to simulate buyer filing.
  - Headers require:
    - `Authorization: Bearer <access_token>`
    - `PayPal-Auth-Assertion: <JWT>`
    - `Content-Type: multipart/form-data`
  - Body form part: `input` containing `disputed_transactions[].buyer_transaction_id`, `reason`, `dispute_amount`, and optional extensions. Dispute amount must not exceed transaction amount.
  - `PayPal-Auth-Assertion` structure: Unsigned JWT with:
    - Header: `{"alg":"none","typ":"JWT"}` (Base64URL encoded)
    - Payload: `{"iss":"<CLIENT_ID>","email":"<BUYER_SANDBOX_EMAIL>"}` (Base64URL encoded)
    - Signature: Empty (`.` at the end)
- **Sandbox-Only Dispute State Manipulation**:
  - `POST /v1/customer/disputes/{id}/require-evidence`: Body `{"action":"SELLER_EVIDENCE"}`. Moves dispute from `UNDER_REVIEW` to `WAITING_FOR_SELLER_RESPONSE` when `require-evidence` link is present.
  - `POST /v1/customer/disputes/{id}/adjudicate`: Body `{"adjudication_outcome":"BUYER_FAVOR"|"SELLER_FAVOR"}`. Requires `UNDER_REVIEW` and `adjudicate` link.
- **Sandbox Test Note**:
  - Sandbox dispute test scenarios often use `OTHER` for simplicity, but the production schema accepts granular evidence types.

---

### [SETUP] Documented Sandbox Setup Requirements (May Require Manual Account Provisioning)
- **Buyer-Side Scope**: `DISPUTE_CREATE` (`https://uri.paypal.com/services/disputes/create`) is restricted and requires account manager enablement or custom app approval on PayPal Developer portals.
- **Buyer Consent**: App must have `openid` scope and the sandbox buyer must authenticate via "Log in with PayPal" to authorize assertions if consent is strictly enforced.
- **Buyer Transaction Prerequisite**: The buyer sandbox account must first **manually** send money or make a purchase with the merchant sandbox account. The generated transaction ID in buyer activity is the `buyer_transaction_id`. This cannot and should not be simulated with fake IDs because PayPal validates transaction records.

---

### [UNVERIFIED] Behavior Not Universally Guaranteed or Requiring Isolation
- **Multiple Files (`file2`, `file3`, etc.)**: PayPal's multipart documentation explicitly guarantees `file1`. Support for multiple binary form fields (`file2`, `file3`) is undocumented in v1; multiple documents are typically merged into a single multi-page PDF or submitted sequentially if allowed.
- **Webhook Delivery Latency in Sandbox**: Sandbox dispute webhooks (`CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.UPDATED`, `CUSTOMER.DISPUTE.RESOLVED`) may suffer variable delays (seconds to hours).
- **Universal Evidence Type Matrix in Sandbox**: While the API schema defines the full evidence enum, certain sandbox scenarios only advance when `OTHER` or `PROOF_OF_FULFILLMENT` is provided.

---

## 3. Complete `evidence_type` Enumeration Dump

Extracted from the official PayPal Customer Disputes v1 API schema:

| Enum Identifier | Description & Required Fields | Typical Dispute Reasons |
|---|---|---|
| `PROOF_OF_FULFILLMENT` | Tracking details (`carrier_name`, `tracking_number`) or delivery documentation. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED`, `UNAUTHORISED` |
| `PROOF_OF_REFUND` | Proof of refund with `refund_ids` array in `evidence_info`. | `CREDIT_NOT_PROCESSED`, `DUPLICATE_TRANSACTION` |
| `PROOF_OF_DELIVERY_SIGNATURE` | Delivery confirmation showing buyer/recipient physical or electronic signature. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` |
| `PROOF_OF_RECEIPT_COPY` | Copy of original sales receipt, invoice, or electronic checkout confirmation. | `INCORRECT_AMOUNT`, `DUPLICATE_TRANSACTION` |
| `RETURN_POLICY` | Store terms of service, cancellation policies, or refund rules in effect at purchase. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED`, `CREDIT_NOT_PROCESSED` |
| `ITEM_DESCRIPTION` | Product catalog listing, specs, condition description, or photos at time of sale. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `COPY_OF_CONTRACT` | Signed contract, service agreement, or subscription terms accepted by buyer. | `CANCELED_RECURRING_BILLING`, `UNAUTHORISED` |
| `PROOF_OF_RESHIPMENT` | Replacement shipment tracking details for items reported damaged or lost. | `PROBLEM_WITH_REPLACEMENT`, `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` |
| `PROOF_OF_DAMAGE` | Photos or assessment proving item condition prior to shipping or damaged in return. | `PROBLEM_WITH_REPLACEMENT`, `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE` | Expert appraisal, carrier inspection report, or third-party authenticator assessment. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `DECLARATION` | Signed merchant or customer declaration / affidavit. | `UNAUTHORISED`, `OTHER` |
| `PROOF_OF_MISSING_ITEMS` | Warehouse packing slips, weight scan records showing all items packed. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `PROOF_OF_EMPTY_PACKAGE_OR_DIFFERENT_ITEM` | Return package inspection receipt, carrier weight log showing empty box returned. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `PROOF_OF_ITEM_NOT_RECEIVED` | Buyer claim evidence (buyer side). | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` |
| `BILLING_AGREEMENT` | Recurring billing mandate, subscription terms, or pre-approved payment agreement. | `CANCELED_RECURRING_BILLING` |
| `ADDITIONAL_TRACKING_INFORMATION` | Supplemental carrier checkpoint events, transit history, or redelivery logs. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` |
| `CUSTOMS_DOCUMENT` | International customs declaration (CN22/CN23), import clearance slips. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` |
| `POLICE_REPORT` | Law enforcement agency crime report or fraud report. | `UNAUTHORISED` |
| `LEGALLY_BINDING_STATEMENT` | Formal legal statement or court affidavit. | `UNAUTHORISED`, `OTHER` |
| `MERCHANT_RESPONSE` | Merchant formal written rebuttal narrative. | All reasons |
| `CUSTOMER_COMMUNICATION` | Customer support transcripts, emails, chat history showing buyer acknowledgment. | All reasons |
| `TERMS_AND_CONDITIONS` | Complete website terms of service accepted during checkout. | `CANCELED_RECURRING_BILLING`, `CREDIT_NOT_PROCESSED` |
| `PROOF_OF_SERVICE_DELIVERY` | Service completion certificate, timesheets, digital access confirmation. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` (Intangibles) |
| `SERVER_ACCESS_LOGS` | Server authentication records, download timestamps, API usage records. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` (Digital) |
| `IP_ADDRESS_LOGS` | IP geolocation match, session logs matching account holder. | `UNAUTHORISED` |
| `PROOF_OF_SOFTWARE_LICENSE` | License key issuance log, software activation confirmation. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` (Software) |
| `PROOF_OF_DIGITAL_DOWNLOAD` | Electronic delivery receipt, download completion timestamp. | `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` (Digital) |
| `CANCELLATION_POLICY` | Explicit subscription cancellation timeframe and policy rules. | `CANCELED_RECURRING_BILLING` |
| `PROOF_OF_AUTHENTICITY` | Certificate of authenticity, licensed distributor invoice. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `APPRAISAL_DOCUMENT` | Certified valuation document from licensed third-party appraiser. | `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` |
| `REBUTTAL_EXPLANATION` | Contextual explanation clarifying disputed transactions. | `DUPLICATE_TRANSACTION`, `INCORRECT_AMOUNT` |
| `OTHER` | General fallback documentation with notes and attachment. | All reasons |

---

## 4. Reason-to-Evidence Guidance Matrix

Synthesized from PayPal's **Dispute Reasons and Evidence** guidance documentation:

| PayPal Dispute Reason (`reason`) | Required / Recommended Evidence Types | Mandatory Data Fields | Key Defense Rules |
|---|---|---|---|
| `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` | `PROOF_OF_FULFILLMENT`, `PROOF_OF_DELIVERY_SIGNATURE`, `ADDITIONAL_TRACKING_INFORMATION`, `PROOF_OF_SERVICE_DELIVERY`, `PROOF_OF_REFUND` | `carrier_name`, `tracking_number` under `evidence_info.tracking_info`. Alternatively `refund_ids`. | For physical goods: Must show shipment to the verified shipping address on the transaction. Signature required for high-value orders. For digital goods: Server download/access logs with IP/timestamp. |
| `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` | `ITEM_DESCRIPTION`, `RETURN_POLICY`, `CUSTOMER_COMMUNICATION`, `PROOF_OF_AUTHENTICITY`, `PROOF_OF_REFUND`, `OTHER` | Supporting document attachment (`file1`) and explicit notes (`<=2000` chars). | Must prove the item delivered matched the exact product listing, specifications, and condition presented at checkout. Include return policy terms. |
| `UNAUTHORISED` | `PROOF_OF_FULFILLMENT`, `IP_ADDRESS_LOGS`, `SERVER_ACCESS_LOGS`, `CUSTOMER_COMMUNICATION`, `PROOF_OF_REFUND` | `tracking_info` or login/access IP timestamps, device fingerprints. | Demonstrate payment was authorized by account holder (shipping to registered address, 2FA/3DS verification, prior transaction history). |
| `CREDIT_NOT_PROCESSED` | `PROOF_OF_REFUND`, `RETURN_POLICY`, `TERMS_AND_CONDITIONS`, `CUSTOMER_COMMUNICATION` | `refund_ids` under `evidence_info.refund_ids` if already refunded. | If already refunded, provide the refund transaction ID. If refund not due, provide return policy proving goods were non-returnable or outside window. |
| `DUPLICATE_TRANSACTION` | `REBUTTAL_EXPLANATION`, `PROOF_OF_RECEIPT_COPY`, `PROOF_OF_FULFILLMENT`, `PROOF_OF_REFUND` | Invoices / order receipts showing separate unique orders. | Show distinct order numbers, different items purchased, or separate fulfillment tracking for each transaction. If accidental duplicate, issue refund and submit `PROOF_OF_REFUND`. |
| `INCORRECT_AMOUNT` | `PROOF_OF_RECEIPT_COPY`, `ITEM_DESCRIPTION`, `COPY_OF_CONTRACT`, `PROOF_OF_REFUND` | Detailed receipt showing pricing calculation, taxes, discounts, shipping fees. | Prove the total charged matches the customer-approved cart and terms of sale. |
| `PAYMENT_BY_OTHER_MEANS` | `PROOF_OF_RECEIPT_COPY`, `REBUTTAL_EXPLANATION`, `PROOF_OF_REFUND` | Store ledger, accounting receipt, proof of payment method used. | Check if buyer paid via alternative method. If double-paid, provide refund ID. If not, demonstrate PayPal payment is the only settled payment. |
| `CANCELED_RECURRING_BILLING` | `BILLING_AGREEMENT`, `CANCELLATION_POLICY`, `CUSTOMER_COMMUNICATION`, `COPY_OF_CONTRACT`, `PROOF_OF_REFUND` | Agreement timestamp, cancellation log timestamps. | Show billing occurred prior to cancellation request according to agreement terms, or provide proof of cancellation cutoff date. |
| `PROBLEM_WITH_REPLACEMENT` | `PROOF_OF_RESHIPMENT`, `PROOF_OF_DELIVERY_SIGNATURE`, `CUSTOMER_COMMUNICATION` | `carrier_name` and `tracking_number` for replacement package. | Provide tracking showing replacement was dispatched and delivered to buyer. |
| `OTHER` | `MERCHANT_RESPONSE`, `CUSTOMER_COMMUNICATION`, `OTHER` | Detailed notes (`<= 2000` chars) and supporting document. | Comprehensive chronological summary of dispute circumstances. |

---

## 5. Dispute Lifecycle & Transitions

```
[Buyer Opens Dispute]
         │
         ▼
    INQUIRY / UNDER_REVIEW
         │
         ├────────────────────────────────────────┐
         │ (Sandbox: require-evidence)            │
         ▼                                        ▼
WAITING_FOR_SELLER_RESPONSE               WAITING_FOR_BUYER_RESPONSE
(HATEOAS: "provide-evidence")                     │
         │                                        │
         ├────────────────────────────────────────┘
         │ (Merchant Submits Evidence / Deadline Expires)
         ▼
    UNDER_REVIEW
         │
         ├────────────────────────────────────────┐
         │ (Sandbox: adjudicate)                  ▼
         ▼                                  RESOLVED (BUYER_FAVOR)
RESOLVED (SELLER_FAVOR)
```

- When in `WAITING_FOR_SELLER_RESPONSE`: Only then does PayPal expose `rel: "provide-evidence"`.
- If seller fails to respond before `seller_response_due_date`, dispute closes automatically in buyer favor.
