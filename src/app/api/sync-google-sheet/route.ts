import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import defaultSheetData from '@/lib/googleSheetData.json';

const GOOGLE_SHEET_EXPORT_URL =
  'https://docs.google.com/spreadsheets/d/1rGdluueqeQgSswQIsJKcuJtN0_FS8JKs/export?format=xlsx';

export async function GET() {
  try {
    // Attempt live fetch from Google Sheet export URL
    const response = await fetch(GOOGLE_SHEET_EXPORT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.warn('Google Sheet fetch returned status', response.status, 'using cached data');
      return NextResponse.json({
        success: true,
        source: 'cached',
        data: defaultSheetData,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // Parse live Client Overview
    const overviewSheet = workbook.Sheets['Client Overview'];
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
        remarks: `Live Google Sheet Client - Row ${i + 1}`,
        createdAt: '2026-09-01',
        updatedAt: '2026-10-25',
      });
    }

    return NextResponse.json({
      success: true,
      source: 'live_google_sheet',
      clientCount: clients.length,
      data: {
        ...defaultSheetData,
        clients: clients.length > 0 ? clients : defaultSheetData.clients,
        lastSyncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to parse Google Sheet live:', error);
    return NextResponse.json({
      success: true,
      source: 'fallback',
      data: defaultSheetData,
    });
  }
}
