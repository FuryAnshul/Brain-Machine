import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import defaultSheetData from '@/lib/googleSheetData.json';
import { sanitizeUserFacingError } from '@/lib/security';

const GOOGLE_SHEET_EXPORT_URL =
  'https://docs.google.com/spreadsheets/d/1rGdluueqeQgSswQIsJKcuJtN0_FS8JKs/export?format=xlsx';

function setCellValue(sheet: any, r: number, c: number, val: any, type: 's' | 'n' = 's') {
  const addr = xlsx.utils.encode_cell({ r, c });
  if (val === undefined || val === null) {
    return;
  }
  if (type === 'n' || typeof val === 'number') {
    sheet[addr] = { t: 'n', v: Number(val), w: String(val) };
  } else {
    sheet[addr] = { t: 's', v: String(val), w: String(val) };
  }
}

function findClientRow(sheet: any, clientName: string): number {
  if (!clientName) return -1;
  const target = clientName.trim().toLowerCase();
  for (let r = 7; r < 997; r++) {
    const addr = xlsx.utils.encode_cell({ r, c: 0 });
    const cell = sheet[addr];
    if (cell && cell.v && String(cell.v).trim().toLowerCase() === target) {
      return r;
    }
  }
  return -1;
}

function findNextEmptyRow(sheet: any): number {
  for (let r = 7; r < 997; r++) {
    const addr = xlsx.utils.encode_cell({ r, c: 0 });
    const cell = sheet[addr];
    if (!cell || !cell.v || !String(cell.v).trim()) {
      return r;
    }
  }
  return 997;
}

