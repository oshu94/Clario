/**
 * Simulated PayPal Dispute Service
 * 
 * Strict Hackathon Rule Compliance:
 * - "Never present a mock or simulation as a real PayPal action."
 * - "Every simulated operation is visibly labelled SIMULATION in the UI and logs."
 * - "Keep real and mock services in separate modules."
 * - "Use fixtures that mirror the real response shape (dispute IDs like PP-D-xxxxx, real field names, real HATEOAS structure)."
 */

import type {
  DisputeDetails,
  DisputeListResponse,
  DisputeSummaryItem,
  ProvideEvidencePayload,
} from './paypal-types.ts';

// In-memory store initialized with realistic PayPal API dispute fixtures
const SIMULATED_DISPUTES: DisputeDetails[] = [
  {
    dispute_id: 'PP-D-48921',
    create_time: '2026-11-02T14:22:10Z',
    update_time: '2026-11-03T09:15:00Z',
    dispute_amount: { currency_code: 'USD', value: '189.99' },
    status: 'WAITING_FOR_SELLER_RESPONSE',
    dispute_life_cycle_stage: 'INQUIRY',
    dispute_channel: 'INTERNAL',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    seller_response_due_date: '2026-11-12T23:59:59Z',
    is_simulation: true,
    links: [
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes/PP-D-48921',
        rel: 'self',
        method: 'GET',
      },
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes/PP-D-48921/provide-evidence',
        rel: 'provide-evidence',
        method: 'POST',
      },
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes/PP-D-48921/accept-claim',
        rel: 'accept-claim',
        method: 'POST',
      },
    ],
    disputed_transactions: [
      {
        buyer_transaction_id: '8AA9381028471923C',
        seller_transaction_id: '5TT1029384756102X',
        create_time: '2026-10-28T18:40:12Z',
        transaction_status: 'COMPLETED',
        gross_amount: { currency_code: 'USD', value: '189.99' },
        buyer: {
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins.test@example.com',
        },
        seller: {
          merchant_id: 'MERCHANT_SB_9942',
          name: 'Apex Audio Labs',
          email: 'merchant.audio@example.com',
        },
        items: [
          {
            item_name: 'Studio Wireless Pro Headphones (Matte Black)',
            item_description: 'Active Noise Cancelling Bluetooth 5.3 Over-Ear Studio Headphones',
            item_quantity: '1',
            item_price: { currency_code: 'USD', value: '189.99' },
          },
        ],
      },
    ],
    messages: [
      {
        posted_by: 'BUYER',
        time_posted: '2026-11-02T14:22:10Z',
        content: 'I ordered these headphones over 5 days ago and the courier status still shows "Label Created". I have not received the package and need a refund if it has not shipped.',
      },
    ],
    evidences: [
      {
        evidence_type: 'PROOF_OF_FULFILLMENT',
        source: 'SELLER',
        date: '2026-10-29T10:00:00Z',
        evidence_info: {
          tracking_info: [
            {
              carrier_name: 'UPS',
              tracking_number: '1Z999AA10123456784',
              carrier_url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
            },
          ],
        },
        notes: 'UPS ground tracking number assigned. Package prepared in warehouse.',
      },
    ],
  },
  {
    dispute_id: 'PP-D-51203',
    create_time: '2026-11-04T11:10:45Z',
    update_time: '2026-11-05T08:30:00Z',
    dispute_amount: { currency_code: 'USD', value: '349.50' },
    status: 'WAITING_FOR_SELLER_RESPONSE',
    dispute_life_cycle_stage: 'CHARGEBACK',
    dispute_channel: 'CHARGEBACK',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
    seller_response_due_date: '2026-11-14T23:59:59Z',
    is_simulation: true,
    links: [
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes/PP-D-51203',
        rel: 'self',
        method: 'GET',
      },
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes/PP-D-51203/provide-evidence',
        rel: 'provide-evidence',
        method: 'POST',
      },
    ],
    disputed_transactions: [
      {
        buyer_transaction_id: '4KL8829102938475P',
        seller_transaction_id: '7YY3948572019384M',
        create_time: '2026-10-25T12:05:30Z',
        transaction_status: 'COMPLETED',
        gross_amount: { currency_code: 'USD', value: '349.50' },
        buyer: {
          name: 'Marcus Vance',
          email: 'marcus.vance.test@example.com',
        },
        items: [
          {
            item_name: 'Refurbished Mechanical Chronograph Watch',
            item_description: 'Grade-A Refurbished 42mm Automatic Watch with Vintage Leather Strap. Minor patina on dial as pictured.',
            item_quantity: '1',
            item_price: { currency_code: 'USD', value: '349.50' },
          },
        ],
      },
    ],
    messages: [
      {
        posted_by: 'BUYER',
        time_posted: '2026-11-04T11:10:45Z',
        content: 'The watch arrived with severe scratches on the dial face. The listing claimed this was brand-new flawless retail stock with full manufacturer box, not vintage with patina.',
      },
    ],
    evidences: [
      {
        evidence_type: 'ITEM_DESCRIPTION',
        source: 'SELLER',
        date: '2026-11-04T16:00:00Z',
        notes: 'Original listing explicitly specified "Grade-A Refurbished with vintage patina". Buyer confirmed terms at checkout.',
      },
    ],
  },
  {
    dispute_id: 'PP-D-63810',
    create_time: '2026-11-01T09:00:00Z',
    update_time: '2026-11-06T15:20:00Z',
    dispute_amount: { currency_code: 'USD', value: '75.00' },
    status: 'UNDER_REVIEW',
    dispute_life_cycle_stage: 'INQUIRY',
    dispute_channel: 'INTERNAL',
    reason: 'CREDIT_NOT_PROCESSED',
    seller_response_due_date: undefined,
    is_simulation: true,
    links: [
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes/PP-D-63810',
        rel: 'self',
        method: 'GET',
      },
      // Intentionally omitting provide-evidence link because status is UNDER_REVIEW
    ],
    disputed_transactions: [
      {
        buyer_transaction_id: '9ZZ1122334455667K',
        seller_transaction_id: '3RR9988776655443L',
        create_time: '2026-10-15T08:14:00Z',
        transaction_status: 'COMPLETED',
        gross_amount: { currency_code: 'USD', value: '75.00' },
        buyer: {
          name: 'Elena Rostova',
          email: 'elena.rostova.test@example.com',
        },
        items: [
          {
            item_name: 'Annual SaaS Analytics Tier (Monthly Installment)',
            item_description: 'Subscription license agreement with 30-day non-refundable clause',
            item_quantity: '1',
            item_price: { currency_code: 'USD', value: '75.00' },
          },
        ],
      },
    ],
    messages: [
      {
        posted_by: 'BUYER',
        time_posted: '2026-11-01T09:00:00Z',
        content: 'I requested account cancellation on October 20th and was told a refund would be issued, but my card statement still does not reflect the credit.',
      },
    ],
    evidences: [
      {
        evidence_type: 'PROOF_OF_REFUND',
        source: 'SELLER',
        date: '2026-11-06T12:00:00Z',
        evidence_info: {
          refund_ids: ['REF-TEST-9920194'],
        },
        notes: 'Partial refund initiated via merchant banking portal, pending final PayPal reconciliation.',
      },
    ],
  },
];

