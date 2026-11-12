/**
 * PayPal Dispute Reason-to-Evidence Guidance Mapping (AUDITED)
 * 
 * Sourced directly from official PayPal Developer OpenAPI Specifications & Guides:
 * - Official OpenAPI: openapi/customer_disputes_v1.json (paypal/paypal-rest-api-specifications)
 * - Reference: https://developer.paypal.com/api/customer-disputes/v1/
 * - Guidance: https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/
 * - Handling Disputes: https://developer.paypal.com/platforms/disputes/handle-disputes/use-disputes-api/
 */

/**
 * COMPLETE OFFICIAL `evidence_type` ENUM
 * Extracted directly from components.schemas.evidence.properties.evidence_type.enum
 * Total Count: Exactly 76 enum identifiers.
 */
export const PAYPAL_EVIDENCE_TYPES = [
  'PROOF_OF_FULFILLMENT',
  'PROOF_OF_REFUND',
  'PROOF_OF_DELIVERY_SIGNATURE',
  'PROOF_OF_RECEIPT_COPY',
  'RETURN_POLICY',
  'BILLING_AGREEMENT',
  'PROOF_OF_RESHIPMENT',
  'ITEM_DESCRIPTION',
  'POLICE_REPORT',
  'AFFIDAVIT',
  'PAID_WITH_OTHER_METHOD',
  'COPY_OF_CONTRACT',
  'TERMINAL_ATM_RECEIPT',
  'PRICE_DIFFERENCE_REASON',
  'SOURCE_CONVERSION_RATE',
  'BANK_STATEMENT',
  'CREDIT_DUE_REASON',
  'REQUEST_CREDIT_RECEIPT',
  'PROOF_OF_RETURN',
  'CREATE',
  'CHANGE_REASON',
  'PROOF_OF_REFUND_OUTSIDE_PAYPAL',
  'RECEIPT_OF_MERCHANDISE',
  'CUSTOMS_DOCUMENT',
  'CUSTOMS_FEE_RECEIPT',
  'INFORMATION_ON_RESOLUTION',
  'ADDITIONAL_INFORMATION_OF_ITEM',
  'DETAILS_OF_PURCHASE',
  'PROOF_OF_SIGNIFICANT_DIFFERENCE',
  'PROOF_OF_SOFTWARE_OR_SERVICE_NOT_AS_DESCRIBED',
  'PROOF_OF_CONFISCATION',
  'PROOF_OF_DAMAGE',
  'COPY_OF_LAW_ENFORCEMENT_AGENCY_REPORT',
  'ADDITIONAL_PROOF_OF_SHIPMENT',
  'PROOF_OF_DENIAL_BY_CARRIER',
  'THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE',
  'VALID_SUPPORTING_DOCUMENT',
  'LEGIBLE_SUPPORTING_DOCUMENT',
  'RETURN_TRACKING_INFORMATION',
  'DELIVERY_RECEIPT',
  'PROOF_OF_INSTORE_RECEIPT',
  'ADDITIONAL_TRACKING_INFORMATION',
  'PROOF_OF_SHIPMENT_POSTAGE',
  'ONLINE_TRACKING_INFORMATION',
  'PROOF_OF_INSTORE_REFUND',
  'PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED',
  'RETURN_ADDRESS_FOR_SHIPPING',
  'COPY_OF_THE_EPARCEL_MANIFEST',
  'COPY_OF_SHIPPING_MANIFEST',
  'APPEAL_AFFIDAVIT',
  'RECEIPT_OF_REPLACEMENT',
  'COPY_OF_DRIVERS_LICENSE',
  'ACCOUNT_CHANGE_INFORMATION',
  'DELIVERY_ADDRESS',
  'CONFIRMATION_OF_RESOLUTION',
  'MERCHANT_RESPONSE',
  'PERMISSION_DESCRIPTION',
  'STATUS_OF_MERCHANDISE',
  'LOST_CARD_DETAILS',
  'LAST_VALID_TRANSACTION_DETAILS',
  'ADDITIONAL_PROOF_OF_RETURN',
  'DECLARATION',
  'PROOF_OF_MISSING_ITEMS',
  'PROOF_OF_EMPTY_PACKAGE_OR_DIFFERENT_ITEM',
  'PROOF_OF_ITEM_NOT_RECEIVED',
  'ORDER_DETAILS',
  'LISTING_URL',
  'SHIPPING_INSURANCE',
  'BUYER_RESPONSE',
  'PHOTOS_OF_SHIPPED_ITEM',
  'OTHER',
  'CANCELLATION_DETAILS',
  'MERCHANT_CONTACT_DETAILS',
  'ITEM_DETAILS',
  'CORRECT_RECIPIENT_INFORMATION',
  'EXPLANATION_OF_FUNDS_NOT_DELIVERED',
] as const;

