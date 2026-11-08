/**
 * PayPal Dispute Reason-to-Evidence Guidance Mapping
 * 
 * Anchored to official PayPal Developer Documentation:
 * - https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api/
 * - https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/
 * - https://developer.paypal.com/api/customer-disputes/v1/
 */

export const PAYPAL_EVIDENCE_TYPES = [
  'PROOF_OF_FULFILLMENT',
  'PROOF_OF_REFUND',
  'PROOF_OF_DELIVERY_SIGNATURE',
  'PROOF_OF_RECEIPT_COPY',
  'RETURN_POLICY',
  'ITEM_DESCRIPTION',
  'COPY_OF_CONTRACT',
  'PROOF_OF_RESHIPMENT',
  'PROOF_OF_DAMAGE',
  'THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE',
  'DECLARATION',
  'PROOF_OF_MISSING_ITEMS',
  'PROOF_OF_EMPTY_PACKAGE_OR_DIFFERENT_ITEM',
  'PROOF_OF_ITEM_NOT_RECEIVED',
  'BILLING_AGREEMENT',
  'ADDITIONAL_TRACKING_INFORMATION',
  'CUSTOMS_DOCUMENT',
  'POLICE_REPORT',
  'LEGALLY_BINDING_STATEMENT',
  'MERCHANT_RESPONSE',
  'CUSTOMER_COMMUNICATION',
  'TERMS_AND_CONDITIONS',
  'PROOF_OF_SERVICE_DELIVERY',
  'SERVER_ACCESS_LOGS',
  'IP_ADDRESS_LOGS',
  'PROOF_OF_SOFTWARE_LICENSE',
  'PROOF_OF_DIGITAL_DOWNLOAD',
  'CANCELLATION_POLICY',
  'PROOF_OF_AUTHENTICITY',
  'APPRAISAL_DOCUMENT',
  'REBUTTAL_EXPLANATION',
  'OTHER',
] as const;

export type PayPalEvidenceType = typeof PAYPAL_EVIDENCE_TYPES[number];

export const PAYPAL_DISPUTE_REASONS = [
  'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
  'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
  'UNAUTHORISED',
  'CREDIT_NOT_PROCESSED',
  'DUPLICATE_TRANSACTION',
  'INCORRECT_AMOUNT',
  'PAYMENT_BY_OTHER_MEANS',
  'CANCELED_RECURRING_BILLING',
  'PROBLEM_WITH_REPLACEMENT',
  'OTHER',
] as const;

export type PayPalDisputeReason = typeof PAYPAL_DISPUTE_REASONS[number];

export interface ReasonEvidenceRule {
  reason: PayPalDisputeReason;
  friendlyTitle: string;
  docUrl: string;
  summary: string;
  primaryEvidenceTypes: PayPalEvidenceType[];
  alternativeEvidenceTypes: PayPalEvidenceType[];
  requiredFields: {
    field: string;
    description: string;
    mandatory: boolean;
  }[];
  criticalChecklist: string[];
  disputeDefenseGuidelines: string[];
  notesCharacterLimit: number;
}

