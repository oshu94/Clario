/**
 * DisputeReady Frontend Application
 * 
 * Drives dashboard, dispute workspace, AI evidence copilot, and approval submission gate.
 */

// Global Application State
const state = {
  health: null,
  disputes: [],
  selectedDispute: null,
  submissionPermission: null,
  merchantEvidenceItems: [],
  currentAnalysis: null,
  uploadedFile: null, // { filename, mimeType, base64 }
};

// Official PayPal Evidence Types
const PAYPAL_EVIDENCE_TYPES = [
  'PROOF_OF_FULFILLMENT',
  'PROOF_OF_REFUND',
  'PROOF_OF_DELIVERY_SIGNATURE',
  'PROOF_OF_RECEIPT_COPY',
  'RETURN_POLICY',
  'ITEM_DESCRIPTION',
  'COPY_OF_CONTRACT',
  'PROOF_OF_RESHIPMENT',
  'PROOF_OF_DAMAGE',
  'THIRDPARTY_PROOF_FOR_DAMAGE_OR_SIGNIFICANT_DIFFERENCE',
  'DECLARATION',
  'PROOF_OF_MISSING_ITEMS',
  'PROOF_OF_EMPTY_PACKAGE_OR_DIFFERENT_ITEM',
  'BILLING_AGREEMENT',
  'ADDITIONAL_TRACKING_INFORMATION',
  'CUSTOMS_DOCUMENT',
  'POLICE_REPORT',
  'MERCHANT_RESPONSE',
  'CUSTOMER_COMMUNICATION',
  'TERMS_AND_CONDITIONS',
  'OTHER',
];

// DOM Element Selectors
const el = {
  envBadge: document.getElementById('envBadge'),
  envBadgeText: document.getElementById('envBadgeText'),
  aiBadge: document.getElementById('aiBadge'),
  aiBadgeText: document.getElementById('aiBadgeText'),
  simulationBanner: document.getElementById('simulationBanner'),

  // Views
  dashboardView: document.getElementById('dashboardView'),
  workspaceView: document.getElementById('workspaceView'),

  // Dashboard Metrics
  metricTotal: document.getElementById('metricTotal'),
  metricWaiting: document.getElementById('metricWaiting'),
  metricUnderReview: document.getElementById('metricUnderReview'),
  metricDeadlines: document.getElementById('metricDeadlines'),
  disputesTableBody: document.getElementById('disputesTableBody'),
  btnRefreshDisputes: document.getElementById('btnRefreshDisputes'),

  // Workspace
  btnBackToDashboard: document.getElementById('btnBackToDashboard'),
  wsDisputeId: document.getElementById('wsDisputeId'),
  wsSimTag: document.getElementById('wsSimTag'),
  wsReasonTitle: document.getElementById('wsReasonTitle'),
  wsReasonCode: document.getElementById('wsReasonCode'),
  wsAmount: document.getElementById('wsAmount'),
  wsStatusBadge: document.getElementById('wsStatusBadge'),
  wsStageBadge: document.getElementById('wsStageBadge'),
  wsDueDate: document.getElementById('wsDueDate'),
  wsSubmissionPermitted: document.getElementById('wsSubmissionPermitted'),

  // Transaction details
  wsBuyerName: document.getElementById('wsBuyerName'),
  wsBuyerEmail: document.getElementById('wsBuyerEmail'),
  wsBuyerTxId: document.getElementById('wsBuyerTxId'),
  wsItemName: document.getElementById('wsItemName'),
  wsItemDesc: document.getElementById('wsItemDesc'),
  wsMessagesContainer: document.getElementById('wsMessagesContainer'),

  // Evidence list
  evidenceList: document.getElementById('evidenceList'),
  btnOpenAddEvidence: document.getElementById('btnOpenAddEvidence'),
  addEvidenceModal: document.getElementById('addEvidenceModal'),
  btnCloseEvidenceModal: document.getElementById('btnCloseEvidenceModal'),
  btnCancelAddEvidence: document.getElementById('btnCancelAddEvidence'),
  btnSaveEvidence: document.getElementById('btnSaveEvidence'),
  evInputTitle: document.getElementById('evInputTitle'),
  evInputType: document.getElementById('evInputType'),
  evInputContent: document.getElementById('evInputContent'),
  evInputFile: document.getElementById('evInputFile'),
  fileValidationNotice: document.getElementById('fileValidationNotice'),

  // AI Copilot
  btnRunAiAnalysis: document.getElementById('btnRunAiAnalysis'),
  btnRunAiText: document.getElementById('btnRunAiText'),
  aiEmptyState: document.getElementById('aiEmptyState'),
  aiOutputContainer: document.getElementById('aiOutputContainer'),
  aiReadinessScore: document.getElementById('aiReadinessScore'),
  aiProgressBar: document.getElementById('aiProgressBar'),
  aiReadinessExplanation: document.getElementById('aiReadinessExplanation'),
  aiChecklistItems: document.getElementById('aiChecklistItems'),
  aiContradictionsBox: document.getElementById('aiContradictionsBox'),
  aiContradictionsList: document.getElementById('aiContradictionsList'),
  aiUnsupportedClaimsBox: document.getElementById('aiUnsupportedClaimsBox'),
  aiUnsupportedClaimsList: document.getElementById('aiUnsupportedClaimsList'),
  aiRelevantCount: document.getElementById('aiRelevantCount'),
  aiRelevantList: document.getElementById('aiRelevantList'),
  aiMissingCount: document.getElementById('aiMissingCount'),
  aiMissingList: document.getElementById('aiMissingList'),
  aiActionsList: document.getElementById('aiActionsList'),

  // Response Review & Submission Gate
  wsResponseNotes: document.getElementById('wsResponseNotes'),
  charCount: document.getElementById('charCount'),
  charCountWarning: document.getElementById('charCountWarning'),
  citedSourcesPills: document.getElementById('citedSourcesPills'),
  chkMerchantApproval: document.getElementById('chkMerchantApproval'),
  submissionWarningMsg: document.getElementById('submissionWarningMsg'),
  btnSubmitEvidence: document.getElementById('btnSubmitEvidence'),
  submissionOutcomeBox: document.getElementById('submissionOutcomeBox'),
  submissionOutcomeTitle: document.getElementById('submissionOutcomeTitle'),
  submissionOutcomeBody: document.getElementById('submissionOutcomeBody'),
  assessmentHistoryList: document.getElementById('assessmentHistoryList'),
};

