const INCOME_TYPES = new Set(['INCOME', 'TRANSFER', 'PARENT_CONTRIB']);
const EXPENSE_TYPES = new Set(['EXPENSE', 'PARENT_REPAY']);

export const isIncomeCategory = (category) =>
    category && INCOME_TYPES.has(category.type);

export const isExpenseCategory = (category) =>
    category && EXPENSE_TYPES.has(category.type);

/** 輸入框只保留正數 */
export const sanitizePositiveAmount = (value) => {
    if (!value && value !== 0) return '';
    const str = String(value).replace(/^-/, '');
    return str;
};

/** 提交時依類別轉為帶正負號的實際金額 */
export const toSignedAmount = (positiveAmount, category) => {
    const num = Math.abs(parseFloat(positiveAmount));
    if (!num || !category) return positiveAmount;
    return isExpenseCategory(category) ? -num : num;
};

/** 合併每月轉入與支出資料，供對比圖表使用 */
export const mergeMonthlyData = (transferData = [], expenseData = []) => {
    const monthMap = new Map();

    transferData.forEach(({ month, amount }) => {
        monthMap.set(month, { month, transfer: Number(amount) || 0, expense: 0 });
    });

    expenseData.forEach(({ month, amount }) => {
        const existing = monthMap.get(month) || { month, transfer: 0, expense: 0 };
        existing.expense = Number(amount) || 0;
        monthMap.set(month, existing);
    });

    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
};