export const EVIDENCE_MAP: Record<PayPalDisputeReason, ReasonEvidenceRule> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: {
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    friendlyTitle: 'Item or Service Not Received (INR)',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#merchandise-or-service-not-received',
    summary: 'Buyer claims they paid for an item or service but never received it.',
    primaryEvidenceTypes: ['PROOF_OF_FULFILLMENT', 'PROOF_OF_DELIVERY_SIGNATURE'],
    alternativeEvidenceTypes: ['ADDITIONAL_TRACKING_INFORMATION', 'PROOF_OF_SERVICE_DELIVERY', 'SERVER_ACCESS_LOGS', 'PROOF_OF_DIGITAL_DOWNLOAD', 'PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'tracking_info.carrier_name', description: 'Carrier name (e.g. FEDEX, UPS, USPS, DHL)', mandatory: true },
      { field: 'tracking_info.tracking_number', description: 'Valid carrier tracking tracking number', mandatory: true },
      { field: 'delivery_address_match', description: 'Proof that destination matches the transaction address', mandatory: true },
    ],
    criticalChecklist: [
      'Carrier tracking number is provided and active in carrier system',
      'Delivery address on tracking matches the transaction shipping address',
      'For high-value items, signature confirmation is attached',
      'For digital items: Server access/download logs with buyer IP and timestamp are included',
      'DO NOT claim item was delivered if tracking only indicates label created or in-transit without final delivery event',
    ],
    disputeDefenseGuidelines: [
      'If shipping physically: Provide carrier name and tracking number in evidence_info.tracking_info.',
      'If item is intangible/digital: Provide proof of service delivery or server access logs.',
      'If already refunded: Provide refund ID under PROOF_OF_REFUND.',
    ],
    notesCharacterLimit: 2000,
  },

  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: {
    reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
    friendlyTitle: 'Significantly Not As Described (SNAD)',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#merchandise-or-service-not-as-described',
    summary: 'Buyer received the item but claims it is materially different from the listing or broken/counterfeit.',
    primaryEvidenceTypes: ['ITEM_DESCRIPTION', 'RETURN_POLICY'],
    alternativeEvidenceTypes: ['CUSTOMER_COMMUNICATION', 'PROOF_OF_AUTHENTICITY', 'APPRAISAL_DOCUMENT', 'PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'item_description_proof', description: 'Original item listing, specifications, and condition photos', mandatory: true },
      { field: 'return_policy_proof', description: 'Merchant return/cancellation policy accepted at checkout', mandatory: true },
      { field: 'notes', description: 'Point-by-point rebuttal clarifying how product matched specifications', mandatory: true },
    ],
    criticalChecklist: [
      'Catalog or checkout listing showing exact specifications promised to buyer',
      'Clear documentation of item condition prior to dispatch',
      'Return policy displayed at checkout clearly identified',
      'Customer support communications showing buyer statements or usage',
      'DO NOT contradict the buyer complaint with generic claims without referencing original listing details',
    ],
    disputeDefenseGuidelines: [
      'Show that the item delivered matched the specifications and description provided prior to sale.',
      'Attach copy of return policy or terms of service.',
      'If buyer altered or damaged item after receipt, document third-party proof or correspondence.',
    ],
    notesCharacterLimit: 2000,
  },

  UNAUTHORISED: {
    reason: 'UNAUTHORISED',
    friendlyTitle: 'Unauthorized Transaction / Fraud',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#unauthorized-transaction',
    summary: 'Buyer or account holder claims they did not initiate or approve the transaction.',
    primaryEvidenceTypes: ['PROOF_OF_FULFILLMENT', 'IP_ADDRESS_LOGS'],
    alternativeEvidenceTypes: ['SERVER_ACCESS_LOGS', 'CUSTOMER_COMMUNICATION', 'COPY_OF_CONTRACT', 'POLICE_REPORT', 'OTHER'],
    requiredFields: [
      { field: 'shipping_address_verification', description: 'Proof shipped to address provided in PayPal seller protection details', mandatory: true },
      { field: 'ip_or_session_logs', description: 'Login or checkout IP address matching buyer location', mandatory: false },
    ],
    criticalChecklist: [
      'Item shipped to the verified address on the PayPal transaction details page',
      'Carrier tracking showing delivery to that specific postal code',
      'Authentication logs or prior purchase history from the same customer account',
      'Customer communication acknowledging purchase before chargeback was filed',
    ],
    disputeDefenseGuidelines: [
      'PayPal Seller Protection protects unauthorized claims if shipped to the address on the Transaction Details page with online tracking.',
      'Provide IP access logs, device fingerprint, or buyer correspondence confirming authorization.',
    ],
    notesCharacterLimit: 2000,
  },

  CREDIT_NOT_PROCESSED: {
    reason: 'CREDIT_NOT_PROCESSED',
    friendlyTitle: 'Credit or Refund Not Processed',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#credit-not-processed',
    summary: 'Buyer claims they returned merchandise or canceled order/service but refund was not credited.',
    primaryEvidenceTypes: ['PROOF_OF_REFUND', 'RETURN_POLICY'],
    alternativeEvidenceTypes: ['TERMS_AND_CONDITIONS', 'CUSTOMER_COMMUNICATION', 'REBUTTAL_EXPLANATION', 'OTHER'],
    requiredFields: [
      { field: 'refund_ids', description: 'PayPal refund transaction ID if refund was already executed', mandatory: false },
      { field: 'policy_or_return_status', description: 'Proof item was not returned or return window lapsed', mandatory: true },
    ],
    criticalChecklist: [
      'If refund was issued: specify exact PayPal refund transaction ID in evidence_info.refund_ids',
      'If refund is NOT due: provide store return policy showing non-refundable terms or return window expiry',
      'Carrier return tracking check: verify if merchant actually received returned package in original condition',
    ],
    disputeDefenseGuidelines: [
      'If refund was processed, supply PROOF_OF_REFUND with refund_ids.',
      'If buyer never returned goods or returned empty box, supply return inspection records and terms.',
    ],
    notesCharacterLimit: 2000,
  },

  DUPLICATE_TRANSACTION: {
    reason: 'DUPLICATE_TRANSACTION',
    friendlyTitle: 'Duplicate Billing / Multiple Charges',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#duplicate-transaction',
    summary: 'Buyer claims they were billed multiple times for a single order.',
    primaryEvidenceTypes: ['REBUTTAL_EXPLANATION', 'PROOF_OF_RECEIPT_COPY'],
    alternativeEvidenceTypes: ['PROOF_OF_FULFILLMENT', 'PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'order_identifiers', description: 'Distinct invoice or order IDs for each charge', mandatory: true },
      { field: 'fulfillment_records', description: 'Proof of distinct fulfillment for each transaction', mandatory: true },
    ],
    criticalChecklist: [
      'Check whether merchant received two payments for one order or two separate orders',
      'If two separate orders: show distinct order IDs, separate shipment tracking numbers, and buyer confirmations',
      'If accidental duplicate: issue refund immediately and submit PROOF_OF_REFUND with refund ID',
    ],
    disputeDefenseGuidelines: [
      'Prove that each charge corresponds to an independent order or item fulfilled separately.',
      'Show distinct invoices with itemized totals and delivery tracking.',
    ],
    notesCharacterLimit: 2000,
  },

  INCORRECT_AMOUNT: {
    reason: 'INCORRECT_AMOUNT',
    friendlyTitle: 'Incorrect Amount Billed',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#incorrect-amount',
    summary: 'Buyer claims the charged amount differs from the agreed price or invoice.',
    primaryEvidenceTypes: ['PROOF_OF_RECEIPT_COPY', 'ITEM_DESCRIPTION'],
    alternativeEvidenceTypes: ['COPY_OF_CONTRACT', 'PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'receipt_breakdown', description: 'Itemized checkout invoice showing subtotal, shipping, and taxes', mandatory: true },
      { field: 'pricing_agreement', description: 'Promotional terms or pricing schedule agreed by customer', mandatory: true },
    ],
    criticalChecklist: [
      'Checkout receipt breakdown matching transaction total exactly',
      'Proof customer accepted shipping fees, taxes, or currency conversion rules at checkout',
      'If overcharged in error: issue partial refund and provide refund ID',
    ],
    disputeDefenseGuidelines: [
      'Provide itemized receipt or contract showing how final charged amount was calculated.',
    ],
    notesCharacterLimit: 2000,
  },

  PAYMENT_BY_OTHER_MEANS: {
    reason: 'PAYMENT_BY_OTHER_MEANS',
    friendlyTitle: 'Paid by Other Means',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#payment-by-other-means',
    summary: 'Buyer claims they paid for this item using a different payment method (cash, card, check).',
    primaryEvidenceTypes: ['PROOF_OF_RECEIPT_COPY', 'REBUTTAL_EXPLANATION'],
    alternativeEvidenceTypes: ['PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'ledger_proof', description: 'Merchant accounting ledger showing PayPal was the sole payment settled', mandatory: true },
    ],
    criticalChecklist: [
      'Check accounting records to verify whether customer paid twice',
      'If alternative payment was received: refund the PayPal payment and provide refund ID',
      'If no alternative payment was received: provide invoice showing PayPal is the only recorded payment',
    ],
    disputeDefenseGuidelines: [
      'Show merchant invoice and ledger indicating PayPal transaction settled the order.',
    ],
    notesCharacterLimit: 2000,
  },

  CANCELED_RECURRING_BILLING: {
    reason: 'CANCELED_RECURRING_BILLING',
    friendlyTitle: 'Canceled Recurring Subscription / Billing',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#canceled-recurring-billing',
    summary: 'Buyer claims they were billed for a subscription or recurring plan after cancellation.',
    primaryEvidenceTypes: ['BILLING_AGREEMENT', 'CANCELLATION_POLICY'],
    alternativeEvidenceTypes: ['CUSTOMER_COMMUNICATION', 'COPY_OF_CONTRACT', 'PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'billing_agreement_terms', description: 'Terms of recurring billing and notice period for cancellation', mandatory: true },
      { field: 'cancellation_timestamp_log', description: 'Timestamp when cancellation request was submitted vs when billing occurred', mandatory: true },
    ],
    criticalChecklist: [
      'Subscription terms accepted at signup specifying cancellation notice period',
      'System log of cancellation request showing charge was initiated prior to effective cancellation date',
      'Usage records showing customer used service during the billed period',
    ],
    disputeDefenseGuidelines: [
      'Submit the signed billing agreement or electronic signup terms.',
      'Document cancellation policy cutoff rules and timestamp logs.',
    ],
    notesCharacterLimit: 2000,
  },

  PROBLEM_WITH_REPLACEMENT: {
    reason: 'PROBLEM_WITH_REPLACEMENT',
    friendlyTitle: 'Problem with Replacement Item',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#problem-with-replacement',
    summary: 'Buyer received a replacement item that was also damaged, defective, or not received.',
    primaryEvidenceTypes: ['PROOF_OF_RESHIPMENT', 'PROOF_OF_DELIVERY_SIGNATURE'],
    alternativeEvidenceTypes: ['CUSTOMER_COMMUNICATION', 'PROOF_OF_DAMAGE', 'OTHER'],
    requiredFields: [
      { field: 'replacement_tracking', description: 'Carrier name and tracking number for the replacement shipment', mandatory: true },
    ],
    criticalChecklist: [
      'Tracking number specifically for replacement package',
      'Customer support messages agreeing to replacement terms',
      'Carrier delivery confirmation for replacement',
    ],
    disputeDefenseGuidelines: [
      'Provide proof of reshipment with active carrier tracking and proof of delivery.',
    ],
    notesCharacterLimit: 2000,
  },

  OTHER: {
    reason: 'OTHER',
    friendlyTitle: 'Other / General Dispute',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/',
    summary: 'Dispute reason not covered by standard categories.',
    primaryEvidenceTypes: ['MERCHANT_RESPONSE', 'CUSTOMER_COMMUNICATION'],
    alternativeEvidenceTypes: ['PROOF_OF_FULFILLMENT', 'PROOF_OF_REFUND', 'OTHER'],
    requiredFields: [
      { field: 'notes', description: 'Comprehensive factual chronological narrative under 2000 characters', mandatory: true },
    ],
    criticalChecklist: [
      'Clear timeline of events from order to dispute',
      'Relevant supporting documentation attached (max 10MB file1)',
      'Direct rebuttal addressing specific claims made in dispute history',
    ],
    disputeDefenseGuidelines: [
      'Provide structured merchant response with supporting evidence files.',
    ],
    notesCharacterLimit: 2000,
  },
};

/**
 * Returns evidence rule configuration for any PayPal dispute reason
 */
export function getEvidenceRule(reason: string): ReasonEvidenceRule {
  if (reason in EVIDENCE_MAP) {
    return EVIDENCE_MAP[reason as PayPalDisputeReason];
  }
  return EVIDENCE_MAP.OTHER;
}
