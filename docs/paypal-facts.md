# PayPal Customer Disputes API — Verified Technical Reference & Facts (AUDITED)

This document compiles, cross-checks, and categorizes verified facts, setup requirements, and unverified assumptions regarding the PayPal Customer Disputes API (`v1/customer/disputes`), cross-referenced against the official PayPal Developer Documentation and the official OpenAPI 3.0 specification (`openapi/customer_disputes_v1.json` from `paypal/paypal-rest-api-specifications`).

---

## 1. Official Documentation & Schema Sources

Directly verified against:
1. **Official OpenAPI Specification**: `openapi/customer_disputes_v1.json` (Repository: `paypal/paypal-rest-api-specifications`).
2. **Customer Disputes API v1 Reference**: `https://developer.paypal.com/api/customer-disputes/v1/`
3. **Dispute Reasons and Evidence Guidance**: `https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/`
4. **Use the Disputes API**: `https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api/`
5. **Integrate Disputes**: `https://developer.paypal.com/platforms/disputes/integrate-disputes/`
6. **Test and Go-Live**: `https://developer.paypal.com/disputes/test-go-live/`

---

## 2. Status Classifications

### [VERIFIED] Documented in Official Schema & API Reference
- **Base Endpoints (Merchant Side)**:
  - `GET /v1/customer/disputes`: List disputes. Parameters: `dispute_state`, `page_size`, `next_page_token`.
  - `GET /v1/customer/disputes/{id}`: Show dispute details.
  - Available merchant actions are governed strictly by the HATEOAS `links` array in the dispute details response (`rel` values: `provide-evidence`, `accept-claim`, `make-offer`, `appeal`, etc.).
- **Evidence Submission (`POST /v1/customer/disputes/{id}/provide-evidence`)**:
  - `Content-Type`: `multipart/form-data`
  - Headers: `Authorization: Bearer <access_token>`
  - Form Parts:
    - `input`: Application/JSON string defining the evidence package.
    - `file1`: The binary document file.
  - Notes field constraint: strictly capped at **2000 characters** (Regex pattern in schema: `^(.|\r?\n)*$`, `maxLength: 2000`).
  - Expected `evidence_info`:
    - Expected for `PROOF_OF_FULFILLMENT`, `PROOF_OF_REFUND`, and `PROOF_OF_RETURN`.
    - Documents and notes can be given for the rest of the evidence types.
    - When submitting `tracking_info`: `carrier_name` and `tracking_number` are marked `required` in schema.
    - When `carrier_name` is `OTHER`: `carrier_name_other` is mandatory.
    - When submitting `refund_ids`: array of string refund identifiers is expected.
  - Success Response: `200 OK` with `subsequent_action` HATEOAS links.
- **Merchant Submission Window**:
  - A merchant can provide evidence **only** when dispute status is `WAITING_FOR_SELLER_RESPONSE` and the `provide-evidence` HATEOAS link is explicitly present.
- **File Restrictions**:
  - Allowed formats: `.jpg`, `.jpeg`, `.gif`, `.png`, `.pdf`.
  - File size limits: maximum **10 MB per individual file**; maximum **50 MB total** per API call.
- **Buyer-Side Dispute Creation (`POST /v1/customer/disputes`)**:
  - Requires `PayPal-Auth-Assertion` header: Unsigned JWT with `{"alg":"none","typ":"JWT"}` header, `{"iss":"<CLIENT_ID>","email":"<BUYER_EMAIL>"}` payload, and empty signature (`header.payload.`).
- **Sandbox State Manipulation Endpoints**:
  - `POST /v1/customer/disputes/{id}/require-evidence`: Body `{"action":"SELLER_EVIDENCE"}`. Moves dispute from `UNDER_REVIEW` to `WAITING_FOR_SELLER_RESPONSE`.
  - `POST /v1/customer/disputes/{id}/adjudicate`: Body `{"adjudication_outcome":"BUYER_FAVOR"|"SELLER_FAVOR"}`. Requires `UNDER_REVIEW` and `adjudicate` link.

---