// Initialize Application
async function init() {
  populateEvidenceTypeDropdown();
  bindEvents();
  await checkHealth();
  await loadDisputes();
}

// Populate evidence type select
function populateEvidenceTypeDropdown() {
  el.evInputType.innerHTML = '';
  PAYPAL_EVIDENCE_TYPES.forEach((type) => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    el.evInputType.appendChild(opt);
  });
}

// Event Bindings
function bindEvents() {
  el.btnRefreshDisputes.addEventListener('click', loadDisputes);
  el.btnBackToDashboard.addEventListener('click', showDashboard);

  // Modal events
  el.btnOpenAddEvidence.addEventListener('click', () => {
    el.addEvidenceModal.style.display = 'flex';
  });
  el.btnCloseEvidenceModal.addEventListener('click', () => {
    el.addEvidenceModal.style.display = 'none';
  });
  el.btnCancelAddEvidence.addEventListener('click', () => {
    el.addEvidenceModal.style.display = 'none';
  });
  el.btnSaveEvidence.addEventListener('click', handleSaveMerchantEvidence);

  // File input change
  el.evInputFile.addEventListener('change', handleFileSelected);

  // AI Analysis Trigger
  el.btnRunAiAnalysis.addEventListener('click', runAiAnalysis);

  // Notes Character Counter & Limit
  el.wsResponseNotes.addEventListener('input', () => {
    const len = el.wsResponseNotes.value.length;
    el.charCount.textContent = len;
    if (len >= 2000) {
      el.charCountWarning.style.display = 'block';
    } else {
      el.charCountWarning.style.display = 'none';
    }
  });

  // Approval Checkbox
  el.chkMerchantApproval.addEventListener('change', updateSubmissionButtonState);

  // Submit Evidence Button
  el.btnSubmitEvidence.addEventListener('click', submitEvidencePackage);
}

