/**
 * AI Dispute Evidence Intelligence — Schema & Strict Validation
 * 
 * Strict Hackathon Rule Compliance:
 * - "Input: structured dispute data, the evidence-map entry for the dispute's actual reason,
 *    existing PayPal evidence, and merchant evidence items (each with an ID)."
 * - "Output: JSON validated against a schema before display, with fields:
 *    dispute_summary, relevant_evidence, missing_evidence, contradictions,
 *    unsupported_claims, recommended_actions, response_draft, evidence_readiness."
 * - "Every finding and every sentence in the draft cites source_ids that exist in the input."
 * - "Facts that cannot be verified are labelled 'unverified'."
 * - "Never invent tracking events, delivery confirmation, customer statements, refunds or transaction details."
 * - "Readiness is a checklist, not a win probability."
 * - "Enforce the 2000-character notes limit."
 */

import {
  PAYPAL_EVIDENCE_TYPES,
  PAYPAL_DISPUTE_REASONS,
  type PayPalEvidenceType,
  type PayPalDisputeReason,
} from './evidence-map.ts';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED';
export type ContradictionSeverity = 'HIGH' | 'MEDIUM';
export type ActionPriority = 'IMMEDIATE' | 'HIGH' | 'OPTIONAL';
export type ChecklistStatus = 'SATISFIED' | 'MISSING' | 'WARNING';

export interface RelevantEvidenceItem {
  source_id: string;
  finding: string;
  evidence_type: PayPalEvidenceType;
  verification_status: VerificationStatus;
}

export interface MissingEvidenceItem {
  requirement: string;
  suggested_evidence_type: PayPalEvidenceType;
  critical_for_defense: boolean;
  reason_guidance_ref: string;
}

export interface ContradictionItem {
  description: string;
  conflicting_source_ids: string[];
  severity: ContradictionSeverity;
}

export interface UnsupportedClaimItem {
  claim: string;
  reason: string;
  source_ids: string[];
}

export interface RecommendedActionItem {
  action: string;
  evidence_type: PayPalEvidenceType;
  priority: ActionPriority;
}

export interface DraftSentence {
  text: string;
  source_ids: string[];
}

export interface ResponseDraft {
  notes: string;
  cited_source_ids: string[];
  sentences: DraftSentence[];
}

export interface ReadinessChecklistItem {
  item: string;
  status: ChecklistStatus;
  source_id?: string;
  notes?: string;
}

export interface EvidenceReadiness {
  available_count: number;
  missing_count: number;
  contradictions_count: number;
  unverified_count: number;
  checklist: ReadinessChecklistItem[];
  internal_readiness_score: number;
  score_explanation: string;
}

export interface AIAnalysisResult {
  dispute_id: string;
  reason: PayPalDisputeReason;
  dispute_summary: string;
  relevant_evidence: RelevantEvidenceItem[];
  missing_evidence: MissingEvidenceItem[];
  contradictions: ContradictionItem[];
  unsupported_claims: UnsupportedClaimItem[];
  recommended_actions: RecommendedActionItem[];
  response_draft: ResponseDraft;
  evidence_readiness: EvidenceReadiness;
  is_demo_mode: boolean;
  ai_provider: string;
  timestamp: string;
}

export interface MerchantEvidenceItem {
  id: string;
  title: string;
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: AIAnalysisResult;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEvidenceType(value: unknown): value is PayPalEvidenceType {
  return typeof value === 'string' &&
    (PAYPAL_EVIDENCE_TYPES as readonly string[]).includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function checkSourceIds(
  ids: unknown,
  validSourceIds: Set<string>,
  location: string,
  errors: string[],
  requireAtLeastOne = false
): void {
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    errors.push(`${location}: source_ids must be an array of strings.`);
    return;
  }

  if (requireAtLeastOne && ids.length === 0) {
    errors.push(`${location}: at least one source_id is required.`);
  }

  for (const id of ids) {
    if (!validSourceIds.has(id)) {
      errors.push(`${location}: unknown source_id '${id}'.`);
    }
  }
}

export function validateAIAnalysisResult(
  raw: unknown,
  validSourceIds: Set<string>
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(raw)) {
    return {
      valid: false,
      errors: ['Output is not a valid JSON object.'],
      warnings: [],
    };
  }

