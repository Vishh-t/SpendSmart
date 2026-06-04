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
                setError("Failed to load expenses.");
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
                className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: "rgba(var(--raw-modal-bg), 0.95)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(78, 222, 163, 0.15)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{
                        background: "linear-gradient(135deg, rgba(78,222,163,0.13) 0%, rgba(16,185,129,0.07) 100%)",
                        borderBottom: "1px solid rgba(78,222,163,0.12)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(180deg,#4edea3,#10b981)" }} />
                        <div>
                            <h2 className="text-text-primary font-semibold text-base leading-tight">{category.name}</h2>
                            <p className="text-text-secondary text-xs mt-0.5">All expenses in this category</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(78,222,163,0.12)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6">

                {isLoading ? (
                    <p className="text-text-secondary text-sm text-center py-8">Loading...</p>
                ) : error ? (
                    <p className="text-error text-sm text-center py-8">{error}</p>
                ) : expenses.length === 0 ? (
                    <p className="text-text-secondary text-sm text-center py-8">No expenses in this category yet.</p>
                ) : (
                        <div className="flex flex-col" style={{ maxHeight: "420px" }}>
                        {/* sticky header */}
                        <table className="w-full" style={{ tableLayout: "fixed" }}>
                            <colgroup>
                                <col style={{ width: "55%" }} />
                                <col style={{ width: "20%" }} />
                                <col style={{ width: "25%" }} />
                            </colgroup>
                            <thead>
                                <tr className="text-text-secondary text-xs tracking-widest border-b border-surface-bright/40">
                                    <th className="text-left pb-3 font-medium">DESCRIPTION</th>
                                    <th className="text-right pb-3 font-medium">AMOUNT</th>
                                    <th className="text-right pb-3 font-medium">DATE</th>
                                </tr>
                            </thead>
                        </table>

                        {/* scrollable body */}
                        <div className="overflow-y-auto flex-1" style={{ maxHeight: "380px", marginRight: "-6px", paddingRight: "6px" }}>
                            <table className="w-full" style={{ tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "55%" }} />
                                    <col style={{ width: "20%" }} />
                                    <col style={{ width: "25%" }} />
                                </colgroup>
                                <tbody>
                                    {expenses.map((expense) => (
                                        <tr key={expense.expenseId} className="border-b border-surface-bright/20 hover:bg-surface-bright/10 transition-all">
                                            <td className="py-3 pr-3 text-text-primary text-sm truncate">{expense.description || "—"}</td>
                                            <td className="py-3 text-right text-text-primary text-sm font-medium">-₹{formatCurrency(expense.amount)}</td>
                                            <td className="py-3 text-right text-text-secondary text-xs">{formatDate(expense.expenseTimestamp)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* footer total */}
                        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: "1px solid rgba(78,222,163,0.15)" }}>
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{expenses.length} transaction{expenses.length !== 1 ? "s" : ""}</span>
                            <span className="text-sm font-bold" style={{ color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                                -₹{expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}

export default CategoryExpensesModal;