// Check Health & Environment
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    state.health = data;

    if (data.live_paypal_configured) {
      el.envBadge.className = 'badge badge-live';
      el.envBadgeText.textContent = 'PAYPAL: LIVE SANDBOX';
      el.simulationBanner.style.display = 'none';
    } else {
      el.envBadge.className = 'badge badge-sim';
      el.envBadgeText.textContent = 'PAYPAL: SIMULATION';
      el.simulationBanner.style.display = 'flex';
    }

    if (data.ai_key_configured) {
      el.aiBadge.className = 'badge badge-live';
      el.aiBadgeText.textContent = `AI: ${data.ai_provider.toUpperCase()} (LIVE)`;
    } else {
      el.aiBadge.className = 'badge badge-sim';
      el.aiBadgeText.textContent = 'AI: DEMO ENGINE';
    }
  } catch (err) {
    console.error('Failed to check health:', err);
  }
}

// Load Disputes List
async function loadDisputes() {
  el.disputesTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Refreshing disputes from ledger...</td></tr>`;
  try {
    const res = await fetch('/api/disputes');
    const data = await res.json();
    state.disputes = data.items || [];
    renderDashboardMetrics();
    renderDisputesTable();
  } catch (err) {
    el.disputesTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-rose">Error loading disputes: ${err.message}</td></tr>`;
  }
}

// Render Dashboard Metrics
function renderDashboardMetrics() {
  const items = state.disputes;
  const waiting = items.filter((d) => d.status === 'WAITING_FOR_SELLER_RESPONSE').length;
  const review = items.filter((d) => d.status === 'UNDER_REVIEW').length;

  const now = new Date();
  const impending = items.filter((d) => {
    if (!d.seller_response_due_date) return false;
    const due = new Date(d.seller_response_due_date);
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 7;
  }).length;

  el.metricTotal.textContent = items.length;
  el.metricWaiting.textContent = waiting;
  el.metricUnderReview.textContent = review;
  el.metricDeadlines.textContent = impending;
}