### [SETUP] Documented Sandbox Setup Requirements
- **Buyer-Side Scope**: `DISPUTE_CREATE` (`https://uri.paypal.com/services/disputes/create`) requires account manager enablement or custom app approval on PayPal Developer portals.
- **Buyer Consent**: App must have `openid` scope and the sandbox buyer must authenticate via "Log in with PayPal" to authorize assertions if consent is strictly enforced.
- **Buyer Transaction Prerequisite**: The buyer sandbox account must first **manually** send money or make a purchase with the merchant sandbox account. The generated transaction ID in buyer activity is the `buyer_transaction_id`. This cannot be faked because PayPal validates transaction records.

---

### [UNVERIFIED] Behavior Not Universally Guaranteed or Requiring Isolation
- **Multiple Files Beyond `file1`**: PayPal's multipart documentation and OpenAPI schema explicitly detail a single `evidence-file` binary part (typically transmitted as `file1`). Support for multiple file parts (`file2`, `file3`) is undocumented in v1.
- **Webhook Delivery Latency**: Sandbox dispute webhooks (`CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.UPDATED`) may experience variable delivery delays.
- **Legacy Reason Variant `PROBLEM_WITH_REPLACEMENT`**: The official OpenAPI enum for `dispute_reason` defines `PROBLEM_WITH_REMITTANCE`, not `PROBLEM_WITH_REPLACEMENT`. While replacement disputes are discussed in merchant help articles, the API enum identifier is unverified in modern schema.

---

## 3. Official `evidence_type` Enumeration (Exactly 76 Values)

Extracted directly from `components.schemas.evidence.properties.evidence_type.enum` in the official PayPal Customer Disputes v1 OpenAPI specification (`customer_disputes_v1.json`):

