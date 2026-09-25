export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount)) return '₹0';
  const rounded = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  const intPart = parts[0];
  const decPart = parts[1] ? '.' + parts[1] : '';

  const lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  const formattedInt =
    otherNumbers !== ''
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;

  return '₹' + formattedInt + decPart;
}

export function formatQuantity(quintals: number, unit: 'Quintal' | 'Kg' | 'MT' = 'Quintal'): string {
  if (unit === 'Kg') {
    return `${Math.round(quintals * 100).toLocaleString('en-IN')} Kg`;
  }
  if (unit === 'MT') {
    return `${(quintals / 10).toFixed(1)} MT`;
  }
  return `${Math.round(quintals).toLocaleString('en-IN')} Quintals`;
}

export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return phone;
  const start = cleaned.slice(0, 5);
  const end = cleaned.slice(-2);
  return `+91 ${start} •••${end}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
