import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getExpensesByCategory } from "../../services/expenseService.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

function CategoryExpensesModal({ category, onClose }) {

    const [expenses,  setExpenses]  = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error,     setError]     = useState(null);

    useEffect(() => {
        async function fetchCategoryExpenses() {
            try {
                const data = await getExpensesByCategory(category.id);
                setExpenses(data);
            } catch (err) {
                console.error("❌ Category expenses error:", err.response?.status, err.response?.data);
                setError("No expenses found for this category.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchCategoryExpenses().catch(console.error);
    }, [category.id]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(var(--raw-overlay-bg), 0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl mx-4 rounded-2xl p-6 shadow-2xl"
                style={{
                    backgroundColor: "rgba(var(--raw-modal-bg), 0.95)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(78, 222, 163, 0.15)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-text-primary font-semibold text-lg">{category.name}</h2>
                        <p className="text-text-secondary text-xs mt-0.5">All expenses in this category</p>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-all">
                        <X size={18} />
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-text-secondary text-sm text-center py-8">Loading...</p>
                ) : error ? (
                    <p className="text-text-secondary text-sm text-center py-8">{error}</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-text-secondary text-xs tracking-widest">
                                <th className="text-left pb-4 font-medium">DESCRIPTION</th>
                                <th className="text-right pb-4 font-medium">AMOUNT</th>
                                <th className="text-right pb-4 font-medium">DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense) => (
                                <tr key={expense.expenseId} className="border-t border-surface-bright/30">
                                    <td className="py-3 text-text-primary text-sm">{expense.description || "—"}</td>
                                    <td className="py-3 text-right text-text-primary text-sm font-medium">-₹{formatCurrency(expense.amount)}</td>
                                    <td className="py-3 text-right text-text-secondary text-xs">{formatDate(expense.expenseTimestamp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default CategoryExpensesModal;