export async function listSimulatedDisputes(): Promise<DisputeListResponse> {
  console.log('[SIMULATION] Fetching simulated dispute list...');
  const items: DisputeSummaryItem[] = SIMULATED_DISPUTES.map((d) => ({
    dispute_id: d.dispute_id,
    create_time: d.create_time,
    update_time: d.update_time,
    dispute_amount: d.dispute_amount,
    status: d.status,
    dispute_life_cycle_stage: d.dispute_life_cycle_stage,
    dispute_channel: d.dispute_channel,
    reason: d.reason,
    seller_response_due_date: d.seller_response_due_date,
    links: d.links,
    is_simulation: true,
  }));

  return {
    items,
    total_items: items.length,
    total_pages: 1,
    is_simulation: true,
    links: [
      {
        href: 'https://api-m.sandbox.paypal.com/v1/customer/disputes',
        rel: 'self',
        method: 'GET',
      },
    ],
  };
}

export async function getSimulatedDisputeDetails(disputeId: string): Promise<DisputeDetails> {
  console.log(`[SIMULATION] Fetching simulated dispute details for ${disputeId}...`);
  const found = SIMULATED_DISPUTES.find((d) => d.dispute_id === disputeId);
  if (!found) {
    throw new Error(`SIMULATION_DISPUTE_NOT_FOUND: No simulated dispute matches ID ${disputeId}`);
  }
  return JSON.parse(JSON.stringify(found));
}

export async function provideSimulatedEvidence(
  disputeId: string,
  payload: ProvideEvidencePayload,
  file?: {
    filename: string;
    mimeType: string;
    buffer: Buffer | Uint8Array;
  }
): Promise<{ success: boolean; data: any; is_simulation: true }> {
  console.log(`[SIMULATION] Processing simulated evidence submission for ${disputeId}...`);
  const dispute = SIMULATED_DISPUTES.find((d) => d.dispute_id === disputeId);
  if (!dispute) {
    throw new Error(`SIMULATION_DISPUTE_NOT_FOUND: ${disputeId}`);
  }

  // Validate HATEOAS link simulation rule
  const hasLink = dispute.links.some((l) => l.rel === 'provide-evidence');
  if (dispute.status !== 'WAITING_FOR_SELLER_RESPONSE' || !hasLink) {
    throw new Error(
      `EVIDENCE_SUBMISSION_FORBIDDEN (SIMULATION): Dispute status is '${dispute.status}' and HATEOAS provide-evidence link is ${hasLink ? 'present' : 'missing'}. Submission refused.`
    );
  }

  // Enforce notes length limit
  for (const ev of payload.evidences) {
    if (ev.notes && ev.notes.length > 2000) {
      throw new Error(`NOTES_LENGTH_EXCEEDED: Notes are ${ev.notes.length} characters, maximum allowed is 2000.`);
    }
  }

  // Add evidence to dispute
  if (!dispute.evidences) dispute.evidences = [];
  for (const item of payload.evidences) {
    dispute.evidences.push({
      evidence_type: item.evidence_type,
      evidence_info: item.evidence_info,
      notes: item.notes,
      source: 'SELLER',
      date: new Date().toISOString(),
      documents: file ? [{ name: file.filename, url: `https://simulated-storage.paypal.com/${file.filename}` }] : undefined,
    });
  }

  // Transition dispute status to UNDER_REVIEW and remove provide-evidence link
  dispute.status = 'UNDER_REVIEW';
  dispute.update_time = new Date().toISOString();
  dispute.links = dispute.links.filter((l) => l.rel !== 'provide-evidence');

  return {
    success: true,
    is_simulation: true,
    data: {
      message: 'SIMULATION: Evidence received and stored in local fixture. NOT TESTED against live PayPal Sandbox API.',
      dispute_id: disputeId,
      new_status: dispute.status,
      timestamp: dispute.update_time,
    },
  };
}
