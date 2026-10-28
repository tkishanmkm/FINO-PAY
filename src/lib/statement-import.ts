import type { Account, AppData, Transaction } from '@/lib/types';

export interface StatementDetails {
  name: string; customerId: string; address: string; accountNumber: string;
  accountType: 'Savings' | 'Sampann current'; ifsc: string; branchName: string;
  nominee: string; closingBalance: number | null;
}
export interface ParsedStatement { transactions: Transaction[]; details: StatementDetails; }

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (typeof window !== 'undefined') pdfjs.GlobalWorkerOptions.workerSrc = new URL('/pdf.worker.min.mjs', window.location.origin).href;
  return pdfjs;
}
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const amountValue = (s: string): number | null => {
  const v = s.replace(/,/g, '').replace(/^\s*(?:Rs\.?\s*|INR\s*|\u20b9\s*)/i, '').replace(/\s/g, '').trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v); return Number.isFinite(n) ? n : null;
};
function parseDate(s: string): string | null {
  const m = s.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0);
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  return d.toISOString();
}
function joinDescriptionParts(parts: string[]): string {
  return parts.reduce((result, part) => {
    if (!result) return part;
    const prev = result.slice(-1); const first = part.slice(0, 1);
    const lastToken = result.split(/\s+/).pop() || '';
    const join = /[\/_-]$/.test(result) || (/\d$/.test(prev) && /^\d/.test(part)) || (/^[a-z]/.test(first) && /^[A-Z]/.test(lastToken));
    return result + (join ? '' : ' ') + part;
  }, '');
}
function categoryFor(description: string): Transaction['category'] {
  const s = description.toLowerCase();
  if (s.includes('upi')) return 'UPI'; if (s.includes('imps')) return 'IMPS';
  if (/\bcard\b|\bpos\b|\batm\b/.test(s)) return 'Card Payment';
  if (/food|zomato|swiggy|restaurant|paan shop/.test(s)) return 'Food';
  if (/shopping|amazon|flipkart/.test(s)) return 'Shopping';
  if (/rail|irctc|travel/.test(s)) return 'Travel';
  if (/bill|recharge|electric|fee|charge/.test(s)) return 'Bills';
  return 'Other';
}
function valueAfterLabel(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp('(?:^|\\n|\\s)' + label.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\s*[:\\-]?\\s*([^\\n]+)', 'i');
    const m = text.match(re); if (m?.[1]) return clean(m[1]);
  }
  return '';
}