// Render Disputes Table
function renderDisputesTable() {
  if (state.disputes.length === 0) {
    el.disputesTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No disputes found.</td></tr>`;
    return;
  }

  el.disputesTableBody.innerHTML = '';
  state.disputes.forEach((d) => {
    const tr = document.createElement('tr');

    let statusBadge = '<span class="badge badge-neutral">OPEN</span>';
    if (d.status === 'WAITING_FOR_SELLER_RESPONSE') {
      statusBadge = '<span class="badge badge-waiting">WAITING SELLER</span>';
    } else if (d.status === 'UNDER_REVIEW') {
      statusBadge = '<span class="badge badge-review">UNDER REVIEW</span>';
    } else if (d.status === 'RESOLVED') {
      statusBadge = '<span class="badge badge-resolved">RESOLVED</span>';
    }

    const hasProvideEvidence = d.links?.some((l) => l.rel === 'provide-evidence');
    const actionAvailable = hasProvideEvidence
      ? '<span class="text-amber font-semibold text-xs">PROVIDE EVIDENCE</span>'
      : '<span class="text-muted text-xs">VIEW ONLY</span>';

    let dueText = 'None';
    if (d.seller_response_due_date) {
      const dueDate = new Date(d.seller_response_due_date);
      dueText = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const simTag = d.is_simulation ? '<span class="badge badge-sim-sm ml-1">SIM</span>' : '';

    tr.innerHTML = `
      <td class="font-mono font-semibold">${d.dispute_id} ${simTag}</td>
      <td>
        <div class="font-semibold">${formatReasonTitle(d.reason)}</div>
        <div class="font-mono text-xs text-muted">${d.reason}</div>
      </td>
      <td>${d.disputed_transactions?.[0]?.buyer?.name || 'Customer'}</td>
      <td class="font-semibold text-emerald">${d.dispute_amount.value} ${d.dispute_amount.currency_code}</td>
      <td>${statusBadge}</td>
      <td><span class="badge badge-neutral text-xs">${d.dispute_life_cycle_stage || 'INQUIRY'}</span></td>
      <td class="font-mono text-xs">${dueText}</td>
      <td>${actionAvailable}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="openDisputeWorkspace('${d.dispute_id}')">
          Open Case
        </button>
      </td>
    `;
    el.disputesTableBody.appendChild(tr);
  });
}

function formatReasonTitle(reason) {
  const map = {
    MERCHANDISE_OR_SERVICE_NOT_RECEIVED: 'Item Not Received (INR)',
    MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: 'Not As Described (SNAD)',
    UNAUTHORISED: 'Unauthorized / Fraud',
    CREDIT_NOT_PROCESSED: 'Credit Not Processed',
    DUPLICATE_TRANSACTION: 'Duplicate Billing',
    INCORRECT_AMOUNT: 'Incorrect Amount',
    PAYMENT_BY_OTHER_MEANS: 'Paid Other Means',
    CANCELED_RECURRING_BILLING: 'Canceled Subscription',
    PROBLEM_WITH_REPLACEMENT: 'Problem with Replacement',
    OTHER: 'General Dispute',
  };
  return map[reason] || reason;
}

// Switch to Workspace
window.openDisputeWorkspace = async function(disputeId) {
  try {
    const res = await fetch(`/api/disputes/${disputeId}`);
    const data = await res.json();
    state.selectedDispute = data.dispute;
    state.submissionPermission = data.submission_permission;
    state.merchantEvidenceItems = [];
    state.currentAnalysis = null;
    state.uploadedFile = null;

    renderWorkspace();
    showWorkspace();
    await loadAssessmentHistory(disputeId);
  } catch (err) {
    alert(`Failed to load dispute details: ${err.message}`);
  }
};

function showDashboard() {
  el.dashboardView.style.display = 'block';
  el.workspaceView.style.display = 'none';
  loadDisputes();
}

function showWorkspace() {
  el.dashboardView.style.display = 'none';
  el.workspaceView.style.display = 'block';
}

// Render Workspace
function renderWorkspace() {
  const d = state.selectedDispute;
  const perm = state.submissionPermission;

  el.wsDisputeId.textContent = d.dispute_id;
  el.wsSimTag.style.display = d.is_simulation ? 'inline-block' : 'none';
  el.wsReasonTitle.textContent = formatReasonTitle(d.reason);
  el.wsReasonCode.textContent = d.reason;
  el.wsAmount.textContent = `$${d.dispute_amount.value} ${d.dispute_amount.currency_code}`;

  // Status Badge
  if (d.status === 'WAITING_FOR_SELLER_RESPONSE') {
    el.wsStatusBadge.className = 'badge badge-waiting';
    el.wsStatusBadge.textContent = 'WAITING FOR SELLER RESPONSE';
  } else if (d.status === 'UNDER_REVIEW') {
    el.wsStatusBadge.className = 'badge badge-review';
    el.wsStatusBadge.textContent = 'UNDER REVIEW';
  } else {
    el.wsStatusBadge.className = 'badge badge-resolved';
    el.wsStatusBadge.textContent = d.status;
  }

  el.wsStageBadge.textContent = d.dispute_life_cycle_stage || 'INQUIRY';
  el.wsDueDate.textContent = d.seller_response_due_date
    ? new Date(d.seller_response_due_date).toLocaleString()
    : 'No deadline specified';

  // HATEOAS permission
  if (perm?.permitted) {
    el.wsSubmissionPermitted.className = 'badge badge-live';
    el.wsSubmissionPermitted.textContent = 'PERMITTED (HATEOAS LINK PRESENT)';
  } else {
    el.wsSubmissionPermitted.className = 'badge badge-neutral';
    el.wsSubmissionPermitted.textContent = `LOCKED (${perm?.reason || 'Status is ' + d.status})`;
  }

  // Transaction Info
  const tx = d.disputed_transactions?.[0];
  el.wsBuyerName.textContent = tx?.buyer?.name || 'Customer';
  el.wsBuyerEmail.textContent = tx?.buyer?.email || 'N/A';
  el.wsBuyerTxId.textContent = tx?.buyer_transaction_id || 'N/A';
  el.wsItemName.textContent = tx?.items?.[0]?.item_name || 'N/A';
  el.wsItemDesc.textContent = tx?.items?.[0]?.item_description || 'No description provided';

  // Customer Messages
  el.wsMessagesContainer.innerHTML = '';
  if (d.messages && d.messages.length > 0) {
    d.messages.forEach((msg) => {
      const div = document.createElement('div');
      div.className = 'message-bubble';
      div.innerHTML = `
        <div class="message-meta">
          <strong>${msg.posted_by}</strong>
          <span>${new Date(msg.time_posted).toLocaleString()}</span>
        </div>
        <div>${escapeHtml(msg.content)}</div>
      `;
      el.wsMessagesContainer.appendChild(div);
    });
  } else {
    el.wsMessagesContainer.innerHTML = `<div class="text-muted text-xs">No buyer messages recorded for this dispute.</div>`;
  }

  // Render Evidence List
  renderEvidenceList();

  // Reset AI panel & Response notes
  el.aiEmptyState.style.display = 'block';
  el.aiOutputContainer.style.display = 'none';
  el.wsResponseNotes.value = '';
  el.charCount.textContent = '0';
  el.chkMerchantApproval.checked = false;
  el.submissionOutcomeBox.style.display = 'none';
  updateSubmissionButtonState();
}

// Render Evidence List (5 Status Taxonomy)
function renderEvidenceList() {
  el.evidenceList.innerHTML = '';
  const d = state.selectedDispute;

  // 1. Existing PayPal Evidence
  if (d.evidences && d.evidences.length > 0) {
    d.evidences.forEach((ev, idx) => {
      const card = document.createElement('div');
      card.className = 'evidence-card-item';

      let statusPill = '<span class="evidence-status-pill status-provided">PROVIDED</span>';
      if (ev.evidence_type === 'PROOF_OF_REFUND' && (!ev.evidence_info?.refund_ids || ev.evidence_info.refund_ids[0]?.startsWith('REF-TEST'))) {
        statusPill = '<span class="evidence-status-pill status-verification">NEEDS VERIFICATION</span>';
      }

      let extra = '';
      if (ev.evidence_info?.tracking_info) {
        const t = ev.evidence_info.tracking_info[0];
        extra = `<div class="font-mono text-xs text-muted">Carrier: ${t.carrier_name} | Tracking: ${t.tracking_number}</div>`;
      } else if (ev.evidence_info?.refund_ids) {
        extra = `<div class="font-mono text-xs text-muted">Refund IDs: ${ev.evidence_info.refund_ids.join(', ')}</div>`;
      }

      card.innerHTML = `
        <div class="evidence-card-header">
          <span class="evidence-card-title">${ev.evidence_type}</span>
          ${statusPill}
        </div>
        <div class="evidence-card-desc">${escapeHtml(ev.notes || 'Evidence item in dispute record')}</div>
        ${extra}
        <div class="text-xs text-muted font-mono">Source ID: src_existing_ev_${idx} (Source: ${ev.source || 'SELLER'})</div>
      `;
      el.evidenceList.appendChild(card);
    });
  }

  // 2. Merchant Added Evidence
  state.merchantEvidenceItems.forEach((mItem) => {
    const card = document.createElement('div');
    card.className = 'evidence-card-item';
    const fileTag = mItem.file ? `<div class="text-xs text-emerald mt-1 font-mono">Attached: ${mItem.file.filename} (${mItem.file.mimeType})</div>` : '';

    card.innerHTML = `
      <div class="evidence-card-header">
        <span class="evidence-card-title">${escapeHtml(mItem.title)}</span>
        <span class="evidence-status-pill status-provided">PROVIDED (MERCHANT)</span>
      </div>
      <div class="text-xs text-indigo font-mono">Target Enum: ${mItem.type}</div>
      <div class="evidence-card-desc">${escapeHtml(mItem.content)}</div>
      ${fileTag}
      <div class="text-xs text-muted font-mono">Source ID: ${mItem.id}</div>
    `;
    el.evidenceList.appendChild(card);
  });

  if (d.evidences?.length === 0 && state.merchantEvidenceItems.length === 0) {
    el.evidenceList.innerHTML = `<div class="text-muted text-xs">No evidence items attached yet. Click "+ Add Evidence" to attach documents.</div>`;
  }
}

// File Selection Handler with Strict Validation
function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) {
    state.uploadedFile = null;
    return;
  }

  // 10 MB limit check
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    alert(`File is ${(file.size / 1024 / 1024).toFixed(2)} MB. Official PayPal limit is 10 MB per file.`);
    e.target.value = '';
    state.uploadedFile = null;
    return;
  }

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowed.includes(file.type.toLowerCase())) {
    alert(`File type '${file.type}' is not supported. Allowed: .pdf, .jpg, .png, .gif.`);
    e.target.value = '';
    state.uploadedFile = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    state.uploadedFile = {
      filename: file.name,
      mimeType: file.type,
      base64,
    };
    el.fileValidationNotice.textContent = `Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Validated`;
    el.fileValidationNotice.className = 'text-xs text-emerald mt-1 font-semibold';
  };
  reader.readAsDataURL(file);
}

// Save Merchant Evidence
function handleSaveMerchantEvidence() {
  const title = el.evInputTitle.value.trim();
  const type = el.evInputType.value;
  const content = el.evInputContent.value.trim();

  if (!title || !content) {
    alert('Please enter both a title and content for this evidence item.');
    return;
  }

  const newItem = {
    id: `src_merchant_item_${Date.now()}`,
    title,
    type,
    content,
    file: state.uploadedFile,
  };

  state.merchantEvidenceItems.push(newItem);

  // Reset form
  el.evInputTitle.value = '';
  el.evInputContent.value = '';
  el.evInputFile.value = '';
  state.uploadedFile = null;
  el.fileValidationNotice.textContent = 'Official limits: .pdf, .jpg, .png, .gif up to 10MB';
  el.fileValidationNotice.className = 'text-xs text-muted mt-1';
  el.addEvidenceModal.style.display = 'none';

  renderEvidenceList();
}

// Trigger AI Analysis
async function runAiAnalysis() {
  const d = state.selectedDispute;
  el.btnRunAiAnalysis.disabled = true;
  el.btnRunAiText.textContent = 'Analyzing evidence against PayPal guidelines...';

  try {
    const res = await fetch(`/api/disputes/${d.dispute_id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_items: state.merchantEvidenceItems,
        force_demo: false,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'AI Analysis failed');
    }

    state.currentAnalysis = data.analysis;
    renderAiAnalysisOutput(data.analysis);
    await loadAssessmentHistory(d.dispute_id);
  } catch (err) {
    alert(`AI Analysis error: ${err.message}`);
  } finally {
    el.btnRunAiAnalysis.disabled = false;
    el.btnRunAiText.textContent = 'Re-Analyze with AI';
  }
}

