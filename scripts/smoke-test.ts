/**
 * PayPal Sandbox Integration Smoke Test
 * 
 * Verifies:
 * 1. Server-side environment credential presence
 * 2. OAuth 2.0 Token Generation
 * 3. GET /v1/customer/disputes (listing)
 * 4. GET /v1/customer/disputes/{id} (inspect details if any exist)
 * 5. Lifecycle, status, and HATEOAS link checks for evidence submission readiness
 */

import {
  getPayPalCredentials,
  getAccessToken,
  listDisputes,
  getDisputeDetails,
  checkEvidenceSubmissionPermitted,
} from '../src/lib/paypal-client.ts';

async function runSmokeTest() {
  console.log('====================================================');
  console.log('   DISPUTEREADY — PayPal Sandbox Smoke Test        ');
  console.log('====================================================\n');

  console.log('1. Checking Server Environment Credentials...');
  const creds = getPayPalCredentials();
  if (!creds) {
    console.log('   [-] PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET: NOT SET in environment.');
    console.log('   [BLOCKED] Smoke test cannot reach live PayPal Sandbox API without credentials.');
    console.log('   [INFO] In accordance with Hackathon rules, fallback simulation mode is active.');
    return {
      status: 'BLOCKED_NO_CREDENTIALS',
      message: 'PayPal sandbox credentials not detected in environment.',
    };
  }

  // Redact credentials in output
  const maskedId = creds.clientId.slice(0, 4) + '...' + creds.clientId.slice(-4);
  console.log(`   [+] PAYPAL_CLIENT_ID configured: ${maskedId}`);
  console.log(`   [+] PAYPAL_CLIENT_SECRET configured: [REDACTED ${creds.clientSecret.length} chars]`);

  console.log('\n2. Testing OAuth 2.0 Server-Side Authentication...');
  let token: string;
  try {
    token = await getAccessToken(creds);
    const maskedToken = token.slice(0, 6) + '...' + token.slice(-4);
    console.log(`   [+] OAuth 2.0 Access Token acquired successfully! Token: ${maskedToken}`);
  } catch (err: any) {
    console.error(`   [-] Authentication Failed: ${err.message}`);
    return {
      status: 'FAILED_AUTH',
      error: err.message,
    };
  }

  console.log('\n3. Testing GET /v1/customer/disputes (List Disputes)...');
  try {
    const disputeList = await listDisputes();
    const count = disputeList.items?.length || 0;
    console.log(`   [+] Successfully connected to PayPal Disputes API.`);
    console.log(`   [+] Disputes found in sandbox account: ${count}`);

    if (count > 0) {
      console.log('\n4. Inspecting first dispute in sandbox...');
      const first = disputeList.items[0];
      console.log(`   Dispute ID: ${first.dispute_id}`);
      console.log(`   Status: ${first.status}`);
      console.log(`   Reason: ${first.reason}`);
      console.log(`   Amount: ${first.dispute_amount.value} ${first.dispute_amount.currency_code}`);

      const details = await getDisputeDetails(first.dispute_id);
      console.log(`   Lifecycle Stage: ${details.dispute_life_cycle_stage || 'N/A'}`);
      console.log(`   Due Date: ${details.seller_response_due_date || 'N/A'}`);
      console.log(`   Available HATEOAS Actions: ${details.links?.map((l) => l.rel).join(', ') || 'none'}`);

      const check = checkEvidenceSubmissionPermitted(details);
      console.log(`\n5. Evidence Submission Assessment:`);
      console.log(`   Permitted: ${check.permitted ? 'YES' : 'NO'}`);
      if (!check.permitted) {
        console.log(`   Reason: ${check.reason}`);
      } else {
        console.log(`   Endpoint: ${check.provideEvidenceLink?.href}`);
      }
    } else {
      console.log('   [i] Sandbox account currently contains 0 disputes.');
      console.log('   [i] Use scripts/create-sandbox-dispute.ts or the buyer payment flow to generate dispute records.');
    }

    return {
      status: 'SUCCESS',
      disputeCount: count,
    };
  } catch (err: any) {
    console.error(`   [-] Dispute API listing error: ${err.message}`);
    return {
      status: 'FAILED_API_CALL',
      error: err.message,
    };
  }
}

runSmokeTest().then((result) => {
  console.log('\nSmoke Test Result:', JSON.stringify(result, null, 2));
});