| # | Enum Identifier | Official Schema Description (`x-enumDescriptions`) |
|---|---|---|
| 1 | `PROOF_OF_FULFILLMENT` | Proof of fulfillment should be a copy of the actual shipping label on the package that shows the destination address and the shipping company's stamp to verify the shipment date. |
| 2 | `PROOF_OF_REFUND` | Proof of refund issued to the buyer. |
| 3 | `PROOF_OF_DELIVERY_SIGNATURE` | Proof of delivery signature. |
| 4 | `PROOF_OF_RECEIPT_COPY` | Copy of original receipt or invoice. |
| 5 | `RETURN_POLICY` | Copy of terms and conditions, contract or store return policy. |
| 6 | `BILLING_AGREEMENT` | Copy of billing agreement. |
| 7 | `PROOF_OF_RESHIPMENT` | Proof of reshipment should be a copy of the actual shipping label on the package that shows the destination address and the shipping company's stamp to verify the reshipment date. |
| 8 | `ITEM_DESCRIPTION` | A copy of the original description of the item or service. |
| 9 | `POLICE_REPORT` | Copy of the police report filed. |
| 10 | `AFFIDAVIT` | More information has to be provided about the claim using the affidavit. |
| 11 | `PAID_WITH_OTHER_METHOD` | Document showing item/service was paid by another payment method. |
| 12 | `COPY_OF_CONTRACT` | Copy of contract if applicable. |
| 13 | `TERMINAL_ATM_RECEIPT` | Copy of terminal/ATM receipt. |
| 14 | `PRICE_DIFFERENCE_REASON` | Explanation of what the price difference is related to (increased tip amount, shipping charges, taxes, etc). |
| 15 | `SOURCE_CONVERSION_RATE` | Source of expected conversion rate or fee. |
| 16 | `BANK_STATEMENT` | Bank/Credit statement showing withdrawal transaction. |
| 17 | `CREDIT_DUE_REASON` | The credit due reason. |
| 18 | `REQUEST_CREDIT_RECEIPT` | The request credit receipt. |
| 19 | `PROOF_OF_RETURN` | Proof of shipment or postage that shows you returned this item to your seller and should be a copy of the actual shipping label used. |
| 20 | `CREATE` | Additional evidence information during case creation. |
| 21 | `CHANGE_REASON` | The evidence related to the reason change. |
| 22 | `PROOF_OF_REFUND_OUTSIDE_PAYPAL` | Document should show that the seller issued a refund outside Paypal. |
| 23 | `RECEIPT_OF_MERCHANDISE` | Check with buyer if item Delivered (seller provided Proof of Shipping). |
| 24 | `CUSTOMS_DOCUMENT` | Document confirming that the item has been confiscated. |
| 25 | `CUSTOMS_FEE_RECEIPT` | Custom fees receipt paid by the buyer. |
| 26 | `INFORMATION_ON_RESOLUTION` | Any resolution reached with the seller should be communicated to PayPal. |
| 27 | `ADDITIONAL_INFORMATION_OF_ITEM` | Any additional information of the item purchased. |
| 28 | `DETAILS_OF_PURCHASE` | Specific details of a purchase made under a particular transaction has to be given. |
| 29 | `PROOF_OF_SIGNIFICANT_DIFFERENCE` | More information required on how the item was damaged or was significantly different from the item advertised. |
| 30 | `PROOF_OF_SOFTWARE_OR_SERVICE_NOT_AS_DESCRIBED` | Any screenshot or download/usage log showing that the software or service was unavailable or non-functional. |
| 31 | `PROOF_OF_CONFISCATION` | Documentation from a third party or organization that evaluated this item that confirms they confiscated it. |
| 32 | `PROOF_OF_DAMAGE` | Documentation supporting the claim that the item is damaged. |
| 33 | `COPY_OF_LAW_ENFORCEMENT_AGENCY_REPORT` | Report filed with a law enforcement agency or government organization (e.g. www.ic3.gov, state police, FBI, Postal Inspection Service). |
| 34 | `ADDITIONAL_PROOF_OF_SHIPMENT` | Additional proof of shipment such as a packing list, detailed invoice, or shipping manifest to confirm all items shipped. Include carrier name and tracking number. |
| 35 | `PROOF_OF_DENIAL_BY_CARRIER` | Documentation from the carrier confirming reason why they refuse to ship item and extent of original damage. |
| 36 | `THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE` | Proof from an unbiased third-party (dealer, appraiser) detailing damage or explaining how item received differs from advertised. |
| 37 | `VALID_SUPPORTING_DOCUMENT` | Document to clearly show how the item received significantly differs from the item advertised. |
| 38 | `LEGIBLE_SUPPORTING_DOCUMENT` | Document that is legible and clear to read (replaces an illegible or unclear submission). |
| 39 | `RETURN_TRACKING_INFORMATION` | Online tracking information for remaining items that have to be shipped to the seller. |
| 40 | `DELIVERY_RECEIPT` | Confirmation that the item has been received. |
| 41 | `PROOF_OF_INSTORE_RECEIPT` | In-store receipt or online verification showing buyer picked up the item. |
| 42 | `ADDITIONAL_TRACKING_INFORMATION` | Tracking information including carrier name, online tracking number, and tracking URL. |
| 43 | `PROOF_OF_SHIPMENT_POSTAGE` | Copy of actual shipping label on package showing destination address and carrier's stamp to verify shipment date. |
| 44 | `ONLINE_TRACKING_INFORMATION` | Online tracking information to confirm delivery of item. |
| 45 | `PROOF_OF_INSTORE_REFUND` | In-store refund receipt or company documentation clearly showing a completed refund. |
| 46 | `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED` | Compelling evidence proving software/service was as described and delivered to buyer (transaction ID, invoice ID, buyer name/email, delivery timestamp). |
| 47 | `RETURN_ADDRESS_FOR_SHIPPING` | Return address required for buyer to ship merchandise back to seller. |
| 48 | `COPY_OF_THE_EPARCEL_MANIFEST` | Copy of the eparcel manifest showing buyer's address from Australia Post. |
| 49 | `COPY_OF_SHIPPING_MANIFEST` | Shipping manifest showing buyer's address obtained from carrier. |
| 50 | `APPEAL_AFFIDAVIT` | Appeal affidavit needed to appeal case outcome. |
| 51 | `RECEIPT_OF_REPLACEMENT` | Check with buyer if replacement item sent by seller was received. |
| 52 | `COPY_OF_DRIVERS_LICENSE` | Copy of driver's license. |
| 53 | `ACCOUNT_CHANGE_INFORMATION` | Additional details about how account was accessed or what was changed. |
| 54 | `DELIVERY_ADDRESS` | Address where item was supposed to be delivered. |
| 55 | `CONFIRMATION_OF_RESOLUTION` | Confirmation that item was received and issue resolved. |
| 56 | `MERCHANT_RESPONSE` | Copy of merchant's response when resolution was attempted. |
| 57 | `PERMISSION_DESCRIPTION` | Detailed description about account or card level permission given to another person. |
| 58 | `STATUS_OF_MERCHANDISE` | Details of the merchandise's current location. |
| 59 | `LOST_CARD_DETAILS` | Details of where and when the card was lost/stolen. |
| 60 | `LAST_VALID_TRANSACTION_DETAILS` | Details of the last valid transaction made on the card. |
| 61 | `ADDITIONAL_PROOF_OF_RETURN` | Document to confirm that item to be returned to seller has been shipped. |
| 62 | `DECLARATION` | Signed declaration about the information provided. |
| 63 | `PROOF_OF_MISSING_ITEMS` | Image of open box with returned items and shipping label clearly visible. |
| 64 | `PROOF_OF_EMPTY_PACKAGE_OR_DIFFERENT_ITEM` | Image of empty box or returned items different from what was expected with shipping label visible. |
| 65 | `PROOF_OF_ITEM_NOT_RECEIVED` | Proof about non-receipt of item, such as screenshot of tracking info. |
| 66 | `ORDER_DETAILS` | Order details or photos of the item/service/booking/digital download available on the website. |
| 67 | `LISTING_URL` | Website URLs of the item/service/booking/digital download. |
| 68 | `SHIPPING_INSURANCE` | Insurance information of the shipped item. |
| 69 | `BUYER_RESPONSE` | Copy of buyer response or document showing buyer's understanding of item/service purchased. |
| 70 | `PHOTOS_OF_SHIPPED_ITEM` | Photos of the item that were shipped to the buyer. |
| 71 | `OTHER` | Other. |
| 72 | `CANCELLATION_DETAILS` | Cancellation details information (cancellation date, cancellation number). |
| 73 | `MERCHANT_CONTACT_DETAILS` | Merchant contacted details (contact timestamp, mode of contact). |
| 74 | `ITEM_DETAILS` | Item related details (e.g. expected delivery date). |
| 75 | `CORRECT_RECIPIENT_INFORMATION` | Proof of the correct recipient name, email or phone. |
| 76 | `EXPLANATION_OF_FUNDS_NOT_DELIVERED` | Details on why funds were not delivered to correct recipient. |