// Render AI Output
function renderAiAnalysisOutput(analysis) {
  el.aiEmptyState.style.display = 'none';
  el.aiOutputContainer.style.display = 'block';

  // Readiness Score
  const score = analysis.evidence_readiness.internal_readiness_score;
  el.aiReadinessScore.textContent = `${score}%`;
  el.aiProgressBar.style.width = `${score}%`;
  el.aiReadinessExplanation.textContent = analysis.evidence_readiness.score_explanation;

  // Checklist
  el.aiChecklistItems.innerHTML = '';
  analysis.evidence_readiness.checklist.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'checklist-row';
    let iconClass = 'check-icon-satisfied';
    let iconSymbol = '✓';

    if (item.status === 'MISSING') {
      iconClass = 'check-icon-missing';
      iconSymbol = '✗';
    } else if (item.status === 'WARNING') {
      iconClass = 'check-icon-warning';
      iconSymbol = '⚠';
    }

    const srcTag = item.source_id ? `<span class="source-pill">${item.source_id}</span>` : '';
    const noteText = item.notes ? `<span class="text-xs text-muted"> — ${escapeHtml(item.notes)}</span>` : '';

    div.innerHTML = `
      <span class="font-bold ${iconClass}">${iconSymbol}</span>
      <span>${escapeHtml(item.item)}</span>
      ${srcTag}
      ${noteText}
    `;
    el.aiChecklistItems.appendChild(div);
  });

  // Contradictions
  if (analysis.contradictions && analysis.contradictions.length > 0) {
    el.aiContradictionsBox.style.display = 'block';
    el.aiContradictionsList.innerHTML = '';
    analysis.contradictions.forEach((c) => {
      const srcPills = c.conflicting_source_ids.map((s) => `<span class="source-pill">${s}</span>`).join(' ');
      const div = document.createElement('div');
      div.className = 'mt-1';
      div.innerHTML = `<strong>[${c.severity}]</strong> ${escapeHtml(c.description)} <div>Sources: ${srcPills}</div>`;
      el.aiContradictionsList.appendChild(div);
    });
  } else {
    el.aiContradictionsBox.style.display = 'none';
  }

  // Unsupported Claims
  if (analysis.unsupported_claims && analysis.unsupported_claims.length > 0) {
    el.aiUnsupportedClaimsBox.style.display = 'block';
    el.aiUnsupportedClaimsList.innerHTML = '';
    analysis.unsupported_claims.forEach((u) => {
      const div = document.createElement('div');
      div.className = 'mt-1';
      div.innerHTML = `<strong>Warning:</strong> ${escapeHtml(u.claim)} — <span class="text-muted">${escapeHtml(u.reason)}</span>`;
      el.aiUnsupportedClaimsList.appendChild(div);
    });
  } else {
    el.aiUnsupportedClaimsBox.style.display = 'none';
  }

  // Relevant Evidence List
  el.aiRelevantCount.textContent = analysis.relevant_evidence.length;
  el.aiRelevantList.innerHTML = '';
  analysis.relevant_evidence.forEach((ev) => {
    const div = document.createElement('div');
    div.className = 'finding-item';
    const tagClass = ev.verification_status === 'VERIFIED' ? 'text-emerald' : 'text-amber';
    div.innerHTML = `
      <div><span class="source-pill">${ev.source_id}</span> <strong>${ev.evidence_type}</strong> <span class="text-xs ${tagClass}">[${ev.verification_status}]</span></div>
      <div class="mt-1">${escapeHtml(ev.finding)}</div>
    `;
    el.aiRelevantList.appendChild(div);
  });

  // Missing Evidence List
  el.aiMissingCount.textContent = analysis.missing_evidence.length;
  el.aiMissingList.innerHTML = '';
  analysis.missing_evidence.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'finding-item';
    const critTag = m.critical_for_defense ? '<span class="badge badge-waiting text-xs">CRITICAL</span>' : '';
    div.innerHTML = `
      <div><strong>${escapeHtml(m.requirement)}</strong> ${critTag}</div>
      <div class="text-xs text-indigo mt-1">Suggested Enum: ${m.suggested_evidence_type}</div>
      <div class="text-xs text-muted mt-1"><a href="${m.reason_guidance_ref}" target="_blank" class="text-indigo">Official PayPal Guidance ↗</a></div>
    `;
    el.aiMissingList.appendChild(div);
  });

  // Recommended Actions
  el.aiActionsList.innerHTML = '';
  analysis.recommended_actions.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'action-row';
    const prioClass = `priority-${a.priority.toLowerCase()}`;
    div.innerHTML = `
      <div>
        <span>${escapeHtml(a.action)}</span>
        <div class="text-xs text-muted font-mono">Payload Enum: ${a.evidence_type}</div>
      </div>
      <span class="priority-badge ${prioClass}">${a.priority}</span>
    `;
    el.aiActionsList.appendChild(div);
  });

  // Response Notes Draft
  el.wsResponseNotes.value = analysis.response_draft.notes || '';
  el.charCount.textContent = el.wsResponseNotes.value.length;

  // Cited Sources Pills
  el.citedSourcesPills.innerHTML = '';
  if (analysis.response_draft.cited_source_ids && analysis.response_draft.cited_source_ids.length > 0) {
    analysis.response_draft.cited_source_ids.forEach((sid) => {
      const span = document.createElement('span');
      span.className = 'source-pill';
      span.textContent = sid;
      el.citedSourcesPills.appendChild(span);
    });
  } else {
    el.citedSourcesPills.innerHTML = '<span class="text-xs text-muted">No citations.</span>';
  }

  updateSubmissionButtonState();
}

