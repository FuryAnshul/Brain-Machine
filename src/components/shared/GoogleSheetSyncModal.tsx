'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  Upload,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Link2,
} from 'lucide-react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { GOOGLE_SHEET_URL } from '@/lib/mockData';

const APPS_SCRIPT_SNIPPET = `var SPREADSHEET_ID = "1rGdluueqeQgSswQIsJKcuJtN0_FS8JKs";

function getTargetSheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      return active.getSheetByName("Client Overview") || active.getSheets()[0];
    }
  } catch (e) {}
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName("Client Overview") || ss.getSheets()[0];
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Home Automation CRM Google Apps Script is active"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Lock timeout" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;

    var sheet = getTargetSheet();

    if (action === "add_client") {
      var c = data;
      var newRow = [
        c.clientName || "",
        c.mobileNo || "",
        c.projectName || (c.clientName ? c.clientName + " Residence" : ""),
        c.architectBuilder || "",
        c.referredBy || "",
        c.status || "New",
        c.quotationNo || "",
        Number(c.totalAmount || 0),
        c.lastFollowUpDate || "",
        c.nextFollowUpDate || "",
        c.assignedTo || "Ankit Sir",
        c.result || "Pending",
        "–",
        c.status === "Completed" ? "None" : "Upcoming"
      ];
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Added client: " + c.clientName
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update_client") {
      var c = data;
      var values = sheet.getDataRange().getValues();
      var targetRow = -1;
      var searchName = (c.clientName || "").toString().trim().toLowerCase();

      for (var r = 7; r < values.length; r++) {
        var rowName = (values[r][0] || "").toString().trim().toLowerCase();
        if (rowName === searchName && searchName !== "") {
          targetRow = r + 1;
          break;
        }
      }

      if (targetRow > 0) {
        if (c.mobileNo !== undefined) sheet.getRange(targetRow, 2).setValue(c.mobileNo);
        if (c.projectName !== undefined) sheet.getRange(targetRow, 3).setValue(c.projectName);
        if (c.architectBuilder !== undefined) sheet.getRange(targetRow, 4).setValue(c.architectBuilder);
        if (c.referredBy !== undefined) sheet.getRange(targetRow, 5).setValue(c.referredBy);
        if (c.status !== undefined) sheet.getRange(targetRow, 6).setValue(c.status);
        if (c.quotationNo !== undefined) sheet.getRange(targetRow, 7).setValue(c.quotationNo);
        if (c.totalAmount !== undefined) sheet.getRange(targetRow, 8).setValue(Number(c.totalAmount || 0));
        if (c.lastFollowUpDate !== undefined) sheet.getRange(targetRow, 9).setValue(c.lastFollowUpDate);
        if (c.nextFollowUpDate !== undefined) sheet.getRange(targetRow, 10).setValue(c.nextFollowUpDate);
        if (c.assignedTo !== undefined) sheet.getRange(targetRow, 11).setValue(c.assignedTo);
        if (c.result !== undefined) sheet.getRange(targetRow, 12).setValue(c.result);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Updated client: " + c.clientName
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        sheet.appendRow([
          c.clientName || "", c.mobileNo || "", c.projectName || "", c.architectBuilder || "", c.referredBy || "", c.status || "New", c.quotationNo || "", Number(c.totalAmount || 0), c.lastFollowUpDate || "", c.nextFollowUpDate || "", c.assignedTo || "Ankit Sir", c.result || "Pending", "–", "Upcoming"
        ]);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Appended client: " + c.clientName
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === "sync_all" || action === "batch_sync") {
      var clientList = (data && data.clients) || [];
      var currentValues = sheet.getDataRange().getValues();
      var updatedCount = 0;
      var addedCount = 0;

      for (var i = 0; i < clientList.length; i++) {
        var cl = clientList[i];
        var sName = (cl.clientName || "").toString().trim().toLowerCase();
        var rowIdx = -1;
        for (var r = 7; r < currentValues.length; r++) {
          if ((currentValues[r][0] || "").toString().trim().toLowerCase() === sName && sName !== "") {
            rowIdx = r + 1;
            break;
          }
        }

        if (rowIdx > 0) {
          if (cl.mobileNo) sheet.getRange(rowIdx, 2).setValue(cl.mobileNo);
          if (cl.projectName) sheet.getRange(rowIdx, 3).setValue(cl.projectName);
          if (cl.status) sheet.getRange(rowIdx, 6).setValue(cl.status);
          if (cl.quotationNo) sheet.getRange(rowIdx, 7).setValue(cl.quotationNo);
          if (cl.totalAmount) sheet.getRange(rowIdx, 8).setValue(Number(cl.totalAmount || 0));
          if (cl.nextFollowUpDate) sheet.getRange(rowIdx, 10).setValue(cl.nextFollowUpDate);
          if (cl.assignedTo) sheet.getRange(rowIdx, 11).setValue(cl.assignedTo);
          if (cl.result) sheet.getRange(rowIdx, 12).setValue(cl.result);
          updatedCount++;
        } else if (cl.clientName) {
          sheet.appendRow([
            cl.clientName, cl.mobileNo || "", cl.projectName || "", cl.architectBuilder || "", cl.referredBy || "", cl.status || "New", cl.quotationNo || "", Number(cl.totalAmount || 0), cl.lastFollowUpDate || "", cl.nextFollowUpDate || "", cl.assignedTo || "Ankit Sir", cl.result || "Pending", "–", "Upcoming"
          ]);
          addedCount++;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Synchronized " + (updatedCount + addedCount) + " clients"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSheetSyncModal({ isOpen, onClose }: GoogleSheetSyncModalProps) {
  const {
    clients,
    quotations,
    siteVisits,
    companyExpenses,
    syncFromGoogleSheet,
    syncAllToGoogleSheet,
    isSyncing,
    lastSyncedAt,
    googleSheetWebhookUrl,
    setGoogleSheetWebhookUrl,
  } = useCRMStore();

  const [webhookInput, setWebhookInput] = useState(googleSheetWebhookUrl || '');
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const handleSaveWebhook = () => {
    const trimmed = webhookInput.trim();
    setGoogleSheetWebhookUrl(trimmed);
    setSyncStatus({
      type: 'success',
      message: trimmed
        ? 'Google Apps Script Webhook URL saved! Live 2-way sync is active.'
        : 'Webhook URL cleared. Changes will be saved locally to downloaded_sheet.xlsx.',
    });
  };

  const handlePullFromGoogleSheet = async () => {
    setSyncStatus({ type: 'idle' });
    const result = await syncFromGoogleSheet();
    if (result.success) {
      setSyncStatus({
        type: 'success',
        message: `Successfully synchronized ${result.count} clients from Google Sheets!`,
      });
    } else {
      setSyncStatus({
        type: 'error',
        message: result.error || 'Failed to sync with Google Sheets.',
      });
    }
  };

  const handlePushAllToGoogleSheet = async () => {
    setSyncStatus({ type: 'idle' });
    const result = await syncAllToGoogleSheet();
    if (result.success) {
      setSyncStatus({
        type: 'success',
        message: result.message || 'All clients successfully pushed to Google Sheet!',
      });
    } else {
      setSyncStatus({
        type: 'error',
        message: result.message || 'Failed to push to Google Sheet.',
      });
    }
  };

  const handleCopyScript = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    }
  };

  const formattedLastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not synced yet';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Sheets Live 2-Way Storage & Sync" maxWidth="2xl">
      <div className="space-y-5">
        {/* Connection Header Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Google Sheet Connected
                </h4>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {googleSheetWebhookUrl ? 'Live 2-Way Active' : 'Connected (Auto-save Active)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Home Automation CRM Workbook v5.4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <span>Open Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="/api/sync-google-sheet?download=true"
              download
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all"
              title="Download updated Excel workbook with all additions and edits"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .xlsx</span>
            </a>
          </div>
        </div>

        {/* Dataset Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Clients</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {clients.length}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Quotations</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {quotations.length}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Site Visits</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {siteVisits.length}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Company Expenses</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {companyExpenses.length}
            </p>
          </div>
        </div>

        {/* 2-Way Sync Webhook Configuration */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Google Apps Script Webhook URL (Live Writeback)
              </label>
            </div>
            {googleSheetWebhookUrl ? (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Local Writeback Active
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Every client addition and edit automatically updates the workbook file (<code className="font-mono text-emerald-600 dark:text-emerald-400">downloaded_sheet.xlsx</code>) and cache. To also update your live Google Drive spreadsheet in real time, paste your Google Apps Script Web App URL below:
          </p>

          <div className="flex gap-2">
            <input
              type="url"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveWebhook}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all shrink-0"
            >
              Save URL
            </button>
          </div>

          {/* Toggle Instructions */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowScriptGuide(!showScriptGuide)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{showScriptGuide ? 'Hide Setup Instructions' : 'How to set up Google Apps Script in 2 minutes'}</span>
              {showScriptGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showScriptGuide && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-3 mt-2 animate-in fade-in duration-200">
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="font-bold">Cannot find &quot;Extensions&quot; in Google Sheets menu?</span>
                  <p>
                    Your file is currently opened in <strong>Excel (.XLSX) Mode</strong> (note the blue .XLSX badge at the top). In Excel mode, Google hides the Extensions menu.
                  </p>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Fix: Click <u>File &gt; Save as Google Sheets</u> in your spreadsheet to enable Extensions, OR follow Method 2 below using script.google.com!
                  </p>
                </div>

                <p className="font-bold text-slate-900 dark:text-white pt-1">Setup Instructions:</p>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-blue-600 dark:text-blue-400">Method 1 (From Google Sheets):</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>Open your Google Sheet (<a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium text-blue-500">click here</a>).</li>
                      <li>Click <strong>File &gt; Save as Google Sheets</strong> (if .XLSX badge is shown).</li>
                      <li>Now click <strong>Extensions &gt; Apps Script</strong>.</li>
                      <li>Paste the script below and click <strong>Deploy &gt; New Deployment &gt; Web app</strong> (Access: Anyone).</li>
                    </ol>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Method 2 (Direct via script.google.com - No menu needed):</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium text-blue-500">script.google.com</a> and click <strong>+ New project</strong>.</li>
                      <li>Paste the script below (it automatically links to your Spreadsheet ID).</li>
                      <li>Click <strong>Deploy &gt; New Deployment</strong>, choose <strong>Web app</strong>, set <strong>Who has access: Anyone</strong>, click <strong>Deploy</strong>, and paste the URL above!</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-slate-500">Google Apps Script Code:</span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                >
                  {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script Code'}</span>
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] leading-relaxed select-all">
                {APPS_SCRIPT_SNIPPET}
              </div>
            </div>
          )}
        </div>

        {/* Status notification */}
        {syncStatus.type === 'success' && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncStatus.message}</span>
          </div>
        )}

        {syncStatus.type === 'error' && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* Sync Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Last Synced: <strong className="text-slate-700 dark:text-slate-300">{formattedLastSynced}</strong></span>
          <span>API: <code className="text-blue-500 font-mono">/api/sync-google-sheet</code></span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handlePushAllToGoogleSheet}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all disabled:opacity-50"
              title="Push all client records in CRM to Google Sheet"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Push All to Google Sheet</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromGoogleSheet}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Pull Live from Sheet'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
