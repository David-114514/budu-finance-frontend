// src/utils/categoryHelper.js
export const getCategoryName = (cat, language) => {
    if (!cat) return '';

    const name = cat.name;

    if (language === 'en') {
        if (name.includes('轉入') || name.includes('Transfer')) {
            return 'Transfer to Mortgage Account';
        }
        if (name.includes('支出') || name.includes('Expense')) {
            return 'Mortgage Account Expense';
        }
    }

    return name;
};