  // Required top-level fields
  if (typeof raw.dispute_id !== 'string' || !raw.dispute_id.trim()) {
    errors.push('dispute_id must be a non-empty string.');
  }

  if (
    typeof raw.reason !== 'string' ||
    !(PAYPAL_DISPUTE_REASONS as readonly string[]).includes(raw.reason)
  ) {
    errors.push('reason is not a supported PayPal dispute reason.');
  }

  if (typeof raw.dispute_summary !== 'string' || !raw.dispute_summary.trim()) {
    errors.push('dispute_summary must be a non-empty string.');
  }

  if (typeof raw.is_demo_mode !== 'boolean') {
    errors.push('is_demo_mode must be a boolean.');
  }

  if (typeof raw.ai_provider !== 'string' || !raw.ai_provider.trim()) {
    errors.push('ai_provider must be a non-empty string.');
  }

  if (
    typeof raw.timestamp !== 'string' ||
    Number.isNaN(Date.parse(raw.timestamp))
  ) {
    errors.push('timestamp must be a valid date string.');
  }

  // Relevant evidence
  if (!Array.isArray(raw.relevant_evidence)) {
    errors.push('relevant_evidence must be an array.');
  } else {
    raw.relevant_evidence.forEach((item: unknown, index: number) => {
      const path = `relevant_evidence[${index}]`;

      if (!isObject(item)) {
        errors.push(`${path} must be an object.`);
        return;
      }

      if (typeof item.source_id !== 'string' || !validSourceIds.has(item.source_id)) {
        errors.push(`${path} contains an invalid source_id.`);
      }

      if (typeof item.finding !== 'string' || !item.finding.trim()) {
        errors.push(`${path}.finding must be a non-empty string.`);
      }

      if (!isEvidenceType(item.evidence_type)) {
        errors.push(`${path}.evidence_type is not a valid PayPal evidence type.`);
      }

      if (!['VERIFIED', 'UNVERIFIED'].includes(item.verification_status)) {
        errors.push(`${path}.verification_status is invalid.`);
      }
    });
  }

  // Missing evidence
  if (!Array.isArray(raw.missing_evidence)) {
    errors.push('missing_evidence must be an array.');
  } else {
    raw.missing_evidence.forEach((item: unknown, index: number) => {
      const path = `missing_evidence[${index}]`;

      if (!isObject(item)) {
        errors.push(`${path} must be an object.`);
        return;
      }

      if (typeof item.requirement !== 'string' || !item.requirement.trim()) {
        errors.push(`${path}.requirement is required.`);
      }

      if (!isEvidenceType(item.suggested_evidence_type)) {
        errors.push(`${path}.suggested_evidence_type is invalid.`);
      }

      if (typeof item.critical_for_defense !== 'boolean') {
        errors.push(`${path}.critical_for_defense must be a boolean.`);
      }

      if (
        typeof item.reason_guidance_ref !== 'string' ||
        !item.reason_guidance_ref.startsWith('https://developer.paypal.com/')
      ) {
        errors.push(`${path}.reason_guidance_ref must be an official PayPal guidance URL.`);
      }
    });
  }

  // Contradictions
  if (!Array.isArray(raw.contradictions)) {
    errors.push('contradictions must be an array.');
  } else {
    raw.contradictions.forEach((item: unknown, index: number) => {
      const path = `contradictions[${index}]`;

      if (!isObject(item)) {
        errors.push(`${path} must be an object.`);
        return;
      }

      if (typeof item.description !== 'string' || !item.description.trim()) {
        errors.push(`${path}.description is required.`);
      }

      if (!isStringArray(item.conflicting_source_ids)) {
        errors.push(`${path}.conflicting_source_ids must be an array of strings.`);
      } else {
        if (item.conflicting_source_ids.length < 2) {
          errors.push(`${path} must reference at least two sources.`);
        }

        checkSourceIds(
          item.conflicting_source_ids,
          validSourceIds,
          path,
          errors
        );
      }

      if (!['HIGH', 'MEDIUM'].includes(item.severity)) {
        errors.push(`${path}.severity is invalid.`);
      }
    });
  }