---

## 4. Ordinary Supporting Documents & Evidence Descriptions (NOT API Enums)

The following 12 identifiers previously appeared in draft documentation and have been audited and removed from the API enum list. They represent ordinary file descriptions, merchant advice, or policy terms, and must be submitted under their corresponding valid API enum:

1. `IP_ADDRESS_LOGS`: Supporting document for digital goods. Not an API enum. Submit under `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED`, `ORDER_DETAILS`, or `OTHER`.
2. `SERVER_ACCESS_LOGS`: Supporting document for software/services. Not an API enum. Submit under `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED` or `OTHER`.
3. `CUSTOMER_COMMUNICATION`: Descriptive category. Official enums are `MERCHANT_RESPONSE`, `BUYER_RESPONSE`, or `MERCHANT_CONTACT_DETAILS`.
4. `TERMS_AND_CONDITIONS`: Descriptive category. Official enums are `RETURN_POLICY` or `COPY_OF_CONTRACT`.
5. `LEGALLY_BINDING_STATEMENT`: Descriptive phrase. Official enums are `AFFIDAVIT` or `DECLARATION`.
6. `PROOF_OF_SERVICE_DELIVERY`: Non-standard string. The official OpenAPI enum identifier is `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED`.
7. `PROOF_OF_SOFTWARE_LICENSE`: Non-standard string. Official enums are `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED` or `ORDER_DETAILS`.
8. `PROOF_OF_DIGITAL_DOWNLOAD`: Non-standard string. Official enums are `ORDER_DETAILS` or `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED`.
9. `CANCELLATION_POLICY`: Descriptive phrase. Official enums are `RETURN_POLICY` or `CANCELLATION_DETAILS`.
10. `PROOF_OF_AUTHENTICITY`: Descriptive category. Official enums are `THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE` or `VALID_SUPPORTING_DOCUMENT`.
11. `APPRAISAL_DOCUMENT`: Descriptive category. Official enum is `THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE`.
12. `REBUTTAL_EXPLANATION`: General description. Official enum is `MERCHANT_RESPONSE` or `OTHER`.