export type PayPalEvidenceType = typeof PAYPAL_EVIDENCE_TYPES[number];

/**
 * Audit: Unsupported strings removed from the enum.
 * These are ordinary supporting document descriptions or general advice,
 * NOT valid PayPal evidence_type API enum values:
 * 1. IP_ADDRESS_LOGS (ordinary log description; submitted under PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED or OTHER)
 * 2. SERVER_ACCESS_LOGS (ordinary log description; submitted under PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED or OTHER)
 * 3. CUSTOMER_COMMUNICATION (ordinary description; official enums are MERCHANT_RESPONSE or BUYER_RESPONSE)
 * 4. TERMS_AND_CONDITIONS (ordinary description; official enums are RETURN_POLICY or COPY_OF_CONTRACT)
 * 5. LEGALLY_BINDING_STATEMENT (ordinary description; official enums are AFFIDAVIT or DECLARATION)
 * 6. PROOF_OF_SERVICE_DELIVERY (non-standard naming; official enum is PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED)
 * 7. PROOF_OF_SOFTWARE_LICENSE (non-standard naming; official enum is PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED or ORDER_DETAILS)
 * 8. PROOF_OF_DIGITAL_DOWNLOAD (non-standard naming; official enum is ORDER_DETAILS or PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED)
 * 9. CANCELLATION_POLICY (ordinary description; official enums are RETURN_POLICY or CANCELLATION_DETAILS)
 * 10. PROOF_OF_AUTHENTICITY (ordinary description; official enum is THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE or VALID_SUPPORTING_DOCUMENT)
 * 11. APPRAISAL_DOCUMENT (ordinary description; official enum is THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE)
 * 12. REBUTTAL_EXPLANATION (ordinary description; official enum is MERCHANT_RESPONSE or OTHER)
 */
export const REMOVED_UNSUPPORTED_IDENTIFIERS = [
  'IP_ADDRESS_LOGS',
  'SERVER_ACCESS_LOGS',
  'CUSTOMER_COMMUNICATION',
  'TERMS_AND_CONDITIONS',
  'LEGALLY_BINDING_STATEMENT',
  'PROOF_OF_SERVICE_DELIVERY',
  'PROOF_OF_SOFTWARE_LICENSE',
  'PROOF_OF_DIGITAL_DOWNLOAD',
  'CANCELLATION_POLICY',
  'PROOF_OF_AUTHENTICITY',
  'APPRAISAL_DOCUMENT',
  'REBUTTAL_EXPLANATION',
] as const;

/**
 * Official Dispute Reasons from components.schemas.dispute_reason.enum
 * Plus legacy/unverified variants supported defensively.
 */
export const PAYPAL_DISPUTE_REASONS = [
  'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
  'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
  'UNAUTHORISED',
  'CREDIT_NOT_PROCESSED',
  'DUPLICATE_TRANSACTION',
  'INCORRECT_AMOUNT',
  'PAYMENT_BY_OTHER_MEANS',
  'CANCELED_RECURRING_BILLING',
  'PROBLEM_WITH_REMITTANCE', // Official 9th enum in OpenAPI schema
  'PROBLEM_WITH_REPLACEMENT', // Maintained as UNVERIFIED legacy variant
  'OTHER',
] as const;

export type PayPalDisputeReason = typeof PAYPAL_DISPUTE_REASONS[number];

export interface MandatoryApiField {
  field: string;
  description: string;
  condition?: string;
}

export interface DefenseRecommendation {
  recommendation: string;
  suggestedEvidenceType: PayPalEvidenceType;
  policyContext: string;
}

export interface DefenseChecklistItem {
  item: string;
  isApiMandatory: boolean;
  rationale: string;
}

