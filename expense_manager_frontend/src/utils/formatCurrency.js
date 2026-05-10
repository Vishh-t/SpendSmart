// NEW FILE: Utility function to format numbers as Indian currency
export function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "0.00";
    return Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}
