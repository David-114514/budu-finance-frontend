const EXPENSE_TYPES = new Set(['EXPENSE', 'PARENT_REPAY']);

export const isExpenseCategory = (category) =>
    !!category && EXPENSE_TYPES.has(category.type || category.categoryType);

export const sanitizePositiveAmount = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/^-/, '');
};

export function fillMonthlyData(rows = [], startDate, endDate) {
    if (!startDate || !endDate || startDate > endDate) return [];
    const map = new Map(rows.map((row) => [row.month, {
        month: row.month,
        transfer: Number(row.transfer) || 0,
        expense: Number(row.expense) || 0,
    }]));

    const [startYear, startMonth] = startDate.slice(0, 7).split('-').map(Number);
    const [endYear, endMonth] = endDate.slice(0, 7).split('-').map(Number);
    const filled = [];
    let year = startYear;
    let month = startMonth;
    while (year < endYear || (year === endYear && month <= endMonth)) {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        filled.push(map.get(key) || { month: key, transfer: 0, expense: 0 });
        month += 1;
        if (month === 13) {
            month = 1;
            year += 1;
        }
    }
    return filled;
}

export function categoryLabel(category, t) {
    const type = category?.type || category?.categoryType;
    if (type === 'EXPENSE' || type === 'PARENT_REPAY') return t('category.expense');
    if (type === 'INCOME') return t('category.income');
    if (type === 'PARENT_CONTRIB') return t('category.parentContrib');
    return t('category.transfer');
}