// Update Submission Button State based on Approval & HATEOAS
function updateSubmissionButtonState() {
  const perm = state.submissionPermission;
  const isApproved = el.chkMerchantApproval.checked;
  const notesLength = el.wsResponseNotes.value.trim().length;

  if (!perm?.permitted) {
    el.btnSubmitEvidence.disabled = true;
    el.submissionWarningMsg.textContent = `Submission Locked: ${perm?.reason || 'Dispute is not in WAITING_FOR_SELLER_RESPONSE'}`;
    el.submissionWarningMsg.className = 'submission-notice text-amber';
    return;
  }

  if (notesLength === 0) {
    el.btnSubmitEvidence.disabled = true;
    el.submissionWarningMsg.textContent = 'Please provide defense notes before submitting.';
    el.submissionWarningMsg.className = 'submission-notice text-muted';
    return;
  }

  if (notesLength > 2000) {
    el.btnSubmitEvidence.disabled = true;
    el.submissionWarningMsg.textContent = `Notes length (${notesLength}) exceeds PayPal's 2000-character limit.`;
    el.submissionWarningMsg.className = 'submission-notice text-rose font-semibold';
    return;
  }

  if (!isApproved) {
    el.btnSubmitEvidence.disabled = true;
    el.submissionWarningMsg.textContent = 'Merchant authorization required (check box above).';
    el.submissionWarningMsg.className = 'submission-notice text-amber';
    return;
  }

  // All checks passed!
  el.btnSubmitEvidence.disabled = false;
  el.submissionWarningMsg.textContent = 'Ready to submit evidence package to PayPal.';
  el.submissionWarningMsg.className = 'submission-notice text-emerald font-semibold';
}