export async function parseFinoStatement(input: ArrayBuffer | Uint8Array): Promise<ParsedStatement> {
  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(input);
  const pdf = await pdfjs.getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false, useWorkerFetch: false }).promise;
  const allText: string[] = [];
  const rawRows: Array<{ page: number; y: number; cells: Array<{ text: string; x: number; y: number }> }> = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo); const content = await page.getTextContent();
    const items = content.items.map((item: any) => {
      if (typeof item.str !== 'string' || !Array.isArray(item.transform)) return null;
      return { text: clean(item.str), x: Number(item.transform[4] || 0), y: Number(item.transform[5] || 0) };
    }).filter((item): item is { text: string; x: number; y: number } => Boolean(item && item.text));
    for (const item of items) allText.push(item.text);
    const rows: Array<{ y: number; cells: typeof items }> = [];
    for (const item of items) {
      let row = rows.find(candidate => Math.abs(candidate.y - item.y) <= 2);
      if (!row) { row = { y: item.y, cells: [] }; rows.push(row); }
      row.cells.push(item);
    }
    rows.sort((a, b) => b.y - a.y).forEach(row => rawRows.push({ page: pageNo, y: row.y, cells: row.cells.sort((a, b) => a.x - b.x) }));
  }
  const text = allText.join('\n');
  const fieldLine = (label: string) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp('(?:^|\\n)' + escaped + ':\\s*([^\\n]+)', 'i'));
    return match?.[1] ? clean(match[1]) : '';
  };
  const accountValues = rawRows.flatMap(row => row.page === 1 ? row.cells.map(cell => ({ ...cell, rowY: row.y })) : []);
  const labelCell = (label: RegExp) => accountValues.find(c => label.test(c.text));
  const valueNear = (pattern: RegExp, xMin: number, xMax: number) => {
    const label = labelCell(pattern); if (!label) return '';
    const value = accountValues.find(c => c.x >= xMin && c.x < xMax && c.rowY < label.rowY && c.rowY >= label.rowY - 30);
    return value?.text || '';
  };
  const details: StatementDetails = {
    name: fieldLine('Name'),
    customerId: valueNear(/^Customer ID$/i, 40, 100),
    address: fieldLine('Address'),
    accountNumber: valueNear(/^A\/c No$/i, 120, 175).replace(/\D/g, ''),
    accountType: /sampann\s+current/i.test(text) || /current\s+account/i.test(text) ? 'Sampann current' : 'Savings',
    ifsc: fieldLine('IFSC'),
    branchName: fieldLine('Branch Address') || fieldLine('Branch Name'),
    nominee: valueNear(/^Nominee$/i, 470, 540),
    closingBalance: null,
  };
  const transactions: Transaction[] = [];
  const dates = rawRows.flatMap(row => {
    const cell = row.cells.find(c => c.x < 85 && parseDate(c.text));
    return cell ? [{ page: row.page, y: row.y, date: parseDate(cell.text)! }] : [];
  }).sort((a, b) => a.page - b.page || b.y - a.y);
  for (let index = 0; index < dates.length; index++) {
    const entry = dates[index];
    const rows = rawRows.filter(r => r.page === entry.page && Math.abs(r.y - entry.y) <= 15);
    const cells = rows.flatMap(r => r.cells);
    const ref = cells.find(c => c.x >= 90 && c.x < 175 && Math.abs(c.y - entry.y) <= 3)?.text || '';
    const desc = clean(joinDescriptionParts(cells.filter(c => c.x >= 190 && c.x < 325).map(c => c.text))); 
    const debit = cells.filter(c => c.x >= 325 && c.x < 400).map(c => amountValue(c.text)).find(v => v !== null);
    const credit = cells.filter(c => c.x >= 400 && c.x < 480).map(c => amountValue(c.text)).find(v => v !== null);
    const balance = cells.filter(c => c.x >= 480).map(c => amountValue(c.text)).find(v => v !== null);
    if (!desc || (!ref && debit === undefined && credit === undefined)) continue;
    const isCredit = credit !== undefined && credit !== null; const value = isCredit ? credit : debit;
    if (value === undefined || value === null) continue;
    transactions.push({ id: ref || `fino-pdf-${entry.page}-${index}-${entry.date.slice(0, 10)}`, date: entry.date,
      description: desc, amount: Math.abs(value), type: isCredit ? 'credit' : 'debit', category: categoryFor(desc),
      balanceAfter: balance !== undefined && balance !== null ? Math.abs(balance) : 0 });
  }
  if (!transactions.length) throw new Error('No transactions were found. This statement may be scanned or use a different table layout.');
  const seen = new Set<string>();
  const unique = transactions.filter(tx => { const key = `${tx.id}|${tx.date}|${tx.amount}|${tx.type}`; if (seen.has(key)) return false; seen.add(key); return true; });
  details.closingBalance = [...unique].reverse().find(tx => tx.balanceAfter > 0)?.balanceAfter ?? null;
  return { transactions: unique, details };
}

export function applyStatementToAppData(current: AppData, parsed: ParsedStatement, mode: 'replace-app' | 'replace-transactions' | 'save-transactions'): AppData {
  const mainIndex = current.accounts.findIndex(a => a.type === 'Savings' || a.type === 'Sampann current');
  const oldMain = current.accounts[mainIndex >= 0 ? mainIndex : 0];
  const mainAccount: Account = {
    ...(oldMain || { id: 'acc_sav_01', currency: 'INR' as const }), id: oldMain?.id || 'acc_sav_01',
    type: parsed.details.accountType, accountNumber: parsed.details.accountNumber || oldMain?.accountNumber || '',
    balance: parsed.details.closingBalance ?? oldMain?.balance ?? 0, currency: 'INR',
    ifsc: parsed.details.ifsc || oldMain?.ifsc, branchName: parsed.details.branchName || oldMain?.branchName,
    nominee: parsed.details.nominee || oldMain?.nominee,
  };
  const transactions = parsed.transactions.map(tx => ({ ...tx }));
  if (mode === 'replace-app') {
    const accounts = [...current.accounts]; if (mainIndex >= 0) accounts[mainIndex] = mainAccount; else accounts.unshift(mainAccount);
    return { ...current,
      user: { ...current.user, name: parsed.details.name || current.user.name,
        customerId: parsed.details.customerId || current.user.customerId,
        contact: { ...current.user.contact, address: parsed.details.address || current.user.contact.address } },
      accounts: [mainAccount], transactions,
      // Keep supplied branding/banners and non-statement app collections intact.
      appSettings: current.appSettings, payees: current.payees, chatMessages: current.chatMessages,
    };
  }
  if (mode === 'replace-transactions') return { ...current, transactions };
  const known = new Set(current.transactions.map(tx => `${tx.id}|${tx.date}|${tx.amount}|${tx.type}`));
  const additions = transactions.filter(tx => !known.has(`${tx.id}|${tx.date}|${tx.amount}|${tx.type}`));
  return { ...current, transactions: [...additions, ...current.transactions] };
}
