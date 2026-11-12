/**
 * Strongly-typed definitions for PayPal Customer Disputes API (v1)
 * https://developer.paypal.com/api/customer-disputes/v1/
 */

/**
 * PayPal Customer Disputes API v1 types.
 * Reference: https://developer.paypal.com/api/customer-disputes/v1/
 */

export type DisputeStatus =
  | 'OPEN'
  | 'WAITING_FOR_BUYER_RESPONSE'
  | 'WAITING_FOR_SELLER_RESPONSE'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'OTHER';

export type DisputeLifeCycleStage =
  | 'INQUIRY'
  | 'CHARGEBACK'
  | 'PRE_ARBITRATION'
  | 'ARBITRATION';

export type DisputeChannel = 'INTERNAL' | 'EXTERNAL' | 'ALERT';

export interface HateoasLink {
  href: string;
  rel: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  enctype?: string;
}

export interface Money {
  currency_code: string;
  value: string;
}

export interface DisputedTransaction {
  buyer_transaction_id?: string;
  seller_transaction_id?: string;
  create_time?: string;
  transaction_status?: string;
  gross_amount?: Money;
  buyer?: {
    name?: string;
    email?: string;
  };
  seller?: {
    email?: string;
    merchant_id?: string;
    name?: string;
  };
  items?: Array<{
    item_name?: string;
    item_description?: string;
    item_quantity?: string;
    item_price?: Money;
  }>;
}

export interface DisputeTrackingInfo {
  carrier_name: string;
  tracking_number: string;
  tracking_url?: string;
}

export interface DisputeEvidenceInfo {
  tracking_info?: DisputeTrackingInfo[];
  refund_ids?: string[];
}

export interface DisputeDocument {
  name?: string;
  url?: string;
}

export interface DisputeEvidence {
  evidence_type: string;
  evidence_info?: DisputeEvidenceInfo;
  notes?: string;
  documents?: DisputeDocument[];
  source?:
    | 'BUYER'
    | 'SELLER'
    | 'PAYPAL'
    | 'REQUESTED_FROM_SELLER'
    | 'REQUESTED_FROM_BUYER';
  date?: string;
  item_id?: string;
}

export interface DisputeSummaryItem {
  dispute_id: string;
  create_time: string;
  update_time: string;
  dispute_amount: Money;
  status: DisputeStatus;
  dispute_life_cycle_stage?: DisputeLifeCycleStage;
  dispute_channel?: DisputeChannel;
  reason: string;
  seller_response_due_date?: string;
  links?: HateoasLink[];
  is_simulation?: boolean;
}

export interface DisputeListResponse {
  items: DisputeSummaryItem[];
  total_items?: number;
  total_pages?: number;
  links?: HateoasLink[];
  is_simulation?: boolean;
}

export interface DisputeMessage {
  posted_by: 'BUYER' | 'SELLER' | 'ARBITER';
  time_posted: string;
  content: string;
}

export interface DisputeDetails extends DisputeSummaryItem {
  disputed_transactions?: DisputedTransaction[];
  evidences?: DisputeEvidence[];
  offer?: {
    buyer_requested_amount?: Money;
    seller_offered_amount?: Money;
    history?: Array<{
      offer_time?: string;
      actor?: string;
      event_type?: string;
      offer_type?: string;
      offer_amount?: Money;
    }>;
  };
  messages?: DisputeMessage[];
  adjudications?: Array<{
    type?: string;
    adjudication_time?: string;
    reason?: string;
    disposition?: string;
  }>;
}

export interface ProvideEvidencePayload {
  evidences: Array<{
    evidence_type: string;
    evidence_info?: DisputeEvidenceInfo;
    notes?: string;
  }>;
}
