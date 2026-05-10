import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import CategoryExpensesModal from "../modals/CategoryExpensesModal.jsx";

function RecentExpenses({ expenses }) {

    const [selectedCategory, setSelectedCategory] = useState(null);

    return (
        <div className="bg-surface-high rounded-xl p-5">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-text-primary font-semibold">Recent Ledger Entries</h2>
                <Link to="/expenses" className="text-primary text-xs hover:underline">View Full History →</Link>
            </div>

            {expenses.length === 0 ? (
                <p className="text-text-secondary text-sm">No expenses yet. Add your first expense!</p>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="text-text-secondary text-xs tracking-widest">
                            <th className="text-left pb-4 font-medium">DESCRIPTION</th>
                            <th className="text-left pb-4 font-medium">CATEGORY</th>
                            <th className="text-right pb-4 font-medium">AMOUNT</th>
                            <th className="text-right pb-4 font-medium">DATE</th>
                            <th className="text-right pb-4 font-medium">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => (
                            <tr key={expense.expenseId} className="border-t border-surface-bright hover:bg-surface-bright/30 transition-all">
                                <td className="py-4 text-text-primary text-sm">{expense.description || "—"}</td>
                                <td className="py-4">
                                    <span
                                        onClick={() => setSelectedCategory({ id: expense.category?.categoryId, name: expense.category?.categoryName })}
                                        className="bg-surface-low text-text-secondary text-xs px-3 py-1 rounded-full cursor-pointer hover:text-primary hover:bg-surface-bright transition-all"
                                    >
                                        {expense.category?.categoryName}
                                    </span>
                                </td>
                                <td className="py-4 text-right text-text-primary text-sm font-medium">-₹{formatCurrency(expense.amount)}</td>
                                <td className="py-4 text-right text-text-secondary text-xs">{formatDate(expense.expenseTimestamp)}</td>
                                <td className="py-4 text-right">
                                    <Link to="/expenses" className="text-primary text-xs hover:underline">View →</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {selectedCategory && (
                <CategoryExpensesModal category={selectedCategory} onClose={() => setSelectedCategory(null)} />
            )}
        </div>
    );
}

export default RecentExpenses;
