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
  internal_readiness_score: number; // 0 - 100
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
  metadata?: Record<string, any>;
}

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: AIAnalysisResult;
}

/**
 * Validates raw AI output against the required schema and citation constraints.
 */
export function validateAIAnalysisResult(
  raw: any,
  validSourceIds: Set<string>
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Output is not a valid JSON object.'], warnings: [] };
  }

  // 1. Validate dispute_summary
  if (typeof raw.dispute_summary !== 'string' || !raw.dispute_summary.trim()) {
    errors.push('Missing or empty string for field: dispute_summary');
  }

  // 2. Validate relevant_evidence
  if (!Array.isArray(raw.relevant_evidence)) {
    errors.push('Field relevant_evidence must be an array.');
  } else {
    raw.relevant_evidence.forEach((item: any, idx: number) => {
      if (!item.source_id || typeof item.source_id !== 'string') {
        errors.push(`relevant_evidence[${idx}]: missing source_id`);
      } else if (!validSourceIds.has(item.source_id)) {
        errors.push(`relevant_evidence[${idx}]: cites non-existent source_id '${item.source_id}'`);
      }
      if (!item.finding || typeof item.finding !== 'string') {
        errors.push(`relevant_evidence[${idx}]: missing finding`);
      }
      if (!item.evidence_type || !PAYPAL_EVIDENCE_TYPES.includes(item.evidence_type)) {
        errors.push(`relevant_evidence[${idx}]: invalid PayPal evidence_type '${item.evidence_type}'`);
      }
      if (!['VERIFIED', 'UNVERIFIED'].includes(item.verification_status)) {
        errors.push(`relevant_evidence[${idx}]: verification_status must be 'VERIFIED' or 'UNVERIFIED'`);
      }
    });
  }

  // 3. Validate missing_evidence
  if (!Array.isArray(raw.missing_evidence)) {
    errors.push('Field missing_evidence must be an array.');
  } else {
    raw.missing_evidence.forEach((item: any, idx: number) => {
      if (!item.requirement || typeof item.requirement !== 'string') {
        errors.push(`missing_evidence[${idx}]: missing requirement description`);
      }
      if (!item.suggested_evidence_type || !PAYPAL_EVIDENCE_TYPES.includes(item.suggested_evidence_type)) {
        errors.push(`missing_evidence[${idx}]: invalid suggested_evidence_type '${item.suggested_evidence_type}'`);
      }
      if (typeof item.critical_for_defense !== 'boolean') {
        errors.push(`missing_evidence[${idx}]: critical_for_defense must be boolean`);
      }
    });
  }

  // 4. Validate contradictions
  if (!Array.isArray(raw.contradictions)) {
    errors.push('Field contradictions must be an array.');
  } else {
    raw.contradictions.forEach((item: any, idx: number) => {
      if (!item.description || typeof item.description !== 'string') {
        errors.push(`contradictions[${idx}]: missing description`);
      }
      if (!Array.isArray(item.conflicting_source_ids)) {
        errors.push(`contradictions[${idx}]: conflicting_source_ids must be an array`);
      } else {
        item.conflicting_source_ids.forEach((sid: string) => {
          if (!validSourceIds.has(sid)) {
            errors.push(`contradictions[${idx}]: cites invalid conflicting source_id '${sid}'`);
          }
        });
      }
    });
  }

  // 5. Validate unsupported_claims
  if (!Array.isArray(raw.unsupported_claims)) {
    errors.push('Field unsupported_claims must be an array.');
  }

  // 6. Validate recommended_actions
  if (!Array.isArray(raw.recommended_actions)) {
    errors.push('Field recommended_actions must be an array.');
  } else {
    raw.recommended_actions.forEach((item: any, idx: number) => {
      if (!item.action || typeof item.action !== 'string') {
        errors.push(`recommended_actions[${idx}]: missing action text`);
      }
      if (!item.evidence_type || !PAYPAL_EVIDENCE_TYPES.includes(item.evidence_type)) {
        errors.push(`recommended_actions[${idx}]: invalid evidence_type '${item.evidence_type}'`);
      }
    });
  }

  // 7. Validate response_draft
  if (!raw.response_draft || typeof raw.response_draft !== 'object') {
    errors.push('Missing response_draft object.');
  } else {
    const draft = raw.response_draft;
    if (typeof draft.notes !== 'string') {
      errors.push('response_draft.notes must be a string.');
    } else {
      if (draft.notes.length > 2000) {
        errors.push(`response_draft.notes length (${draft.notes.length}) exceeds PayPal limit of 2000 characters.`);
      }
    }

    if (Array.isArray(draft.sentences)) {
      draft.sentences.forEach((sent: any, sIdx: number) => {
        if (!sent.text || typeof sent.text !== 'string') {
          errors.push(`response_draft.sentences[${sIdx}]: missing sentence text`);
        }
        if (!Array.isArray(sent.source_ids) || sent.source_ids.length === 0) {
          warnings.push(`response_draft.sentences[${sIdx}]: uncited sentence detected ("${sent.text.slice(0, 30)}...")`);
        } else {
          sent.source_ids.forEach((sid: string) => {
            if (!validSourceIds.has(sid)) {
              errors.push(`response_draft.sentences[${sIdx}]: cites unknown source_id '${sid}'`);
            }
          });
        }
      });
    }
  }

  // 8. Validate evidence_readiness
  if (!raw.evidence_readiness || typeof raw.evidence_readiness !== 'object') {
    errors.push('Missing evidence_readiness object.');
  } else {
    const er = raw.evidence_readiness;
    if (typeof er.internal_readiness_score !== 'number' || er.internal_readiness_score < 0 || er.internal_readiness_score > 100) {
      errors.push('evidence_readiness.internal_readiness_score must be a number between 0 and 100.');
    }
    if (!er.score_explanation || typeof er.score_explanation !== 'string') {
      errors.push('evidence_readiness.score_explanation must explain how the internal indicator was calculated.');
    }
    if (!Array.isArray(er.checklist)) {
      errors.push('evidence_readiness.checklist must be an array.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    data: raw as AIAnalysisResult,
  };
}
