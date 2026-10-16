export function formatHkd(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'HK$0.00';
    const formatted = Math.abs(n).toLocaleString('en-HK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return n < 0 ? `-HK$${formatted}` : `HK$${formatted}`;
}

export function formatAxis(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}k`;
    return `${sign}${Math.round(abs)}`;
}

export function todayIso() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function thisYearRange() {
    const year = new Date().getFullYear();
    return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function monthsAgoIso(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
