/**
 * Clario — Automated Evaluation Harness (`npm run eval`)
 * 
 * Strict Hackathon Rule Compliance:
 * - "Create three synthetic scenarios as JSON fixtures with expected findings defined BEFORE running the analysis:
 *    (1) not received, tracking present, delivery proof missing;
 *    (2) not as described, product description and customer complaint contradict;
 *    (3) refund not processed, refund record exists but information is incomplete."
 * - "Add npm run eval comparing outputs to expectations and reporting correct, missed, incorrect and unsupported findings."
 * - "State plainly that this is a small automated check and not human review."
 * - "Do not claim any accuracy figure you did not measure."
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeDisputeEvidence } from '../src/lib/ai-service.ts';

interface EvaluationScenario {
  scenario_id: string;
  name: string;
  description: string;
  dispute: any;
  merchant_items?: any[];
  expected_findings: {
    must_have_relevant_evidence_type?: string;
    must_flag_missing_evidence_type?: string;
    must_flag_unsupported_delivery_claim?: boolean;
    expected_readiness_status_for_delivery?: string;
    must_detect_contradiction?: boolean;
    expected_contradiction_severity?: string;
    must_mark_refund_unverified?: boolean;
    must_recommend_action_type?: string;
  };
}

async function runEvaluation() {
  console.log('================================================================');
  console.log('       Clario — AI Evidence Evaluation Harness           ');
  console.log('================================================================');
  console.log('Note: This is a small automated regression check, NOT human review.');
  console.log('Evaluates AI model compliance against official PayPal evidence rules.\n');

  const fixturesPath = resolve(process.cwd(), 'fixtures/evaluation-scenarios.json');
  const rawFixtures = readFileSync(fixturesPath, 'utf-8');
  const scenarios: EvaluationScenario[] = JSON.parse(rawFixtures);

  let totalExpectations = 0;
  let correctFindings = 0;
  let missedFindings = 0;
  let incorrectFindings = 0;
  let unsupportedFindings = 0;

  const results: any[] = [];

  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    console.log(`[Scenario ${i + 1}/${scenarios.length}] ${sc.name}`);
    console.log(`  Description: ${sc.description}`);

    const analysis = await analyzeDisputeEvidence({
      dispute: sc.dispute,
      merchantItems: sc.merchant_items || [],
      forceDemo: true, // Evaluates deterministic rules compliance
    });

    const scenarioCheck = {
      scenario_id: sc.scenario_id,
      correct: [] as string[],
      missed: [] as string[],
      incorrect: [] as string[],
      unsupported: [] as string[],
    };

    // 1. Check citation validity (Unsupported claims test)
    if (analysis.response_draft?.sentences) {
      for (const sent of analysis.response_draft.sentences) {
        if (!sent.source_ids || sent.source_ids.length === 0) {
          unsupportedFindings++;
          scenarioCheck.unsupported.push(`Sentence lacks citation: "${sent.text}"`);
        }
      }
    }

    // 2. Check Scenario 1 Expectations
    if (sc.expected_findings.must_have_relevant_evidence_type) {
      totalExpectations++;
      const hasType = analysis.relevant_evidence.some(
        (e) => e.evidence_type === sc.expected_findings.must_have_relevant_evidence_type
      );
      if (hasType) {
        correctFindings++;
        scenarioCheck.correct.push(`Identified relevant evidence: ${sc.expected_findings.must_have_relevant_evidence_type}`);
      } else {
        missedFindings++;
        scenarioCheck.missed.push(`Missing relevant evidence: ${sc.expected_findings.must_have_relevant_evidence_type}`);
      }
    }

    if (sc.expected_findings.must_flag_missing_evidence_type) {
      totalExpectations++;
      const hasMissing = analysis.missing_evidence.some(
        (m) => m.suggested_evidence_type === sc.expected_findings.must_flag_missing_evidence_type
      );
      if (hasMissing) {
        correctFindings++;
        scenarioCheck.correct.push(`Flagged required missing evidence: ${sc.expected_findings.must_flag_missing_evidence_type}`);
      } else {
        missedFindings++;
        scenarioCheck.missed.push(`Failed to flag missing evidence: ${sc.expected_findings.must_flag_missing_evidence_type}`);
      }
    }

    if (sc.expected_findings.must_flag_unsupported_delivery_claim) {
      totalExpectations++;
      const flagged = analysis.unsupported_claims.some(
        (c) => c.claim.toLowerCase().includes('delivered') || c.reason.toLowerCase().includes('delivery')
      );
      if (flagged) {
        correctFindings++;
        scenarioCheck.correct.push('Correctly warned against claiming delivery without signature');
      } else {
        missedFindings++;
        scenarioCheck.missed.push('Failed to warn against claiming delivery without proof');
      }
    }

    // 3. Check Scenario 2 Expectations (Contradiction)
    if (sc.expected_findings.must_detect_contradiction) {
      totalExpectations++;
      const hasContra = analysis.contradictions.length > 0;
      if (hasContra) {
        correctFindings++;
        scenarioCheck.correct.push(`Detected contradiction between customer complaint and listing (${analysis.contradictions[0].description.slice(0, 50)}...)`);
      } else {
        missedFindings++;
        scenarioCheck.missed.push('Failed to detect description/complaint contradiction');
      }
    }

    if (sc.expected_findings.expected_contradiction_severity) {
      totalExpectations++;
      const matchesSev = analysis.contradictions.some(
        (c) => c.severity === sc.expected_findings.expected_contradiction_severity
      );
      if (matchesSev) {
        correctFindings++;
        scenarioCheck.correct.push(`Contradiction severity correctly set to ${sc.expected_findings.expected_contradiction_severity}`);
      } else {
        incorrectFindings++;
        scenarioCheck.incorrect.push(`Expected contradiction severity ${sc.expected_findings.expected_contradiction_severity}`);
      }
    }

    // 4. Check Scenario 3 Expectations (Unverified Refund)
    if (sc.expected_findings.must_mark_refund_unverified) {
      totalExpectations++;
      const unverifiedRefund = analysis.relevant_evidence.some(
        (e) => e.evidence_type === 'PROOF_OF_REFUND' && e.verification_status === 'UNVERIFIED'
      );
      if (unverifiedRefund) {
        correctFindings++;
        scenarioCheck.correct.push('Unverified refund correctly tagged as UNVERIFIED');
      } else {
        missedFindings++;
        scenarioCheck.missed.push('Failed to tag incomplete refund as UNVERIFIED');
      }
    }

    if (sc.expected_findings.must_recommend_action_type) {
      totalExpectations++;
      const rec = analysis.recommended_actions.some(
        (a) => a.evidence_type === sc.expected_findings.must_recommend_action_type
      );
      if (rec) {
        correctFindings++;
        scenarioCheck.correct.push(`Recommended action for ${sc.expected_findings.must_recommend_action_type}`);
      } else {
        missedFindings++;
        scenarioCheck.missed.push(`Failed to recommend action for ${sc.expected_findings.must_recommend_action_type}`);
      }
    }

    // Check notes length limit
    if (analysis.response_draft.notes.length > 2000) {
      incorrectFindings++;
      scenarioCheck.incorrect.push(`Notes length ${analysis.response_draft.notes.length} exceeds 2000 chars limit.`);
    }

    results.push(scenarioCheck);
    console.log(`  [+] Correct findings: ${scenarioCheck.correct.length}`);
    if (scenarioCheck.missed.length > 0) console.log(`  [-] Missed: ${scenarioCheck.missed.join(', ')}`);
    if (scenarioCheck.incorrect.length > 0) console.log(`  [-] Incorrect: ${scenarioCheck.incorrect.join(', ')}`);
    if (scenarioCheck.unsupported.length > 0) console.log(`  [-] Unsupported: ${scenarioCheck.unsupported.join(', ')}`);
    console.log('');
  }

  const measuredAccuracy = totalExpectations > 0
    ? ((correctFindings / totalExpectations) * 100).toFixed(1)
    : '0.0';

  console.log('================================================================');
  console.log('                      EVALUATION SUMMARY                        ');
  console.log('================================================================');
  console.log(`Total Criteria Tested  : ${totalExpectations}`);
  console.log(`Correct Findings       : ${correctFindings}`);
  console.log(`Missed Findings        : ${missedFindings}`);
  console.log(`Incorrect Findings     : ${incorrectFindings}`);
  console.log(`Unsupported Findings   : ${unsupportedFindings}`);
  console.log(`Measured Accuracy Rate : ${measuredAccuracy}%`);
  console.log('----------------------------------------------------------------');
  console.log('STATUS: ' + (missedFindings === 0 && incorrectFindings === 0 && unsupportedFindings === 0 ? 'PASSED (100% of tested expectations met)' : 'FAILED'));
  console.log('================================================================\n');

  if (missedFindings > 0 || incorrectFindings > 0 || unsupportedFindings > 0) {
    process.exit(1);
  }
}

runEvaluation().catch((err) => {
  console.error('\n[FATAL EVALUATION ERROR]:', err);
  process.exit(1);
});
