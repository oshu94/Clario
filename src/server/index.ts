/**
 * Clario Server — Full-Stack HTTP API & Web Application
 * 
 * Implements:
 * - REST API for Dispute Listing, Details, AI Analysis, and Evidence Submission
 * - Strict Security: Secrets stay server-side, never exposed to client
 * - Explicit Merchant Approval Enforcement
 * - 2000-character Notes Limit & 10MB File Validation
 * - Serves Interactive Web UI
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import {
  fetchDisputes,
  fetchDisputeDetails,
  submitDisputeEvidence,
  isLivePayPalConfigured,
  checkEvidenceSubmissionPermitted,
} from '../lib/dispute-service.ts';
import { analyzeDisputeEvidence, type InputSource } from '../lib/ai-service.ts';
import type { MerchantEvidenceItem } from '../lib/ai-schema.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);

interface AssessmentHistoryItem {
  id: string;
  dispute_id: string;
  timestamp: string;
  summary: string;
  readiness_score: number;
  draft_notes: string;
  provider: string;
}

const ASSESSMENT_HISTORY: AssessmentHistoryItem[] = [];

// Helper to parse JSON body
function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 15MB limit for raw bodies
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string, code?: string) {
  sendJson(res, status, { error: message, code: code || 'ERROR', success: false });
}

// Request dispatcher
export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // --- API ROUTES ---

  // Health check & System state
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'UP',
      live_paypal_configured: isLivePayPalConfigured(),
      ai_provider: process.env.AI_PROVIDER || 'gemini',
      ai_key_configured: Boolean(process.env.AI_API_KEY?.trim()),
      timestamp: new Date().toISOString(),
    });
  }

  // List disputes
  if (pathname === '/api/disputes' && method === 'GET') {
    try {
      const disputes = await fetchDisputes();
      return sendJson(res, 200, disputes);
    } catch (err: any) {
      return sendError(res, 500, err.message, 'LIST_DISPUTES_FAILED');
    }
  }

  // Get single dispute details
  const disputeDetailsMatch = pathname.match(/^\/api\/disputes\/([A-Za-z0-9_-]+)$/);
  if (disputeDetailsMatch && method === 'GET') {
    const disputeId = disputeDetailsMatch[1];
    try {
      const dispute = await fetchDisputeDetails(disputeId);
      const permCheck = checkEvidenceSubmissionPermitted(dispute);
      return sendJson(res, 200, {
        dispute,
        submission_permission: permCheck,
      });
    } catch (err: any) {
      return sendError(res, 404, err.message, 'DISPUTE_NOT_FOUND');
    }
  }

  // AI Evidence Analysis
  const analyzeMatch = pathname.match(/^\/api\/disputes\/([A-Za-z0-9_-]+)\/analyze$/);
  if (analyzeMatch && method === 'POST') {
    const disputeId = analyzeMatch[1];
    try {
      const body = await parseJsonBody(req);
      const dispute = await fetchDisputeDetails(disputeId);
      const merchantItems: MerchantEvidenceItem[] = body.merchant_items || [];
      const forceDemo = body.force_demo === true;

      const analysis = await analyzeDisputeEvidence({
        dispute,
        merchantItems,
        forceDemo,
      });

      // Record in assessment history
      ASSESSMENT_HISTORY.unshift({
        id: `assessment_${Date.now()}`,
        dispute_id: disputeId,
        timestamp: analysis.timestamp,
        summary: analysis.dispute_summary,
        readiness_score: analysis.evidence_readiness.internal_readiness_score,
        draft_notes: analysis.response_draft.notes,
        provider: analysis.ai_provider,
      });

      return sendJson(res, 200, {
        success: true,
        analysis,
      });
    } catch (err: any) {
      return sendError(res, 400, err.message, 'ANALYSIS_FAILED');
    }
  }

  // Submit Evidence
  const submitEvidenceMatch = pathname.match(/^\/api\/disputes\/([A-Za-z0-9_-]+)\/evidence$/);
  if (submitEvidenceMatch && method === 'POST') {
    const disputeId = submitEvidenceMatch[1];
    try {
      const body = await parseJsonBody(req);

      // 1. Mandatory Merchant Approval Check
      if (!body.merchant_approved) {
        return sendError(
          res,
          403,
          'Explicit merchant approval is required before evidence can be submitted to PayPal.',
          'MERCHANT_APPROVAL_REQUIRED'
        );
      }

      // 2. Validate payload structure
      if (!body.evidence_payload || !Array.isArray(body.evidence_payload.evidences)) {
        return sendError(res, 400, 'Invalid evidence payload format.', 'INVALID_PAYLOAD');
      }

      // 3. Validate notes length (strictly <= 2000 chars)
      for (const ev of body.evidence_payload.evidences) {
        if (ev.notes && ev.notes.length > 2000) {
          return sendError(
            res,
            400,
            `Notes length (${ev.notes.length}) exceeds maximum allowed PayPal limit of 2000 characters.`,
            'NOTES_LENGTH_EXCEEDED'
          );
        }
      }

      // 4. File handling (if base64 file provided)
      let fileData: { filename: string; mimeType: string; buffer: Buffer } | undefined;
      if (body.file) {
        const { filename, mimeType, base64 } = body.file;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes((mimeType || '').toLowerCase())) {
          return sendError(
            res,
            400,
            `Unsupported file type '${mimeType}'. Allowed: .jpg, .png, .gif, .pdf.`,
            'UNSUPPORTED_FILE_TYPE'
          );
        }
        const buffer = Buffer.from(base64, 'base64');
        if (buffer.length > 10 * 1024 * 1024) {
          return sendError(
            res,
            400,
            `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds PayPal limit of 10 MB.`,
            'FILE_TOO_LARGE'
          );
        }
        fileData = { filename, mimeType, buffer };
      }

      // 5. Submit through dispute service
      const submissionResult = await submitDisputeEvidence(
        disputeId,
        body.evidence_payload,
        fileData,
        {
          merchantApproved: true,
          forceSimulation: body.force_simulation === true,
        }
      );

      // Re-fetch updated dispute details to return current state
      const updatedDispute = await fetchDisputeDetails(disputeId);

      return sendJson(res, 200, {
        success: true,
        is_simulation: submissionResult.is_simulation,
        result: submissionResult.data,
        updated_dispute: updatedDispute,
      });
    } catch (err: any) {
      return sendError(res, 400, err.message, 'SUBMISSION_FAILED');
    }
  }

  // Get assessment history
  const historyMatch = pathname.match(/^\/api\/disputes\/([A-Za-z0-9_-]+)\/history$/);
  if (historyMatch && method === 'GET') {
    const disputeId = historyMatch[1];
    const items = ASSESSMENT_HISTORY.filter((h) => h.dispute_id === disputeId);
    return sendJson(res, 200, { items });
  }

  // --- STATIC ASSETS & WEB APP ---
  let filePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const fullPath = resolve(process.cwd(), 'public', filePath);

  if (existsSync(fullPath)) {
    const ext = extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    try {
      const content = readFileSync(fullPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    } catch {
      // ignore
    }
  }

  // Fallback 404
  sendError(res, 404, `Route ${method} ${pathname} not found.`);
}

export const server = createServer(handleRequest);

export function startServer(port = PORT, host = '127.0.0.1'): Promise<number> {
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      console.log(`\n================================================================`);
      console.log(`   Clario — AI PayPal Dispute Evidence Copilot            `);
      console.log(`================================================================`);
      console.log(` Server running at: http://localhost:${port}`);
      console.log(` Live PayPal Sandbox Configured: ${isLivePayPalConfigured() ? 'YES' : 'NO (SIMULATION active)'}`);
      console.log(` AI Provider: ${process.env.AI_PROVIDER || 'gemini'} (Key Configured: ${Boolean(process.env.AI_API_KEY?.trim()) ? 'YES' : 'NO [DEMO fallback]'})`);
      console.log(`================================================================\n`);
      resolve(port);
    });
  });
}

// Auto-start if run directly

// Auto-start if run directly
const entryPath = process.argv[1]?.replace(/\\/g, '/');

if (
  entryPath?.endsWith('/src/server/index.ts') ||
  entryPath?.endsWith('/src/server/index.js')
) {
  startServer().catch((err) => {
    console.error('Server startup failed:', err);
    process.exit(1);
  });
}
