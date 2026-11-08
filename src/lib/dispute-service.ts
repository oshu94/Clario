/**
 * Dispute Service — Dual-Mode Dispatcher
 * 
 * Strict Hackathon Rule Compliance:
 * - Uses real PayPal sandbox API when credentials are provided.
 * - When credentials or buyer permissions are missing, falls back cleanly to the mock service.
 * - Every simulated response is visibly labelled `is_simulation: true`.
 * - Never claims a simulated action hit PayPal.
 */

import type {
  DisputeDetails,
  DisputeListResponse,
  ProvideEvidencePayload,
} from './paypal-types.ts';
import {
  getPayPalCredentials,
  listDisputes as listLiveDisputes,
  getDisputeDetails as getLiveDisputeDetails,
  provideDisputeEvidence as provideLiveDisputeEvidence,
  checkEvidenceSubmissionPermitted,
} from './paypal-client.ts';
import {
  listSimulatedDisputes,
  getSimulatedDisputeDetails,
  provideSimulatedEvidence,
} from './mock-dispute-service.ts';

export function isLivePayPalConfigured(): boolean {
  return getPayPalCredentials() !== null;
}

export async function fetchDisputes(options: {
  forceSimulation?: boolean;
  disputeState?: string;
  pageSize?: number;
} = {}): Promise<DisputeListResponse> {
  if (isLivePayPalConfigured() && !options.forceSimulation) {
    try {
      console.log('[LIVE] Querying live PayPal sandbox customer disputes API...');
      return await listLiveDisputes(options);
    } catch (err: any) {
      console.warn(`[FALLBACK] Live PayPal list query failed (${err.message}). Falling back to simulation mode.`);
      const sim = await listSimulatedDisputes();
      return sim;
    }
  }

  return await listSimulatedDisputes();
}

export async function fetchDisputeDetails(disputeId: string, options: {
  forceSimulation?: boolean;
} = {}): Promise<DisputeDetails> {
  if (isLivePayPalConfigured() && !options.forceSimulation) {
    try {
      console.log(`[LIVE] Fetching live PayPal sandbox dispute details for ${disputeId}...`);
      return await getLiveDisputeDetails(disputeId);
    } catch (err: any) {
      console.warn(`[FALLBACK] Live PayPal dispute details query failed (${err.message}). Checking simulation fixtures.`);
      return await getSimulatedDisputeDetails(disputeId);
    }
  }

  return await getSimulatedDisputeDetails(disputeId);
}

export async function submitDisputeEvidence(
  disputeId: string,
  payload: ProvideEvidencePayload,
  file?: {
    filename: string;
    mimeType: string;
    buffer: Buffer | Uint8Array;
  },
  options: {
    forceSimulation?: boolean;
    merchantApproved: boolean;
  } = { merchantApproved: false }
): Promise<{
  success: boolean;
  is_simulation: boolean;
  data: any;
}> {
  if (!options.merchantApproved) {
    throw new Error('MERCHANT_APPROVAL_REQUIRED: No evidence can be submitted to PayPal without explicit merchant approval.');
  }

  if (isLivePayPalConfigured() && !options.forceSimulation) {
    try {
      console.log(`[LIVE] Submitting multipart evidence to PayPal sandbox for ${disputeId}...`);
      const res = await provideLiveDisputeEvidence(disputeId, payload, file);
      return {
        success: res.success,
        is_simulation: false,
        data: res.data,
      };
    } catch (err: any) {
      console.error(`[LIVE ERROR] Submission to live PayPal sandbox failed: ${err.message}`);
      throw err;
    }
  }

  // Simulation mode
  const simRes = await provideSimulatedEvidence(disputeId, payload, file);
  return {
    success: simRes.success,
    is_simulation: true,
    data: simRes.data,
  };
}

export { checkEvidenceSubmissionPermitted };
