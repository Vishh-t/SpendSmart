import { useEffect, useState, useRef } from "react";
import { X, CalendarRange, RotateCcw } from "lucide-react";
import { getExpensesByCategory, getExpensesByKeyword } from "../../services/expenseService.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import Calendar, { toYMD } from "../ui/Calendar.jsx";

function RangeDateField({ label, value, onChange, maxDate }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, []);

    const parts   = value ? value.split("-") : null;
    const selYear  = parts ? parseInt(parts[0]) : null;
    const selMonth = parts ? parseInt(parts[1]) - 1 : null;
    const selDay   = parts ? parseInt(parts[2]) : null;

    const display = parts
        ? `${String(selDay).padStart(2, "0")}-${String(selMonth + 1).padStart(2, "0")}-${selYear}`
        : label;

    function handleSelect(y, m, d) {
        if (y == null) { onChange(""); setOpen(false); return; }
        onChange(toYMD(y, m, d));
        setOpen(false);
    }

    return (
        <div className="relative flex-1 sm:flex-none" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs w-full sm:w-auto justify-center sm:justify-start"
                style={{
                    backgroundColor: "rgba(var(--raw-input-bg), 0.7)",
                    color: parts ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    fontFamily: "'Berkeley Mono','Courier New',monospace",
                    border: "1px solid rgba(78,222,163,0.10)",
                    minWidth: "0",
                }}
            >
                <CalendarRange size={12} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                {display}
            </button>
            {open && (
                <div className="absolute z-50 mt-1" style={{ top: "100%", left: 0 }}>
                    <Calendar
                        selectedYear={selYear}
                        selectedMonth={selMonth}
                        selectedDay={selDay}
                        onSelect={handleSelect}
                        maxDate={maxDate}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Reusable expenses drill-down modal.
 * Pass EITHER:
 *   category={{ id, name }}   — shows all expenses in that category
 *   keyword="merchant name"   — shows all expenses for that merchant
 * Both support an optional date-range filter (client-side).
 */
function CategoryExpensesModal({ category, keyword, onClose }) {

    const isMerchantMode = !category && !!keyword;
    const title = isMerchantMode ? keyword : category?.name;
    const subtitleIdle = isMerchantMode ? "All expenses with this merchant" : "All expenses in this category";

    const [allExpenses, setAllExpenses] = useState([]);
    const [isLoading,   setIsLoading]   = useState(true);
    const [error,       setError]       = useState(null);

    const [startDate, setStartDate] = useState("");
    const [endDate,   setEndDate]   = useState("");

    const today = new Date();
    const maxDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };

    useEffect(() => {
        async function fetchExpenses() {
            try {
                const data = isMerchantMode
                    ? await getExpensesByKeyword(keyword)
                    : await getExpensesByCategory(category.id);
                setAllExpenses(data);
            } catch (err) {
                console.error("❌ Expenses fetch error:", err.response?.status, err.response?.data);
                setError("Failed to load expenses.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchExpenses().catch(console.error);
    }, [category?.id, keyword, isMerchantMode]);

    const hasRange = startDate !== "" || endDate !== "";

    const expenses = !hasRange
        ? allExpenses
        : allExpenses.filter(e => {
            const d = e.expenseTimestamp.slice(0, 10);
            if (startDate && d < startDate) return false;
            if (endDate && d > endDate) return false;
            return true;
        });

    const total = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(var(--raw-overlay-bg), 0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl mx-3 sm:mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                style={{
                    backgroundColor: "rgba(var(--raw-modal-bg), 0.95)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(78, 222, 163, 0.15)",
                    maxHeight: "85vh",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 shrink-0 gap-3"
                    style={{
                        background: "linear-gradient(135deg, rgba(78,222,163,0.13) 0%, rgba(16,185,129,0.07) 100%)",
                        borderBottom: "1px solid rgba(78,222,163,0.12)",
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: "linear-gradient(180deg,#4edea3,#10b981)" }} />
                        <div className="min-w-0">
                            <h2 className="text-text-primary font-semibold text-sm sm:text-base leading-tight capitalize truncate">{title}</h2>
                            <p className="text-text-secondary text-xs mt-0.5 truncate">
                                {hasRange ? `${expenses.length} of ${allExpenses.length} expenses · filtered` : subtitleIdle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(78,222,163,0.12)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Date range bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 shrink-0"
                    style={{ borderBottom: "1px solid rgba(78,222,163,0.08)", backgroundColor: "rgba(var(--raw-card-bg),0.4)" }}>
                    <span className="text-xs hidden sm:inline" style={{ color: "var(--color-text-secondary)" }}>Filter range</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <RangeDateField label="From" value={startDate} onChange={setStartDate} maxDate={maxDate} />
                        <span className="text-xs shrink-0" style={{ color: "var(--color-text-secondary)" }}>to</span>
                        <RangeDateField label="To" value={endDate} onChange={setEndDate} maxDate={maxDate} />
                    </div>
                    {hasRange && (
                        <button
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all shrink-0"
                            style={{ color: "var(--color-text-secondary)", backgroundColor: "rgba(var(--raw-input-bg),0.6)" }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
                        >
                            <RotateCcw size={11} /> Clear
                        </button>
                    )}
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col flex-1" style={{ minHeight: 0 }}>

                {isLoading ? (
                    <p className="text-text-secondary text-sm text-center py-8">Loading...</p>
                ) : error ? (
                    <p className="text-error text-sm text-center py-8">{error}</p>
                ) : expenses.length === 0 ? (
                    <p className="text-text-secondary text-sm text-center py-8">
                        {hasRange ? "No expenses in this date range." : "No expenses found."}
                    </p>
                ) : (
                    <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>

                        {/* ── Desktop table (sm and up) ── */}
                        <div className="hidden sm:flex sm:flex-col flex-1" style={{ minHeight: 0 }}>
                            <table className="w-full" style={{ tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: isMerchantMode ? "38%" : "50%" }} />
                                    {isMerchantMode && <col style={{ width: "22%" }} />}
                                    <col style={{ width: isMerchantMode ? "18%" : "22%" }} />
                                    <col style={{ width: isMerchantMode ? "22%" : "28%" }} />
                                </colgroup>
                                <thead>
                                    <tr className="text-text-secondary text-xs tracking-widest border-b border-surface-bright/40">
                                        <th className="text-left pb-3 font-medium">DESCRIPTION</th>
                                        {isMerchantMode && <th className="text-left pb-3 font-medium">CATEGORY</th>}
                                        <th className="text-right pb-3 font-medium">AMOUNT</th>
                                        <th className="text-right pb-3 font-medium">DATE</th>
                                    </tr>
                                </thead>
                            </table>

                            <div className="overflow-y-auto flex-1" style={{ marginRight: "-6px", paddingRight: "6px" }}>
                                <table className="w-full border-separate" style={{ tableLayout: "fixed", borderSpacing: "0 6px" }}>
                                    <colgroup>
                                        <col style={{ width: isMerchantMode ? "38%" : "50%" }} />
                                        {isMerchantMode && <col style={{ width: "22%" }} />}
                                        <col style={{ width: isMerchantMode ? "18%" : "22%" }} />
                                        <col style={{ width: isMerchantMode ? "22%" : "28%" }} />
                                    </colgroup>
                                    <tbody>
                                        {expenses.map((expense) => (
                                            <tr key={expense.expenseId} className="transition-all"
                                                style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.35)" }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(var(--raw-input-bg), 0.55)"}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(var(--raw-input-bg), 0.35)"}
                                            >
                                                <td className="py-3 pl-3 pr-3 text-text-primary text-sm truncate rounded-l-lg">{expense.description || "—"}</td>
                                                {isMerchantMode && (
                                                    <td className="py-3 pr-3">
                                                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--color-surface-low)", color: "var(--color-text-secondary)" }}>
                                                            {expense.category?.categoryName || "Uncategorized"}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="py-3 text-right text-text-primary text-sm font-medium">-₹{formatCurrency(expense.amount)}</td>
                                                <td className="py-3 pr-3 text-right text-text-secondary text-xs rounded-r-lg">{formatDate(expense.expenseTimestamp)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Mobile card list (below sm) ── */}
                        <div className="flex sm:hidden flex-col gap-2 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
                            {expenses.map((expense) => (
                                <div key={expense.expenseId} className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5"
                                    style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.35)" }}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-text-primary text-sm truncate">{expense.description || "—"}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {isMerchantMode && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-surface-low)", color: "var(--color-text-secondary)" }}>
                                                    {expense.category?.categoryName || "Uncategorized"}
                                                </span>
                                            )}
                                            <span className="text-text-secondary text-[10px] shrink-0">{formatDate(expense.expenseTimestamp)}</span>
                                        </div>
                                    </div>
                                    <span className="text-text-primary text-sm font-semibold shrink-0">-₹{formatCurrency(expense.amount)}</span>
                                </div>
                            ))}
                        </div>

                        {/* footer total */}
                        <div className="flex items-center justify-between pt-3 mt-1 shrink-0" style={{ borderTop: "1px solid rgba(78,222,163,0.15)" }}>
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{expenses.length} transaction{expenses.length !== 1 ? "s" : ""}</span>
                            <span className="text-sm font-bold" style={{ color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                                -₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
