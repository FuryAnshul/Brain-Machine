import { FollowUpDueStatus, LeadStatus } from '@/types';

/**
 * Format a number into Indian Rupee notation (Lakhs & Crores)
 * e.g., 1250000 -> ₹12,50,000
 */
export function formatINR(value: number | undefined | null, showSymbol = true): string {
  if (value === undefined || value === null || isNaN(value)) {
    return showSymbol ? '₹0' : '0';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format number in compact Indian notation (e.g. 1.25L, 3.4Cr)
 */
export function formatINRCompact(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '₹0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} k`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Converts date string (YYYY-MM-DD or ISO) to DD/MM/YYYY
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr || '-';
  }
}

/**
 * Normalizes a date to YYYY-MM-DD string
 */
export function toISODateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes Follow-Up Due Status:
 * Overdue: nextFollowUpDate < today && status not in ['Completed', 'Lost']
 * Today: nextFollowUpDate == today
 * Upcoming: nextFollowUpDate > today
 * None: no nextFollowUpDate or completed/lost
 */
export function computeFollowUpDueStatus(
  nextFollowUpDate: string | undefined | null,
  status?: LeadStatus
): FollowUpDueStatus {
  if (!nextFollowUpDate || nextFollowUpDate === '-') return 'None';
  if (status === 'Completed' || status === 'Lost') return 'None';

  const todayStr = toISODateString(new Date());
  const dueDateStr = nextFollowUpDate.split('T')[0];

  if (dueDateStr < todayStr) {
    return 'Overdue';
  } else if (dueDateStr === todayStr) {
    return 'Today';
  } else {
    return 'Upcoming';
  }
}

/**
 * Cleans phone number for Indian mobile dialing / WhatsApp (+91 prefix)
 */
export function cleanMobile(mobile: string | undefined | null): string {
  if (!mobile) return '';
  return mobile.replace(/[^0-9]/g, '');
}

/**
 * WhatsApp chat URL
 */
export function getWhatsAppUrl(mobile: string, message = ''): string {
  const digits = cleanMobile(mobile);
  const formatted = digits.length === 10 ? `91${digits}` : digits;
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${formatted}${message ? `?text=${encodedMsg}` : ''}`;
}

/**
 * Export structured JSON data to CSV and trigger browser download
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename = 'crm-export',
  headersMap?: Record<string, string>
) {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const keys = headersMap ? Object.keys(headersMap) : Object.keys(data[0]);
  const headerLabels = headersMap ? Object.values(headersMap) : keys;

  const csvRows: string[] = [];
  csvRows.push(headerLabels.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const row of data) {
    const values = keys.map((key) => {
      let val = row[key];
      if (val === undefined || val === null) {
        val = '';
      } else if (typeof val === 'number') {
        val = String(val);
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${toISODateString(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
