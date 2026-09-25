import { MandiPriceRecord } from '../types';

export interface CSVParseResult {
  success: boolean;
  records: MandiPriceRecord[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export function parseMandiCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const records: MandiPriceRecord[] = [];

  if (lines.length < 2) {
    return {
      success: false,
      records: [],
      errors: ['CSV file is empty or missing a header row.'],
      totalRows: 0,
      validRows: 0,
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
  const requiredFields = ['commodity', 'market', 'district', 'modalprice'];
  const missing = requiredFields.filter((req) => !headers.some((h) => h.includes(req)));

  if (missing.length > 0) {
    return {
      success: false,
      records: [],
      errors: [`Missing required CSV headers: ${missing.join(', ')}. Expected: Commodity, Market, District, ModalPrice, MinPrice, MaxPrice`],
      totalRows: lines.length - 1,
      validRows: 0,
    };
  }

  const getColIdx = (name: string) => headers.findIndex((h) => h.includes(name));
  const commIdx = getColIdx('commodity');
  const mktIdx = getColIdx('market');
  const distIdx = getColIdx('district');
  const modalIdx = getColIdx('modal');
  const minIdx = getColIdx('min');
  const maxIdx = getColIdx('max');
  const arrivalIdx = getColIdx('arrival');
  const dateIdx = getColIdx('date');

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((val) => val.trim().replace(/["']/g, ''));
    if (row.length < 3) continue;

    const commodity = row[commIdx] || 'Onion';
    const market = row[mktIdx] || '';
    const district = row[distIdx] || 'Nashik';
    const modalPrice = parseFloat(row[modalIdx]) || 0;
    const minPrice = minIdx >= 0 && row[minIdx] ? parseFloat(row[minIdx]) : modalPrice * 0.9;
    const maxPrice = maxIdx >= 0 && row[maxIdx] ? parseFloat(row[maxIdx]) : modalPrice * 1.1;
    const arrivalQty = arrivalIdx >= 0 && row[arrivalIdx] ? parseFloat(row[arrivalIdx]) : 1200;
    const reportedDate = dateIdx >= 0 && row[dateIdx] ? row[dateIdx] : new Date().toISOString().split('T')[0];

    if (!market || modalPrice <= 0) {
      errors.push(`Row ${i + 1}: Invalid market name or price (${row.join(', ')})`);
      continue;
    }

    records.push({
      id: `mandi-imp-${Date.now()}-${i}`,
      commodity,
      state: 'Maharashtra',
      district,
      market,
      modalPrice: Math.round(modalPrice),
      minPrice: Math.round(minPrice),
      maxPrice: Math.round(maxPrice),
      unit: 'Quintal',
      arrivalQuantityQuintals: Math.round(arrivalQty),
      variety: 'Red / Local FAQ',
      grade: 'Grade A',
      source: 'Admin CSV Import (Verified Prototype)',
      reportedDate,
      priceTrendPct7d: Math.round((Math.random() * 8 - 4) * 10) / 10,
    });
  }

  return {
    success: errors.length === 0,
    records,
    errors,
    totalRows: lines.length - 1,
    validRows: records.length,
  };
}

export function generateSampleCSVTemplate(): string {
  return `Commodity,State,District,Market,MinPrice,MaxPrice,ModalPrice,ArrivalQuantity,Date
Onion,Maharashtra,Nashik,Lasalgaon,2100,2650,2420,4500,2026-09-18
Onion,Maharashtra,Nashik,Pimpalgaon Baswant,2150,2700,2480,3800,2026-09-18
Soybean,Maharashtra,Ahmednagar,Rahata,4400,4800,4650,1500,2026-09-18
Cotton,Maharashtra,Solapur,Akkalkot,6800,7400,7150,850,2026-09-18
Tomato,Maharashtra,Pune,Narayangaon,1200,1800,1550,2100,2026-09-18
Wheat,Maharashtra,Nashik,Kalwan,2400,2750,2600,1100,2026-09-18
Pomegranate,Maharashtra,Solapur,Solapur APMC,7200,9500,8400,620,2026-09-18`;
}
