// Shared date formatter — used across RecentExpenses, ExpensesPage, CategoryExpensesModal
export function formatDate(timestamp) {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

export function formatDateUpper(timestamp) {
    if (!timestamp) return "—";
    return formatDate(timestamp).toUpperCase();
}