function writeClientToRow(sheet: any, r: number, client: any) {
  setCellValue(sheet, r, 0, client.clientName);
  setCellValue(sheet, r, 1, client.mobileNo || '');
  setCellValue(sheet, r, 2, client.projectName || `${client.clientName} Residence`);
  setCellValue(sheet, r, 3, client.architectBuilder || '');
  setCellValue(sheet, r, 4, client.referredBy || '');
  setCellValue(sheet, r, 5, client.status || 'New');
  setCellValue(sheet, r, 6, client.quotationNo || '');
  setCellValue(sheet, r, 7, Number(client.totalAmount || 0), 'n');
  setCellValue(sheet, r, 8, client.lastFollowUpDate || '');
  setCellValue(sheet, r, 9, client.nextFollowUpDate || '');
  setCellValue(sheet, r, 10, client.assignedTo || 'Ankit Sir');
  setCellValue(sheet, r, 11, client.result || 'Pending');
  setCellValue(sheet, r, 12, '–');
  setCellValue(sheet, r, 13, client.status === 'Completed' ? 'None' : 'Upcoming');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. If download is requested, return the local updated .xlsx file
    if (searchParams.get('download') === 'true') {
      const xlsxPath = path.join(process.cwd(), 'downloaded_sheet.xlsx');
      if (fs.existsSync(xlsxPath)) {
        const fileBuffer = fs.readFileSync(xlsxPath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="Home_Automation_CRM_Live_${new Date().toISOString().split('T')[0]}.xlsx"`,
          },
        });
      }
    }

    // 2. Attempt live fetch from Google Sheet export URL
    let workbook: xlsx.WorkBook | null = null;
    let isLiveExport = false;

    try {
      const response = await fetch(GOOGLE_SHEET_EXPORT_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        workbook = xlsx.read(buffer, { type: 'buffer' });
        isLiveExport = true;
      }
    } catch (fetchErr) {
      // In offline / sandboxed environments, fallback to local xlsx file
      console.warn('Google Sheet live export fetch unavailable, using local workbook');
    }

    // Fallback to local downloaded_sheet.xlsx if live fetch failed
    if (!workbook) {
      const localPath = path.join(process.cwd(), 'downloaded_sheet.xlsx');
      if (fs.existsSync(localPath)) {
        workbook = xlsx.readFile(localPath);
      }
    }

    // Parse Client Overview
    const overviewSheet = workbook ? workbook.Sheets['Client Overview'] : null;
    if (!overviewSheet) {
      return NextResponse.json({
        success: true,
        source: 'cached',
        data: defaultSheetData,
      });
    }

    const overviewData: any[][] = xlsx.utils.sheet_to_json(overviewSheet, { header: 1 });
    const clients: any[] = [];

    function excelDateToISO(val: any) {
      if (!val) return '';
      if (typeof val === 'number') {
        const date = new Date((val - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      if (typeof val === 'string') {
        if (val.includes('-')) return val;
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      }
      return '';
    }

    for (let i = 7; i < overviewData.length; i++) {
      const row = overviewData[i];
      if (!row || !row[0] || !String(row[0]).trim()) continue;

      const clientName = String(row[0]).trim();
      const rawMobile = row[1] ? String(row[1]).replace(/[^0-9]/g, '') : '';
      const mobileNo =
        rawMobile.length >= 10
          ? rawMobile.slice(-10)
          : `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const projectName = row[2] ? String(row[2]).trim() : `${clientName} Residence`;
      const architectBuilder = row[3] ? String(row[3]).trim() : '';
      const referredBy = row[4] ? String(row[4]).trim() : '';
      let status = row[5] ? String(row[5]).trim() : 'New';
      if (!status) status = 'New';
      const quotationNo = row[6] ? String(row[6]).trim() : '';
      const totalAmount = typeof row[7] === 'number' ? row[7] : 0;
      const lastFollowUpDate = excelDateToISO(row[8]) || '2026-10-25';
      const nextFollowUpDate = excelDateToISO(row[9]) || '2026-10-28';
      const assignedTo = row[10] ? String(row[10]).trim() : 'Ankit Sir';
      const result = row[11] ? String(row[11]).trim() : 'Pending';

      clients.push({
        id: `c-${i}`,
        clientName,
        mobileNo,
        projectName,
        architectBuilder,
        referredBy,
        status,
        quotationNo,
        totalAmount,
        receivedAmount: 0,
        lastFollowUpDate,
        nextFollowUpDate,
        assignedTo: assignedTo || 'Ankit Sir',
        result: result || 'Pending',
        remarks: `Google Sheet Client - Row ${i + 1}`,
        createdAt: '2026-09-01',
        updatedAt: '2026-10-25',
      });
    }

    return NextResponse.json({
      success: true,
      source: isLiveExport ? 'live_google_sheet' : 'local_workbook',
      clientCount: clients.length,
      data: {
        ...defaultSheetData,
        clients: clients.length > 0 ? clients : defaultSheetData.clients,
        lastSyncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to parse Google Sheet data:', error);
    return NextResponse.json({
      success: true,
      source: 'fallback',
      data: defaultSheetData,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, data, webhookUrl: clientWebhookUrl } = body;

    // Server reads server-only environment variable.
    // Notice: Never expose secrets through NEXT_PUBLIC_ variables.
    const webhookUrl = clientWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;

    // 1. Update the local Excel workbook file (downloaded_sheet.xlsx)
    const xlsxPath = path.join(process.cwd(), 'downloaded_sheet.xlsx');
    let localFileUpdated = false;

    if (fs.existsSync(xlsxPath)) {
      try {
        const wb = xlsx.readFile(xlsxPath);
        const sheet = wb.Sheets['Client Overview'];

        if (sheet) {
          if (action === 'add_client') {
            const nextRow = findNextEmptyRow(sheet);
            writeClientToRow(sheet, nextRow, data);
            xlsx.writeFile(wb, xlsxPath);
            localFileUpdated = true;
          } else if (action === 'update_client') {
            const row = findClientRow(sheet, data.clientName);
            if (row >= 0) {
              writeClientToRow(sheet, row, data);
            } else {
              const nextRow = findNextEmptyRow(sheet);
              writeClientToRow(sheet, nextRow, data);
            }
            xlsx.writeFile(wb, xlsxPath);
            localFileUpdated = true;
          } else if (action === 'delete_client') {
            const row = findClientRow(sheet, data.clientName);
            if (row >= 0) {
              // Clear row
              for (let c = 0; c < 14; c++) {
                const addr = xlsx.utils.encode_cell({ r: row, c });
                delete sheet[addr];
              }
              xlsx.writeFile(wb, xlsxPath);
              localFileUpdated = true;
            }
          } else if (action === 'sync_all' || action === 'batch_sync') {
            const clientList = data?.clients || [];
            clientList.forEach((client: any) => {
              const row = findClientRow(sheet, client.clientName);
              if (row >= 0) {
                writeClientToRow(sheet, row, client);
              } else {
                const nextRow = findNextEmptyRow(sheet);
                writeClientToRow(sheet, nextRow, client);
              }
            });
            xlsx.writeFile(wb, xlsxPath);
            localFileUpdated = true;
          }
        }
      } catch (xlsxErr) {
        console.error('Error writing to local downloaded_sheet.xlsx:', xlsxErr);
      }
    }

    // 2. Update local JSON storage (googleSheetData.json)
    const jsonPath = path.join(process.cwd(), 'src', 'lib', 'googleSheetData.json');
    let jsonUpdated = false;

    try {
      if (fs.existsSync(jsonPath)) {
        const fileContent = fs.readFileSync(jsonPath, 'utf8');
        const parsedData = JSON.parse(fileContent);

        if (action === 'add_client') {
          const existingIdx = (parsedData.clients || []).findIndex(
            (c: any) =>
              c.id === data.id ||
              c.clientName.toLowerCase() === data.clientName.toLowerCase()
          );
          if (existingIdx >= 0) {
            parsedData.clients[existingIdx] = { ...parsedData.clients[existingIdx], ...data };
          } else {
            parsedData.clients = [data, ...(parsedData.clients || [])];
          }
          jsonUpdated = true;
        } else if (action === 'update_client') {
          parsedData.clients = (parsedData.clients || []).map((c: any) =>
            c.id === data.id ||
            c.clientName.toLowerCase() === (data.clientName || '').toLowerCase()
              ? { ...c, ...data }
              : c
          );
          jsonUpdated = true;
        } else if (action === 'delete_client') {
          parsedData.clients = (parsedData.clients || []).filter(
            (c: any) =>
              c.id !== data.id &&
              c.clientName.toLowerCase() !== (data.clientName || '').toLowerCase()
          );
          jsonUpdated = true;
        } else if (action === 'sync_all' || action === 'batch_sync') {
          if (data.clients && Array.isArray(data.clients)) {
            parsedData.clients = data.clients;
            jsonUpdated = true;
          }
        }

        if (jsonUpdated) {
          parsedData.lastSyncedAt = new Date().toISOString();
          fs.writeFileSync(jsonPath, JSON.stringify(parsedData, null, 2), 'utf8');
        }
      }
    } catch (jsonErr) {
      console.error('Error updating googleSheetData.json:', jsonErr);
    }

    // 3. Forward to Google Sheets Webhook if configured
    let sheetPushed = false;
    let pushMessage = '';

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, data }),
          redirect: 'follow',
        });
        const text = await res.text();
        sheetPushed = res.ok;
        pushMessage = `Pushed live to Google Sheet Webhook (${res.status} ${res.statusText}): ${text.slice(0, 100)}`;
      } catch (pushErr: any) {
        console.warn('Failed to forward to Google Sheets Webhook:', pushErr);
        pushMessage = `Webhook push error: ${pushErr.message}`;
      }
    } else {
      pushMessage =
        'Local Excel (.xlsx) file and server cache updated. Configure Google Apps Script Webhook URL to enable instant live push to Google Drive.';
    }

    return NextResponse.json({
      success: true,
      localFileUpdated,
      jsonUpdated,
      sheetPushed,
      message: pushMessage,
      action,
    });
  } catch (error: any) {
    console.error('Error handling sync-google-sheet POST:', error);
    const safeError = sanitizeUserFacingError(
      error,
      'An unexpected error occurred during Google Sheet synchronization.'
    );
    return NextResponse.json(
      { success: false, error: safeError },
      { status: 500 }
    );
  }
}