---

## 5. Official Dispute Reasons (`dispute_reason`)

Extracted from `components.schemas.dispute_reason.enum` (10 values):
1. `MERCHANDISE_OR_SERVICE_NOT_RECEIVED`
2. `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED`
3. `UNAUTHORISED`
4. `CREDIT_NOT_PROCESSED`
5. `DUPLICATE_TRANSACTION`
6. `INCORRECT_AMOUNT`
7. `PAYMENT_BY_OTHER_MEANS`
8. `CANCELED_RECURRING_BILLING`
9. `PROBLEM_WITH_REMITTANCE` *(Note: Official 9th enum is Remittance, not Replacement)*
10. `OTHER`

---

## 6. Audited Reason-to-Evidence Matrix: Mandatory vs Recommendations

| Dispute Reason (`reason`) | Verification Status | Primary & Alternative Official Enums | API Schema Mandatory Requirements | Defense Recommendations (Seller Protection / Best Practice) |
|---|---|---|---|---|
| `MERCHANDISE_OR_SERVICE_NOT_RECEIVED` | **VERIFIED** | `PROOF_OF_FULFILLMENT`, `PROOF_OF_DELIVERY_SIGNATURE`, `ONLINE_TRACKING_INFORMATION`, `ADDITIONAL_TRACKING_INFORMATION`, `DELIVERY_RECEIPT`, `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED`, `ORDER_DETAILS`, `PROOF_OF_REFUND`, `OTHER` | When submitting `PROOF_OF_FULFILLMENT`, `evidence_info.tracking_info` requires `carrier_name` and `tracking_number`. If `carrier_name` is `OTHER`, `carrier_name_other` is required. Notes capped at 2000 chars. | **Recommendation (NOT API mandatory)**: Signature confirmation is required by PayPal Seller Protection for physical goods >= $750 USD. Destination on tracking should match transaction shipping address. Do not claim delivery without final carrier status. |
| `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED` | **VERIFIED** | `ITEM_DESCRIPTION`, `RETURN_POLICY`, `LISTING_URL`, `ORDER_DETAILS`, `PHOTOS_OF_SHIPPED_ITEM`, `PROOF_OF_SIGNIFICANT_DIFFERENCE`, `PROOF_OF_DAMAGE`, `THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE`, `VALID_SUPPORTING_DOCUMENT`, `PROOF_OF_REFUND`, `MERCHANT_RESPONSE`, `OTHER` | Notes max 2000 chars. File attachment (`file1`) max 10 MB. | **Recommendation**: Provide catalog listing URL/screenshots showing specs promised to buyer. Document checkout return terms. Rebut subjective complaints with objective specs. |
| `UNAUTHORISED` | **VERIFIED** | `PROOF_OF_FULFILLMENT`, `DELIVERY_RECEIPT`, `PROOF_OF_DELIVERY_SIGNATURE`, `COPY_OF_LAW_ENFORCEMENT_AGENCY_REPORT`, `POLICE_REPORT`, `AFFIDAVIT`, `DECLARATION`, `PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED`, `MERCHANT_RESPONSE`, `OTHER` | Tracking fields if submitting `PROOF_OF_FULFILLMENT`. Notes max 2000 chars. | **Recommendation**: Show shipment to the seller protection eligible shipping address on the transaction record. Note: IP addresses and device fingerprints are NOT dedicated API fields; may be noted in text if relevant. |
| `CREDIT_NOT_PROCESSED` | **VERIFIED** | `PROOF_OF_REFUND`, `RETURN_POLICY`, `CANCELLATION_DETAILS`, `PROOF_OF_REFUND_OUTSIDE_PAYPAL`, `PROOF_OF_INSTORE_REFUND`, `CREDIT_DUE_REASON`, `REQUEST_CREDIT_RECEIPT`, `COPY_OF_CONTRACT`, `MERCHANT_RESPONSE`, `OTHER` | When `evidence_type` is `PROOF_OF_REFUND`, `evidence_info.refund_ids` array is expected by schema. Notes max 2000 chars. | **Recommendation**: Provide valid PayPal refund ID if already refunded. If refund is not due, supply store return policy showing goods were non-refundable or return window expired. |
| `DUPLICATE_TRANSACTION` | **VERIFIED** | `PROOF_OF_RECEIPT_COPY`, `DETAILS_OF_PURCHASE`, `MERCHANT_RESPONSE`, `PROOF_OF_FULFILLMENT`, `ORDER_DETAILS`, `TERMINAL_ATM_RECEIPT`, `PROOF_OF_REFUND`, `OTHER` | Notes max 2000 chars. `evidence_info` if fulfillment/refund. | **Recommendation**: Provide distinct order numbers, separate invoices, or independent shipment tracking to prove charges represent separate orders. |
| `INCORRECT_AMOUNT` | **VERIFIED** | `PROOF_OF_RECEIPT_COPY`, `PRICE_DIFFERENCE_REASON`, `ITEM_DESCRIPTION`, `SOURCE_CONVERSION_RATE`, `COPY_OF_CONTRACT`, `ORDER_DETAILS`, `PROOF_OF_REFUND`, `MERCHANT_RESPONSE`, `OTHER` | Notes max 2000 chars. | **Recommendation**: Submit itemized receipt showing calculation of subtotal, tax, shipping, or agreed currency conversion rate. |
| `PAYMENT_BY_OTHER_MEANS` | **VERIFIED** | `PAID_WITH_OTHER_METHOD`, `BANK_STATEMENT`, `PROOF_OF_RECEIPT_COPY`, `TERMINAL_ATM_RECEIPT`, `PROOF_OF_INSTORE_RECEIPT`, `PROOF_OF_REFUND`, `MERCHANT_RESPONSE`, `OTHER` | Notes max 2000 chars. | **Recommendation**: Provide merchant accounting ledger demonstrating whether alternative payment was settled. If double-paid, issue refund and submit refund ID. |
| `CANCELED_RECURRING_BILLING` | **VERIFIED** | `BILLING_AGREEMENT`, `CANCELLATION_DETAILS`, `RETURN_POLICY`, `COPY_OF_CONTRACT`, `MERCHANT_CONTACT_DETAILS`, `PROOF_OF_REFUND`, `MERCHANT_RESPONSE`, `OTHER` | Notes max 2000 chars. | **Recommendation**: Provide signed billing agreement and timestamp log showing billing was initiated prior to effective cancellation cutoff date. |
| `PROBLEM_WITH_REMITTANCE` | **VERIFIED** | `EXPLANATION_OF_FUNDS_NOT_DELIVERED`, `CORRECT_RECIPIENT_INFORMATION`, `BANK_STATEMENT`, `PROOF_OF_REFUND`, `MERCHANT_RESPONSE`, `OTHER` | Notes max 2000 chars. | **Recommendation**: Provide documentation clarifying funds transfer disposition and verified recipient information. |
| `PROBLEM_WITH_REPLACEMENT` | **UNVERIFIED** (Legacy Variant) | `PROOF_OF_RESHIPMENT`, `RECEIPT_OF_REPLACEMENT`, `PROOF_OF_DELIVERY_SIGNATURE`, `PROOF_OF_DAMAGE`, `MERCHANT_RESPONSE`, `OTHER` | Notes max 2000 chars. | *Note*: Unverified reason variant (the official 9th schema enum is `PROBLEM_WITH_REMITTANCE`). Supported defensively for legacy payloads. |
| `OTHER` | **VERIFIED** | `MERCHANT_RESPONSE`, `OTHER`, `DECLARATION`, `AFFIDAVIT`, `ORDER_DETAILS`, `PROOF_OF_FULFILLMENT`, `PROOF_OF_REFUND` | Notes max 2000 chars. | **Recommendation**: Provide comprehensive chronological timeline of transaction and dispute events. |