// Submit Evidence Package
async function submitEvidencePackage() {
  const d = state.selectedDispute;
  const notes = el.wsResponseNotes.value.trim();

  if (!el.chkMerchantApproval.checked) {
    alert('Merchant approval is strictly required before submission.');
    return;
  }

  if (notes.length > 2000) {
    alert(`Notes are ${notes.length} characters. Maximum allowed by PayPal is 2000.`);
    return;
  }

  el.btnSubmitEvidence.disabled = true;
  el.btnSubmitEvidence.textContent = 'Submitting to PayPal Disputes API...';

  // Build payload
  const primaryEvidenceType = state.currentAnalysis?.recommended_actions?.[0]?.evidence_type || 'OTHER';
  const evidencePayload = {
    evidences: [
      {
        evidence_type: primaryEvidenceType,
        notes: notes,
      },
    ],
  };

  // Check if we have tracking info to attach in payload
  const existingTracking = d.evidences?.find((e) => e.evidence_info?.tracking_info);
  if (existingTracking?.evidence_info?.tracking_info) {
    evidencePayload.evidences[0].evidence_info = {
      tracking_info: existingTracking.evidence_info.tracking_info,
    };
  }

  // Check for uploaded file from merchant items
  const attachedFileItem = state.merchantEvidenceItems.find((m) => m.file);
  const fileToSubmit = attachedFileItem?.file || null;

  try {
    const res = await fetch(`/api/disputes/${d.dispute_id}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_approved: true,
        evidence_payload: evidencePayload,
        file: fileToSubmit,
        force_simulation: false,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Submission failed');
    }

    // Display Outcome
    el.submissionOutcomeBox.style.display = 'block';
    if (data.is_simulation) {
      el.submissionOutcomeBox.className = 'alert-box alert-warning';
      el.submissionOutcomeTitle.textContent = 'Evidence Recorded in Local Simulation (SIMULATION)';
      el.submissionOutcomeBody.innerHTML = `
        <div><strong>SIMULATION:</strong> Evidence successfully verified and recorded into fixture. Status transitioned to <code>${data.updated_dispute.status}</code>.</div>
        <div class="text-xs mt-1 text-muted">Per Hackathon rules, because live sandbox credentials were not present, this was NOT executed against live PayPal servers.</div>
      `;
    } else {
      el.submissionOutcomeBox.className = 'alert-box alert-success';
      el.submissionOutcomeTitle.textContent = 'Live PayPal Sandbox Evidence Submitted Successfully!';
      el.submissionOutcomeBody.innerHTML = `
        <div>Evidence was accepted by PayPal sandbox API (200 OK). Dispute status updated to <code>${data.updated_dispute.status}</code>.</div>
      `;
    }

    // Update dispute state with refreshed data
    state.selectedDispute = data.updated_dispute;
    state.submissionPermission = {
      permitted: false,
      reason: `Dispute status updated to '${data.updated_dispute.status}'. provide-evidence link revoked.`,
    };

    // Re-render
    renderWorkspace();
    el.submissionOutcomeBox.style.display = 'block'; // ensure still visible
  } catch (err) {
    alert(`Evidence submission error: ${err.message}`);
    el.btnSubmitEvidence.disabled = false;
    el.btnSubmitEvidence.textContent = 'Submit Defense to PayPal';
  }
}

// Load Assessment History
async function loadAssessmentHistory(disputeId) {
  try {
    const res = await fetch(`/api/disputes/${disputeId}/history`);
    const data = await res.json();
    el.assessmentHistoryList.innerHTML = '';

    if (data.items && data.items.length > 0) {
      data.items.forEach((h) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <div class="history-item-header">
            <strong>Readiness: ${h.readiness_score}%</strong>
            <span>${new Date(h.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="text-xs text-muted">Provider: ${h.provider}</div>
          <div class="text-xs mt-1 font-mono">${escapeHtml(h.draft_notes.slice(0, 90))}...</div>
        `;
        el.assessmentHistoryList.appendChild(div);
      });
    } else {
      el.assessmentHistoryList.innerHTML = '<span class="text-muted text-xs">No prior assessments for this case.</span>';
    }
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m]));
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', init);