export interface ReasonEvidenceRule {
  reason: PayPalDisputeReason;
  friendlyTitle: string;
  docUrl: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  summary: string;
  primaryEvidenceTypes: PayPalEvidenceType[];
  alternativeEvidenceTypes: PayPalEvidenceType[];
  mandatoryApiFields: MandatoryApiField[];
  recommendedEvidence: DefenseRecommendation[];
  defenseChecklist: DefenseChecklistItem[];
  notesCharacterLimit: number;
}

export const EVIDENCE_MAP: Record<PayPalDisputeReason, ReasonEvidenceRule> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: {
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    friendlyTitle: 'Item or Service Not Received (INR)',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#merchandise-or-service-not-received',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer claims they paid for an item or service but never received it.',
    primaryEvidenceTypes: [
      'PROOF_OF_FULFILLMENT',
      'PROOF_OF_DELIVERY_SIGNATURE',
      'ONLINE_TRACKING_INFORMATION',
    ],
    alternativeEvidenceTypes: [
      'ADDITIONAL_TRACKING_INFORMATION',
      'PROOF_OF_SHIPMENT_POSTAGE',
      'DELIVERY_RECEIPT',
      'PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED',
      'ORDER_DETAILS',
      'PROOF_OF_REFUND',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'evidence_info.tracking_info.carrier_name',
        description: 'Carrier name enum or valid string.',
        condition: "Required if evidence_type is PROOF_OF_FULFILLMENT and tracking_info is provided.",
      },
      {
        field: 'evidence_info.tracking_info.tracking_number',
        description: 'Valid shipment tracking number.',
        condition: "Required if evidence_type is PROOF_OF_FULFILLMENT and tracking_info is provided.",
      },
      {
        field: 'evidence_info.tracking_info.carrier_name_other',
        description: 'Free-form carrier name.',
        condition: "Mandatory when carrier_name is 'OTHER'.",
      },
      {
        field: 'notes',
        description: 'Evidence notes strictly capped at 2000 characters.',
        condition: 'Optional, but max 2000 characters if supplied.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Attach signed proof of delivery confirmation for high-value orders.',
        suggestedEvidenceType: 'PROOF_OF_DELIVERY_SIGNATURE',
        policyContext: 'PayPal Seller Protection policy requires signature confirmation for physical orders >= $750 USD (or local currency equivalent). Note: Signature is a policy recommendation, not an API schema mandatory field.',
      },
      {
        recommendation: 'Provide digital delivery access logs or confirmation for intangible goods.',
        suggestedEvidenceType: 'PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED',
        policyContext: 'Demonstrates digital fulfillment with timestamps and buyer association.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Carrier tracking number provided in evidence_info.tracking_info',
        isApiMandatory: true,
        rationale: 'Mandatory in schema when submitting PROOF_OF_FULFILLMENT tracking info.',
      },
      {
        item: 'Tracking confirms delivery to buyer shipping destination address on transaction',
        isApiMandatory: false,
        rationale: 'Required by PayPal Seller Protection rules to win an INR dispute.',
      },
      {
        item: 'Signature proof attached for transactions >= $750 USD',
        isApiMandatory: false,
        rationale: 'Seller Protection policy threshold requirement, not an API validation rule.',
      },
      {
        item: 'Do not claim completed delivery if tracking shows in-transit or label created',
        isApiMandatory: false,
        rationale: 'Unsupported claims of delivery without carrier confirmation will lead to dispute loss.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: {
    reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
    friendlyTitle: 'Significantly Not As Described (SNAD)',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#merchandise-or-service-not-as-described',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer received merchandise or service but claims it significantly differs from description, arrived damaged, or is missing parts.',
    primaryEvidenceTypes: [
      'ITEM_DESCRIPTION',
      'RETURN_POLICY',
      'LISTING_URL',
    ],
    alternativeEvidenceTypes: [
      'ORDER_DETAILS',
      'PHOTOS_OF_SHIPPED_ITEM',
      'PROOF_OF_SIGNIFICANT_DIFFERENCE',
      'PROOF_OF_DAMAGE',
      'THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE',
      'VALID_SUPPORTING_DOCUMENT',
      'PROOF_OF_SOFTWARE_OR_SERVICE_NOT_AS_DESCRIBED',
      'PROOF_OF_REFUND',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Rebuttal narrative clarifying how product matched published specifications.',
        condition: 'Must not exceed 2000 characters.',
      },
      {
        field: 'file1',
        description: 'Document attachment (.pdf, .png, .jpg, .gif) up to 10 MB.',
        condition: 'Optional, but must conform to format/size limits if provided.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Submit original product catalog listing, checkout screenshots, and specs.',
        suggestedEvidenceType: 'ITEM_DESCRIPTION',
        policyContext: 'Proves the item received matched the listing details agreed upon at purchase.',
      },
      {
        recommendation: 'Attach terms of sale and store return/replacement policy.',
        suggestedEvidenceType: 'RETURN_POLICY',
        policyContext: 'Demonstrates terms accepted by customer at checkout.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Original catalog listing or item description provided',
        isApiMandatory: false,
        rationale: 'Primary defense evidence to refute SNAD claim.',
      },
      {
        item: 'Published return policy provided',
        isApiMandatory: false,
        rationale: 'Demonstrates agreed return procedures and requirements.',
      },
      {
        item: 'Identify contradictions between customer complaint and catalog specs',
        isApiMandatory: false,
        rationale: 'Directly undermines subjective or contradictory buyer claims.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  UNAUTHORISED: {
    reason: 'UNAUTHORISED',
    friendlyTitle: 'Unauthorized Transaction / Fraud',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#unauthorized-transaction',
    verificationStatus: 'VERIFIED',
    summary: 'Account holder claims they did not initiate or authorize the payment.',
    primaryEvidenceTypes: [
      'PROOF_OF_FULFILLMENT',
      'DELIVERY_RECEIPT',
      'PROOF_OF_DELIVERY_SIGNATURE',
    ],
    alternativeEvidenceTypes: [
      'COPY_OF_LAW_ENFORCEMENT_AGENCY_REPORT',
      'POLICE_REPORT',
      'AFFIDAVIT',
      'DECLARATION',
      'PROOF_FOR_SOFTWARE_OR_SERVICE_DELIVERED',
      'ORDER_DETAILS',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'evidence_info.tracking_info',
        description: 'Tracking details if submitting PROOF_OF_FULFILLMENT.',
        condition: 'Expected when evidence_type is PROOF_OF_FULFILLMENT.',
      },
      {
        field: 'notes',
        description: 'Defense explanation.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide proof item shipped to the verified address on the transaction details page.',
        suggestedEvidenceType: 'PROOF_OF_FULFILLMENT',
        policyContext: 'PayPal Seller Protection covers unauthorized transactions if physical goods are shipped with valid tracking to the transaction shipping address.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Shipment delivered to the seller protection eligible address on the transaction',
        isApiMandatory: false,
        rationale: 'Critical criterion for PayPal Seller Protection coverage against unauthorized claims.',
      },
      {
        item: 'Online carrier tracking records attached',
        isApiMandatory: false,
        rationale: 'Validates physical transit and delivery point.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  CREDIT_NOT_PROCESSED: {
    reason: 'CREDIT_NOT_PROCESSED',
    friendlyTitle: 'Credit or Refund Not Processed',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#credit-not-processed',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer claims they returned merchandise or canceled a transaction but did not receive refund or credit.',
    primaryEvidenceTypes: [
      'PROOF_OF_REFUND',
      'RETURN_POLICY',
      'CANCELLATION_DETAILS',
    ],
    alternativeEvidenceTypes: [
      'PROOF_OF_REFUND_OUTSIDE_PAYPAL',
      'PROOF_OF_INSTORE_REFUND',
      'CREDIT_DUE_REASON',
      'REQUEST_CREDIT_RECEIPT',
      'COPY_OF_CONTRACT',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'evidence_info.refund_ids',
        description: 'Array of PayPal refund transaction IDs.',
        condition: 'Expected in schema when evidence_type is PROOF_OF_REFUND.',
      },
      {
        field: 'notes',
        description: 'Explanation if refund is not due.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'If refund was executed, provide the settled PayPal refund transaction ID.',
        suggestedEvidenceType: 'PROOF_OF_REFUND',
        policyContext: 'Conclusively proves refund was already credited via PayPal ledger.',
      },
      {
        recommendation: 'If refund is not due, provide return policy showing item was non-returnable or outside window.',
        suggestedEvidenceType: 'RETURN_POLICY',
        policyContext: 'Demonstrates buyer is not entitled to credit per agreed checkout terms.',
      },
    ],
    defenseChecklist: [
      {
        item: 'PayPal refund ID supplied in evidence_info.refund_ids (if refunded)',
        isApiMandatory: false,
        rationale: 'API schema expects refund_ids for PROOF_OF_REFUND.',
      },
      {
        item: 'Return policy documentation attached (if refund refused)',
        isApiMandatory: false,
        rationale: 'Proves merchant adhered to agreed cancellation and return guidelines.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  DUPLICATE_TRANSACTION: {
    reason: 'DUPLICATE_TRANSACTION',
    friendlyTitle: 'Duplicate Billing / Multiple Charges',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#duplicate-transaction',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer claims they were billed multiple times for a single order.',
    primaryEvidenceTypes: [
      'PROOF_OF_RECEIPT_COPY',
      'DETAILS_OF_PURCHASE',
      'MERCHANT_RESPONSE',
    ],
    alternativeEvidenceTypes: [
      'PROOF_OF_FULFILLMENT',
      'ORDER_DETAILS',
      'TERMINAL_ATM_RECEIPT',
      'PROOF_OF_REFUND',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Clarification of distinct transactions or orders.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide distinct invoices or checkout receipts showing independent orders.',
        suggestedEvidenceType: 'PROOF_OF_RECEIPT_COPY',
        policyContext: 'Proves multiple charges correspond to distinct orders fulfilled separately.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Separate order identifiers or invoices documented',
        isApiMandatory: false,
        rationale: 'Shows transactions represent separate purchases.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  INCORRECT_AMOUNT: {
    reason: 'INCORRECT_AMOUNT',
    friendlyTitle: 'Incorrect Amount Billed',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#incorrect-amount',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer claims the billed amount differs from the agreed checkout price.',
    primaryEvidenceTypes: [
      'PROOF_OF_RECEIPT_COPY',
      'PRICE_DIFFERENCE_REASON',
      'ITEM_DESCRIPTION',
    ],
    alternativeEvidenceTypes: [
      'SOURCE_CONVERSION_RATE',
      'COPY_OF_CONTRACT',
      'ORDER_DETAILS',
      'PROOF_OF_REFUND',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Explanation of pricing calculation and adjustments.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide checkout receipt showing itemized charges, shipping, and taxes.',
        suggestedEvidenceType: 'PROOF_OF_RECEIPT_COPY',
        policyContext: 'Demonstrates total charged corresponds to customer-approved checkout amount.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Itemized checkout invoice matching billed total',
        isApiMandatory: false,
        rationale: 'Refutes unauthorized price increase claims.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  PAYMENT_BY_OTHER_MEANS: {
    reason: 'PAYMENT_BY_OTHER_MEANS',
    friendlyTitle: 'Paid by Other Means',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#payment-by-other-means',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer claims they paid for this item using an alternative payment method (cash, card, check).',
    primaryEvidenceTypes: [
      'PAID_WITH_OTHER_METHOD',
      'BANK_STATEMENT',
      'PROOF_OF_RECEIPT_COPY',
    ],
    alternativeEvidenceTypes: [
      'TERMINAL_ATM_RECEIPT',
      'PROOF_OF_INSTORE_RECEIPT',
      'PROOF_OF_REFUND',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Accounting reconciliation notes.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide merchant ledger demonstrating PayPal payment is the only settled payment for the order.',
        suggestedEvidenceType: 'PROOF_OF_RECEIPT_COPY',
        policyContext: 'Clarifies that no duplicate payment was received through other channels.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Accounting ledger showing order payment status',
        isApiMandatory: false,
        rationale: 'Proves whether double payment occurred or not.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  CANCELED_RECURRING_BILLING: {
    reason: 'CANCELED_RECURRING_BILLING',
    friendlyTitle: 'Canceled Recurring Subscription / Billing',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/#canceled-recurring-billing',
    verificationStatus: 'VERIFIED',
    summary: 'Buyer claims they were billed for a recurring subscription after cancellation.',
    primaryEvidenceTypes: [
      'BILLING_AGREEMENT',
      'CANCELLATION_DETAILS',
      'RETURN_POLICY',
    ],
    alternativeEvidenceTypes: [
      'COPY_OF_CONTRACT',
      'MERCHANT_CONTACT_DETAILS',
      'PROOF_OF_REFUND',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Subscription terms and cancellation chronology.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide signed billing agreement terms and timestamp log of cancellation request.',
        suggestedEvidenceType: 'BILLING_AGREEMENT',
        policyContext: 'Proves billing occurred in accordance with agreement terms prior to effective cancellation cutoff.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Subscription agreement terms accepted at signup',
        isApiMandatory: false,
        rationale: 'Establishes cancellation notice periods and terms.',
      },
      {
        item: 'Timestamp log of cancellation request vs billing date',
        isApiMandatory: false,
        rationale: 'Demonstrates charge was processed before cancellation became effective.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  PROBLEM_WITH_REMITTANCE: {
    reason: 'PROBLEM_WITH_REMITTANCE',
    friendlyTitle: 'Problem with Remittance',
    docUrl: 'https://developer.paypal.com/api/customer-disputes/v1/#definition-dispute_reason',
    verificationStatus: 'VERIFIED',
    summary: 'A problem occurred with the remittance or funds transfer.',
    primaryEvidenceTypes: [
      'EXPLANATION_OF_FUNDS_NOT_DELIVERED',
      'CORRECT_RECIPIENT_INFORMATION',
      'BANK_STATEMENT',
    ],
    alternativeEvidenceTypes: [
      'PROOF_OF_REFUND',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Explanation regarding funds delivery and recipient details.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide documentation showing recipient information and transfer records.',
        suggestedEvidenceType: 'CORRECT_RECIPIENT_INFORMATION',
        policyContext: 'Validates delivery of transferred funds to intended recipient.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Funds transfer record and recipient verification',
        isApiMandatory: false,
        rationale: 'Demonstrates correct disposition of remittance funds.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  PROBLEM_WITH_REPLACEMENT: {
    reason: 'PROBLEM_WITH_REPLACEMENT',
    friendlyTitle: 'Problem with Replacement (Legacy Variant)',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/',
    verificationStatus: 'UNVERIFIED',
    summary: 'Customer reports issue with a replacement item. (Note: Not an official dispute_reason enum in OpenAPI schema; mapped defensively).',
    primaryEvidenceTypes: [
      'PROOF_OF_RESHIPMENT',
      'RECEIPT_OF_REPLACEMENT',
    ],
    alternativeEvidenceTypes: [
      'PROOF_OF_DELIVERY_SIGNATURE',
      'PROOF_OF_DAMAGE',
      'MERCHANT_RESPONSE',
      'OTHER',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Details of replacement agreement and tracking.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide carrier tracking and label for replacement shipment.',
        suggestedEvidenceType: 'PROOF_OF_RESHIPMENT',
        policyContext: 'Shows replacement merchandise was dispatched.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Replacement shipment tracking details provided',
        isApiMandatory: false,
        rationale: 'Confirms reshipment of replacement item.',
      },
    ],
    notesCharacterLimit: 2000,
  },

  OTHER: {
    reason: 'OTHER',
    friendlyTitle: 'Other / General Dispute',
    docUrl: 'https://developer.paypal.com/docs/platforms/disputes/reference/dispute-reasons-and-evidence/',
    verificationStatus: 'VERIFIED',
    summary: 'Dispute reason not covered by standard categories.',
    primaryEvidenceTypes: [
      'MERCHANT_RESPONSE',
      'OTHER',
      'DECLARATION',
    ],
    alternativeEvidenceTypes: [
      'AFFIDAVIT',
      'ORDER_DETAILS',
      'PROOF_OF_FULFILLMENT',
      'PROOF_OF_REFUND',
    ],
    mandatoryApiFields: [
      {
        field: 'notes',
        description: 'Comprehensive factual chronological narrative.',
        condition: 'Must not exceed 2000 characters.',
      },
    ],
    recommendedEvidence: [
      {
        recommendation: 'Provide chronological narrative and supporting documents.',
        suggestedEvidenceType: 'MERCHANT_RESPONSE',
        policyContext: 'Gives the reviewer a coherent timeline of the transaction.',
      },
    ],
    defenseChecklist: [
      {
        item: 'Chronological timeline of transaction and dispute',
        isApiMandatory: false,
        rationale: 'Standard best practice for general claims.',
      },
    ],
    notesCharacterLimit: 2000,
  },
};

/**
 * Returns evidence rule configuration for any PayPal dispute reason
 */
export function getEvidenceRule(
  reason: string
): ReasonEvidenceRule | null {
  if (Object.prototype.hasOwnProperty.call(EVIDENCE_MAP, reason)) {
    return EVIDENCE_MAP[reason as PayPalDisputeReason];
  }

  return null;
}