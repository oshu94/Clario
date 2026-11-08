/**
 * PayPal Sandbox REST Client (Server-Side Only)
 * 
 * Implements strict compliance with official PayPal Customer Disputes API (v1).
 * - Secrets stay strictly server-side in environment variables.
 * - Never prints or logs secrets.
 * - Enforces verified endpoints and HATEOAS validation.
 */

import type {
  DisputeDetails,
  DisputeListResponse,
  HateoasLink,
  ProvideEvidencePayload,
} from './paypal-types.ts';

const SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';

export interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
}

export function getPayPalCredentials(): PayPalCredentials | null {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

/**
 * Exchange Client ID and Secret for an OAuth 2.0 Bearer Access Token
 */
export async function getAccessToken(creds?: PayPalCredentials): Promise<string> {
  const credentials = creds || getPayPalCredentials();
  if (!credentials) {
    throw new Error('PAYPAL_CONFIG_MISSING: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are not set in environment variables.');
  }

  const authString = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
  const response = await fetch(`${SANDBOX_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed: any = {};
    try {
      parsed = JSON.parse(errorText);
    } catch {
      // ignore
    }
    const description = parsed.error_description || parsed.message || response.statusText;
    throw new Error(`PAYPAL_AUTH_FAILED (${response.status}): ${description}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * List Customer Disputes from PayPal Sandbox (GET /v1/customer/disputes)
 */
export async function listDisputes(options: {
  disputeState?: string;
  pageSize?: number;
  nextPageToken?: string;
} = {}): Promise<DisputeListResponse> {
  const token = await getAccessToken();
  const url = new URL(`${SANDBOX_BASE_URL}/v1/customer/disputes`);
  if (options.disputeState) url.searchParams.set('dispute_state', options.disputeState);
  if (options.pageSize) url.searchParams.set('page_size', String(options.pageSize));
  if (options.nextPageToken) url.searchParams.set('next_page_token', options.nextPageToken);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PAYPAL_LIST_DISPUTES_ERROR (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as DisputeListResponse;
  data.is_simulation = false;
  return data;
}

/**
 * Fetch Single Dispute Details (GET /v1/customer/disputes/{id})
 */
export async function getDisputeDetails(disputeId: string): Promise<DisputeDetails> {
  const token = await getAccessToken();
  const response = await fetch(`${SANDBOX_BASE_URL}/v1/customer/disputes/${encodeURIComponent(disputeId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PAYPAL_GET_DISPUTE_ERROR (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as DisputeDetails;
  data.is_simulation = false;
  return data;
}

/**
 * Check if the merchant is officially permitted to submit evidence for this dispute.
 * Requirements per official docs:
 * 1. Status MUST be 'WAITING_FOR_SELLER_RESPONSE'
 * 2. HATEOAS links MUST contain rel: 'provide-evidence'
 */
export function checkEvidenceSubmissionPermitted(dispute: DisputeDetails): {
  permitted: boolean;
  reason?: string;
  provideEvidenceLink?: HateoasLink;
} {
  const provideEvidenceLink = dispute.links?.find((l) => l.rel === 'provide-evidence');

  if (dispute.status !== 'WAITING_FOR_SELLER_RESPONSE') {
    return {
      permitted: false,
      reason: `Dispute status is '${dispute.status}'. Evidence can only be submitted when status is 'WAITING_FOR_SELLER_RESPONSE'.`,
      provideEvidenceLink,
    };
  }

  if (!provideEvidenceLink) {
    return {
      permitted: false,
      reason: `Dispute lacks HATEOAS 'provide-evidence' link. Available links: ${dispute.links?.map((l) => l.rel).join(', ') || 'none'}.`,
    };
  }

  return {
    permitted: true,
    provideEvidenceLink,
  };
}

/**
 * Provide Evidence to PayPal Sandbox (POST /v1/customer/disputes/{id}/provide-evidence)
 * 
 * Strict format: multipart/form-data
 * - part 'input': application/json string with evidence payload
 * - part 'file1': optional binary file (max 10MB; allowed types: .jpg, .jpeg, .gif, .png, .pdf)
 */
export async function provideDisputeEvidence(
  disputeId: string,
  payload: ProvideEvidencePayload,
  file?: {
    filename: string;
    buffer: Buffer | Uint8Array;
    mimeType: string;
  }
): Promise<{ success: boolean; data: any }> {
  // 1. First fetch latest details to ensure HATEOAS permission
  const details = await getDisputeDetails(disputeId);
  const check = checkEvidenceSubmissionPermitted(details);
  if (!check.permitted) {
    throw new Error(`EVIDENCE_SUBMISSION_FORBIDDEN: ${check.reason}`);
  }

  const token = await getAccessToken();

  // 2. Validate notes length (strictly <= 2000 chars)
  for (const ev of payload.evidences) {
    if (ev.notes && ev.notes.length > 2000) {
      throw new Error(`NOTES_LENGTH_EXCEEDED: Notes are ${ev.notes.length} characters, maximum allowed is 2000.`);
    }
  }

  // 3. Build multipart form data
  const formData = new FormData();
  formData.append('input', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'input.json');

  if (file) {
    // Validate file size (10 MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.buffer.length > MAX_SIZE) {
      throw new Error(`FILE_TOO_LARGE: File is ${(file.buffer.length / 1024 / 1024).toFixed(2)} MB; maximum allowed is 10 MB.`);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.mimeType.toLowerCase())) {
      throw new Error(`UNSUPPORTED_FILE_TYPE: Type ${file.mimeType} is not supported. Allowed: .jpg, .png, .gif, .pdf.`);
    }

    const fileBlob = new Blob([file.buffer], { type: file.mimeType });
    formData.append('file1', fileBlob, file.filename);
  }

  const endpointUrl = check.provideEvidenceLink?.href || `${SANDBOX_BASE_URL}/v1/customer/disputes/${encodeURIComponent(disputeId)}/provide-evidence`;

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Note: Do NOT set Content-Type manually when using FormData, fetch sets the multipart boundary automatically
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PAYPAL_PROVIDE_EVIDENCE_ERROR (${response.status}): ${errorBody}`);
  }

  let result: any = null;
  const text = await response.text();
  try {
    result = JSON.parse(text);
  } catch {
    result = { raw: text };
  }

  return { success: true, data: result };
}

/**
 * Sandbox-Only: Require Seller Evidence
 * POST /v1/customer/disputes/{id}/require-evidence with {"action": "SELLER_EVIDENCE"}
 */
export async function requireSellerEvidence(disputeId: string): Promise<any> {
  const token = await getAccessToken();
  const response = await fetch(`${SANDBOX_BASE_URL}/v1/customer/disputes/${encodeURIComponent(disputeId)}/require-evidence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ action: 'SELLER_EVIDENCE' }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`REQUIRE_EVIDENCE_FAILED (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Helper to construct unsigned JWT for PayPal-Auth-Assertion
 */
export function buildUnsignedAuthAssertion(clientId: string, buyerEmail: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: clientId, email: buyerEmail })).toString('base64url');
  return `${header}.${payload}.`;
}

/**
 * Buyer-Side Sandbox Dispute Creation (POST /v1/customer/disputes)
 */
export async function createSandboxDispute(params: {
  buyerTransactionId: string;
  buyerEmail: string;
  reason: string;
  disputeAmount: { currency_code: string; value: string };
  disputeFlow?: string;
}): Promise<any> {
  const creds = getPayPalCredentials();
  if (!creds) {
    throw new Error('PAYPAL_CONFIG_MISSING: Credentials are not configured.');
  }

  const token = await getAccessToken(creds);
  const authAssertion = buildUnsignedAuthAssertion(creds.clientId, params.buyerEmail);

  const disputeInput = {
    disputed_transactions: [
      {
        buyer_transaction_id: params.buyerTransactionId,
      },
    ],
    reason: params.reason,
    dispute_amount: params.disputeAmount,
    dispute_flow: params.disputeFlow || 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
  };

  const formData = new FormData();
  formData.append('input', new Blob([JSON.stringify(disputeInput)], { type: 'application/json' }), 'input.json');

  const response = await fetch(`${SANDBOX_BASE_URL}/v1/customer/disputes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'PayPal-Auth-Assertion': authAssertion,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsed: any = {};
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      // ignore
    }

    if (response.status === 403 || parsed.name === 'NOT_AUTHORIZED' || errorBody.includes('DISPUTE_CREATE')) {
      throw new Error(
        `PAYPAL_PERMISSION_DENIED (${response.status}): The buyer-side 'DISPUTE_CREATE' scope (https://uri.paypal.com/services/disputes/create) is not enabled on this sandbox app. PayPal requires account manager enablement or custom developer permissions to programmatically create disputes from buyer side.`
      );
    }

    throw new Error(`PAYPAL_CREATE_DISPUTE_ERROR (${response.status}): ${errorBody}`);
  }

  return response.json();
}