  // Unsupported claims
  if (!Array.isArray(raw.unsupported_claims)) {
    errors.push('unsupported_claims must be an array.');
  } else {
    raw.unsupported_claims.forEach((item: unknown, index: number) => {
      const path = `unsupported_claims[${index}]`;

      if (!isObject(item)) {
        errors.push(`${path} must be an object.`);
        return;
      }

      if (typeof item.claim !== 'string' || !item.claim.trim()) {
        errors.push(`${path}.claim is required.`);
      }

      if (typeof item.reason !== 'string' || !item.reason.trim()) {
        errors.push(`${path}.reason is required.`);
      }

      checkSourceIds(item.source_ids, validSourceIds, path, errors);
    });
  }

  // Recommended actions
  if (!Array.isArray(raw.recommended_actions)) {
    errors.push('recommended_actions must be an array.');
  } else {
    raw.recommended_actions.forEach((item: unknown, index: number) => {
      const path = `recommended_actions[${index}]`;

      if (!isObject(item)) {
        errors.push(`${path} must be an object.`);
        return;
      }

      if (typeof item.action !== 'string' || !item.action.trim()) {
        errors.push(`${path}.action is required.`);
      }

      if (!isEvidenceType(item.evidence_type)) {
        errors.push(`${path}.evidence_type is invalid.`);
      }

      if (!['IMMEDIATE', 'HIGH', 'OPTIONAL'].includes(item.priority)) {
        errors.push(`${path}.priority is invalid.`);
      }
    });
  }

  // Response draft
  if (!isObject(raw.response_draft)) {
    errors.push('response_draft must be an object.');
  } else {
    const draft = raw.response_draft;

    if (typeof draft.notes !== 'string') {
      errors.push('response_draft.notes must be a string.');
    } else if (draft.notes.length > 2000) {
      errors.push('response_draft.notes exceeds the 2000-character limit.');
    }

    checkSourceIds(
      draft.cited_source_ids,
      validSourceIds,
      'response_draft.cited_source_ids',
      errors
    );

    if (!Array.isArray(draft.sentences)) {
      errors.push('response_draft.sentences must be an array.');
    } else {
      draft.sentences.forEach((sentence: unknown, index: number) => {
        const path = `response_draft.sentences[${index}]`;

        if (!isObject(sentence)) {
          errors.push(`${path} must be an object.`);
          return;
        }

        if (typeof sentence.text !== 'string' || !sentence.text.trim()) {
          errors.push(`${path}.text is required.`);
        }

        checkSourceIds(
          sentence.source_ids,
          validSourceIds,
          path,
          errors,
          true
        );
      });
    }
  }

  // Evidence readiness
  if (!isObject(raw.evidence_readiness)) {
    errors.push('evidence_readiness must be an object.');
  } else {
    const readiness = raw.evidence_readiness;

    for (const field of [
      'available_count',
      'missing_count',
      'contradictions_count',
      'unverified_count',
    ]) {
      if (!Number.isInteger(readiness[field]) || readiness[field] < 0) {
        errors.push(`evidence_readiness.${field} must be a non-negative integer.`);
      }
    }

    if (
      typeof readiness.internal_readiness_score !== 'number' ||
      !Number.isFinite(readiness.internal_readiness_score) ||
      readiness.internal_readiness_score < 0 ||
      readiness.internal_readiness_score > 100
    ) {
      errors.push('internal_readiness_score must be between 0 and 100.');
    }

    if (
      typeof readiness.score_explanation !== 'string' ||
      !readiness.score_explanation.trim()
    ) {
      errors.push('score_explanation is required.');
    }

    if (!Array.isArray(readiness.checklist)) {
      errors.push('evidence_readiness.checklist must be an array.');
    } else {
      readiness.checklist.forEach((item: unknown, index: number) => {
        const path = `evidence_readiness.checklist[${index}]`;

        if (!isObject(item)) {
          errors.push(`${path} must be an object.`);
          return;
        }

        if (typeof item.item !== 'string' || !item.item.trim()) {
          errors.push(`${path}.item is required.`);
        }

        if (!['SATISFIED', 'MISSING', 'WARNING'].includes(item.status)) {
          errors.push(`${path}.status is invalid.`);
        }

        if (item.source_id !== undefined) {
          if (
            typeof item.source_id !== 'string' ||
            !validSourceIds.has(item.source_id)
          ) {
            errors.push(`${path}.source_id is invalid.`);
          }
        }

        if (item.notes !== undefined && typeof item.notes !== 'string') {
          errors.push(`${path}.notes must be a string.`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    data: raw as unknown as AIAnalysisResult,
  };
}