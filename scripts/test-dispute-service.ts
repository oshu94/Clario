/**
 * Test: Dispute Service Vertical Slice Verification
 * 
 * Tests:
 * 1. List disputes retrieval (shape validation)
 * 2. Get dispute details with full transaction & HATEOAS links
 * 3. Merchant approval gating enforcement
 * 4. HATEOAS permission enforcement (rejection when link is missing or status != WAITING_FOR_SELLER_RESPONSE)
 * 5. 2000-character notes limit validation
 * 6. Authorized evidence submission and subsequent state transition
 */

import {
  fetchDisputes,
  fetchDisputeDetails,
  submitDisputeEvidence,
  checkEvidenceSubmissionPermitted,
} from '../src/lib/dispute-service.ts';

async function runVerticalSliceTest() {
  console.log('========================================================');
  console.log('   STAGE 2: PayPal Vertical Slice Verification Tests   ');
  console.log('========================================================\n');

  // Test 1: List Disputes
  console.log('Test 1: Fetching dispute list...');
  const list = await fetchDisputes();
  console.log(`  Disputes returned: ${list.items.length}`);
  console.log(`  Simulation Mode: ${list.is_simulation ? 'YES (Labeled SIMULATION)' : 'NO (LIVE SANDBOX)'}`);
  if (list.items.length === 0) {
    throw new Error('Test 1 Failed: Dispute list was empty.');
  }
  console.log('  [PASS] Dispute list response validated.\n');

  // Test 2: Fetch Details for PP-D-48921
  console.log('Test 2: Fetching details for dispute PP-D-48921...');
  const dispute = await fetchDisputeDetails('PP-D-48921');
  console.log(`  Dispute ID: ${dispute.dispute_id}`);
  console.log(`  Reason: ${dispute.reason}`);
  console.log(`  Status: ${dispute.status}`);
  console.log(`  Amount: ${dispute.dispute_amount.value} ${dispute.dispute_amount.currency_code}`);
  console.log(`  Buyer: ${dispute.disputed_transactions?.[0]?.buyer?.name}`);
  console.log(`  Item: ${dispute.disputed_transactions?.[0]?.items?.[0]?.item_name}`);
  console.log(`  Existing Evidence Count: ${dispute.evidences?.length || 0}`);
  console.log(`  Links: ${dispute.links.map((l) => l.rel).join(', ')}`);

  const permCheck = checkEvidenceSubmissionPermitted(dispute);
  console.log(`  HATEOAS Evidence Submission Allowed: ${permCheck.permitted ? 'YES' : 'NO'}`);
  if (!permCheck.permitted) {
    throw new Error('Test 2 Failed: Dispute PP-D-48921 should allow evidence submission.');
  }
  console.log('  [PASS] Details and HATEOAS inspection validated.\n');

  // Test 3: Reject Submission Without Explicit Merchant Approval
  console.log('Test 3: Attempting submission without explicit merchant approval...');
  try {
    await submitDisputeEvidence(
      'PP-D-48921',
      {
        evidences: [{ evidence_type: 'PROOF_OF_FULFILLMENT', notes: 'Automated test' }],
      },
      undefined,
      { merchantApproved: false }
    );
    throw new Error('Test 3 Failed: Should have rejected unapproved submission.');
  } catch (err: any) {
    if (err.message.includes('MERCHANT_APPROVAL_REQUIRED')) {
      console.log(`  [PASS] Correctly blocked: ${err.message}`);
    } else {
      throw err;
    }
  }

  // Test 4: Reject Submission When Status is UNDER_REVIEW (Dispute PP-D-63810)
  console.log('\nTest 4: Attempting submission on dispute PP-D-63810 (Status: UNDER_REVIEW)...');
  const reviewDispute = await fetchDisputeDetails('PP-D-63810');
  const reviewCheck = checkEvidenceSubmissionPermitted(reviewDispute);
  console.log(`  Permitted: ${reviewCheck.permitted ? 'YES' : 'NO'}`);
  console.log(`  Reason: ${reviewCheck.reason}`);
  try {
    await submitDisputeEvidence(
      'PP-D-63810',
      {
        evidences: [{ evidence_type: 'PROOF_OF_REFUND', notes: 'Refund attempt' }],
      },
      undefined,
      { merchantApproved: true }
    );
    throw new Error('Test 4 Failed: Should have blocked submission on UNDER_REVIEW dispute.');
  } catch (err: any) {
    if (err.message.includes('EVIDENCE_SUBMISSION_FORBIDDEN')) {
      console.log(`  [PASS] Correctly blocked per HATEOAS rules: ${err.message}`);
    } else {
      throw err;
    }
  }

  // Test 5: Reject Notes Over 2000 Characters Limit
  console.log('\nTest 5: Validating 2000 character limit enforcement on notes...');
  const longNotes = 'X'.repeat(2005);
  try {
    await submitDisputeEvidence(
      'PP-D-48921',
      {
        evidences: [{ evidence_type: 'PROOF_OF_FULFILLMENT', notes: longNotes }],
      },
      undefined,
      { merchantApproved: true }
    );
    throw new Error('Test 5 Failed: Should have rejected notes exceeding 2000 chars.');
  } catch (err: any) {
    if (err.message.includes('NOTES_LENGTH_EXCEEDED')) {
      console.log(`  [PASS] Correctly blocked oversized notes: ${err.message}`);
    } else {
      throw err;
    }
  }

  // Test 6: Authorized Evidence Submission
  console.log('\nTest 6: Submitting valid evidence package with merchant approval on PP-D-48921...');
  const submissionResult = await submitDisputeEvidence(
    'PP-D-48921',
    {
      evidences: [
        {
          evidence_type: 'PROOF_OF_DELIVERY_SIGNATURE',
          evidence_info: {
            tracking_info: [
              {
                carrier_name: 'UPS',
                tracking_number: '1Z999AA10123456784',
              },
            ],
          },
          notes: 'Signed delivery receipt from recipient obtained from carrier dispatch log.',
        },
      ],
    },
    {
      filename: 'delivery_signature_receipt.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 simulated binary signature document'),
    },
    { merchantApproved: true }
  );

  console.log(`  Submission Result: ${submissionResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  Simulation Mode: ${submissionResult.is_simulation ? 'YES (Explicitly Labeled SIMULATION)' : 'NO'}`);
  console.log(`  Response message: ${submissionResult.data.message}`);

  // Re-fetch details to verify state transition
  const updatedDispute = await fetchDisputeDetails('PP-D-48921');
  console.log(`  New Status: ${updatedDispute.status}`);
  console.log(`  Updated Evidence Count: ${updatedDispute.evidences?.length}`);
  const postCheck = checkEvidenceSubmissionPermitted(updatedDispute);
  console.log(`  Can submit again? ${postCheck.permitted ? 'YES' : 'NO'} (${postCheck.reason})`);

  if (updatedDispute.status !== 'UNDER_REVIEW') {
    throw new Error(`Test 6 Failed: Dispute should have transitioned to UNDER_REVIEW, got ${updatedDispute.status}`);
  }
  console.log('  [PASS] State transition and evidence package recorded successfully.\n');

  console.log('========================================================');
  console.log('   ALL STAGE 2 VERTICAL SLICE TESTS PASSED (6/6)!      ');
  console.log('========================================================');
}

runVerticalSliceTest().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
