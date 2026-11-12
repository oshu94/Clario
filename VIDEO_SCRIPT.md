# Clario: Video Demo Script (Under 3 Minutes)

> **Tone**: Professional, crisp, transparent, and authoritative.  
> **Duration**: ~2 minutes 45 seconds  
> **Honesty Notice**: Clearly states that simulated mode is active when sandbox credentials are not present, demonstrating verified dual-mode capabilities.

---

### [0:00 - 0:30] Introduction & The Problem

**[VISUAL]**: Close-up of the Clario Dashboard running at `http://localhost:3000`. Clean, dark fintech UI showing Active Disputes, Response Deadlines, and the Live Mode Banner.

**[SPEAKER]**:
> "Hi everyone, this is **Clario**, an AI Evidence Copilot built for the PayPal AI Hackathon.
> 
> When merchants receive a dispute on PayPal, defending it is stressful, procedural, and unforgiving. Submitting the wrong evidence type—or claiming an item was delivered when tracking only says 'Label Created'—causes automatic claim forfeiture.
> 
> Clario solves this by bringing AI intelligence directly onto the official PayPal Customer Disputes API v1, grounding every recommendation in official reason guidance and enforcing strict evidence citations."

---

### [0:30 - 1:00] Transparent Dual-Mode Architecture & The Dispute Workspace

**[VISUAL]**: Cursor highlights the top-right status badges: `PAYPAL: SIMULATION` and `AI: DEMO`. Then, the cursor clicks on Case `PP-D-48921` (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`).

**[SPEAKER]**:
> "Let's be completely transparent: Clario features a dual-mode architecture. When live PayPal sandbox credentials are in `.env`, it calls PayPal's REST endpoints directly. Today, in this demo environment without ambient credentials, our isolated simulation service is active—clearly labeled throughout the UI.
> 
> Let's open Case **PP-D-48921**, an Item Not Received dispute for $189.99.
> 
> Notice the case banner: our server immediately checks PayPal's HATEOAS links. Because the status is `WAITING_FOR_SELLER_RESPONSE` and the `provide-evidence` link is present, evidence submission is unlocked.
> 
> Below, we see the buyer's complaint: they claim the item never arrived. Under our 5-status Evidence Manager, we see an existing carrier tracking number."

---

### [1:00 - 1:45] The AI Evidence Intelligence Panel (Visual Centrepiece)

**[VISUAL]**: Cursor clicks the glowing **"Analyze Evidence with AI"** button. The AI Copilot panel animates, revealing the Internal Readiness Score (67%), the checklist, the Unsupported Claims Warning, Relevant Evidence, and Missing Critical Evidence.

**[SPEAKER]**:
> "Now, watch the AI Copilot in action. When we click 'Analyze Evidence with AI', Clario compiles a canonical source registry and evaluates the case against PayPal's specific rules for Item Not Received claims.
> 
> Look at the findings:
> First, our **Internal Readiness Indicator** is at 67%. Notice it's not a fake 'win probability'—it's an honest checklist showing which defense requirements have been satisfied.
> 
> Second, our **Unsupported Claims Guardrail** warns: *Do not claim the package was delivered*. The tracking number shows dispatch, but no signed proof of delivery exists. If a merchant claims delivery without proof, PayPal will reject the case.
> 
> Third, it flags the missing critical evidence: `PROOF_OF_DELIVERY_SIGNATURE` mapped to the official PayPal schema enum.
> 
> Every finding and every sentence in our generated draft cites an existing `source_id` from the inputs. Zero hallucinations."

---

### [1:45 - 2:15] Review, Approval Gate & HATEOAS State Transition

**[VISUAL]**: Cursor scrolls down to the Response Package Review. The draft notes are populated with source pills. Cursor demonstrates typing beyond limits (showing character counter) and highlights the disabled submit button.

**[SPEAKER]**:
> "Next, look at the Response Package Review.
> 
> The AI drafts merchant defense notes strictly anchored to our sources, and our real-time counter guarantees it never exceeds PayPal's strict 2000-character ceiling.
> 
> Crucially, look at the **Explicit Merchant Approval Gate**. The submit button is completely disabled. Per our core hackathon rules, nothing is ever submitted to PayPal without explicit merchant authorization.
> 
> Once the merchant reviews and checks the approval box, the submit button activates.
> 
> When we submit, the payload is validated, formatted into PayPal's verified multipart structure (`input` JSON plus `file1`), and dispatched. The dispute immediately transitions to `UNDER_REVIEW`, and the HATEOAS `provide-evidence` link is revoked."

---

### [2:15 - 2:45] Automated Regression Evaluation & Conclusion

**[VISUAL]**: Quick cut to terminal running `npm run eval`. The automated harness tests the 3 synthetic dispute scenarios and outputs 100% measured accuracy on tested criteria.

**[SPEAKER]**:
> "Finally, we don't just hope our AI works—we measure it.
> 
> Running `npm run eval` executes an automated regression suite across three synthetic scenarios: Item Not Received, Not As Described contradiction, and an unverified refund. All 9 defensive criteria passed with 100% measured accuracy.
> 
> Clario turns dispute defense from an error-prone gamble into a verified, compliant, and intelligent workflow for PayPal merchants.
> 
> Thank you!"

**[VISUAL]**: Closing title card with repository URL, MIT License notice, and PayPal AI Hackathon logo.
