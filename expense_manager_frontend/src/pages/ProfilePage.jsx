import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getUserInfo, updateBudget, deleteAccount } from "../services/userService.js";
import { getAllExpenses, getExpensesByDateRange } from "../services/expenseService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { LoadingState, ErrorState } from "../components/ui/PageState.jsx";
import { LogOut, Trash2, Save, User, Mail, AtSign, Wallet, AlertTriangle, X, ChevronDown, ShieldAlert, Edit3 } from "lucide-react";

// ─── Date Expenses Modal ──────────────────────────────────────────────────────
function DateExpensesModal({ date, onClose }) {
    const { isDark } = useTheme();
    const [expenses, setExpenses] = useState([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        async function fetchDayExpenses() {
            try {
                const data = await getExpensesByDateRange(date, date);
                setExpenses(data);
            } catch {
                setExpenses([]);
            } finally {
                setLoading(false);
            }
        }
        fetchDayExpenses();
    }, [date]);

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const ROW_HEIGHT   = 44;
    const ROWS_VISIBLE = 8;
    const bodyMaxHeight = ROW_HEIGHT * ROWS_VISIBLE;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(var(--raw-overlay-bg), 0.80)", backdropFilter: "blur(10px)" }}
            onClick={onClose}>
            <div className="relative flex flex-col rounded-2xl shadow-2xl"
                style={{ backgroundColor: "rgba(var(--raw-modal-bg), 0.97)", border: "1px solid rgba(78,222,163,0.15)", width: "min(96vw, 520px)", maxHeight: "90vh", overflow: "hidden" }}
                onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between px-6 py-4 shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(78,222,163,0.13) 0%, rgba(16,185,129,0.07) 100%)", borderBottom: "1px solid rgba(78,222,163,0.12)" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(180deg,#4edea3,#10b981)" }} />
                        <div>
                            <h2 className="text-text-primary font-semibold text-sm">
                                {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </h2>
                            <p className="text-text-secondary text-xs mt-0.5">
                                {loading ? "Loading…" : `${expenses.length} transaction${expenses.length !== 1 ? "s" : ""} · ₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(78,222,163,0.12)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                        <X size={15} />
                    </button>
                </div>

                {!loading && expenses.length > 0 && (
                    <div className="shrink-0" style={{ borderBottom: "1px solid rgba(78,222,163,0.08)", backgroundColor: "rgba(var(--raw-modal-bg),0.97)" }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr>{["Description","Category","Amount"].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold tracking-widest" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                                ))}</tr>
                            </thead>
                        </table>
                    </div>
                )}

                <div style={{ overflowY: "auto", maxHeight: `${bodyMaxHeight}px`, scrollbarWidth: "thin", scrollbarColor: isDark ? "rgba(78,222,163,0.3) transparent" : "rgba(16,185,129,0.3) transparent" }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                        </div>
                    ) : expenses.length === 0 ? (
                        <p className="text-center text-text-secondary text-sm py-12">No expenses found for this date.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {expenses.map((exp, i) => (
                                    <tr key={exp.expenseId} style={{ borderBottom: i < expenses.length - 1 ? "1px solid rgba(78,222,163,0.05)" : "none", height: `${ROW_HEIGHT}px` }}>
                                        <td className="px-5 py-3 text-text-primary text-xs max-w-[180px] truncate">{exp.description || "—"}</td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "var(--color-surface-low)", color: "var(--color-text-secondary)" }}>
                                                {exp.category?.categoryName || "Uncategorized"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-xs font-semibold whitespace-nowrap" style={{ color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                                            -₹{Number(exp.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && expenses.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3 shrink-0 text-xs"
                        style={{ borderTop: "1px solid rgba(78,222,163,0.10)", backgroundColor: "rgba(78,222,163,0.04)" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{expenses.length} transaction{expenses.length !== 1 ? "s" : ""} · Total spent</span>
                        <span style={{ color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace", fontWeight: 700 }}>
                            -₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Activity Heatmap (desktop only) ─────────────────────────────────────────
function ActivityHeatmap({ expenses: initialExpenses }) {
    const { isDark } = useTheme();
    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DAY_LABELS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [year,        setYear]         = useState(currentYear);
    const [expenses,    setExpenses]     = useState(initialExpenses);
    const [loadingYear, setLoadingYear]  = useState(false);
    const [yearDropOpen,setYearDropOpen] = useState(false);
    const [tooltip,     setTooltip]      = useState(null);
    const [selectedDate,setSelectedDate] = useState(null);
    const yearDropRef = useRef(null);

    useEffect(() => {
        function outside(e) { if (yearDropRef.current && !yearDropRef.current.contains(e.target)) setYearDropOpen(false); }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, []);

    async function handleYearChange(y) {
        setYearDropOpen(false);
        if (y === year) return;
        setYear(y); setLoadingYear(true);
        try { const data = await getExpensesByDateRange(`${y}-01-01`, `${y}-12-31`); setExpenses(data); }
        catch { setExpenses([]); }
        finally { setLoadingYear(false); }
    }

    const spendingMap = {};
    expenses.forEach(exp => {
        let dateStr;
        if (Array.isArray(exp.expenseTimestamp)) {
            const [y, m, d] = exp.expenseTimestamp;
            dateStr = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        } else {
            dateStr = exp.expenseTimestamp?.substring(0, 10);
        }
        if (dateStr) spendingMap[dateStr] = (spendingMap[dateStr] || 0) + Number(exp.amount);
    });

    const maxSpending = Math.max(...Object.values(spendingMap), 1);
    const days = [];
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            days.push({ dateStr, month, day, amount: spendingMap[dateStr] || 0 });
        }
    }

    const jan1Weekday = new Date(year, 0, 1).getDay();
    const paddedDays  = [...Array(jan1Weekday).fill(null), ...days];
    const weeks = [];
    for (let i = 0; i < paddedDays.length; i += 7) weeks.push(paddedDays.slice(i, i + 7));

    const CELL = 18; const GAP = 4;
    const thumbColor      = isDark ? "rgba(78,222,163,0.28)"  : "rgba(16,185,129,0.38)";
    const thumbHoverColor = isDark ? "rgba(78,222,163,0.50)"  : "rgba(16,185,129,0.58)";
    const toggleBorder    = isDark ? "rgba(61,73,98,0.6)"     : "rgba(0,108,73,0.2)";
    const toggleBg        = isDark ? "#2d3449"                : "#ECF3EE";
    const dropdownBg      = isDark ? "rgba(19,27,46,0.97)"    : "rgba(255,255,255,0.97)";

    function getCellColor(amount) {
        if (!amount) return isDark ? "rgba(26,36,56,0.9)" : "#E8EDE9";
        const pct = amount / maxSpending;
        if (isDark) {
            if (pct < 0.25) return "#0d4429"; if (pct < 0.50) return "#166534"; if (pct < 0.75) return "#16a34a"; return "#4edea3";
        } else {
            if (pct < 0.25) return "#bbf7d0"; if (pct < 0.50) return "#4ade80"; if (pct < 0.75) return "#16a34a"; return "#006C49";
        }
    }

    return (
        <div className="bg-surface-high rounded-xl p-6 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-text-primary font-semibold">Spending Activity — {year}</h2>
                    <p className="text-text-secondary text-xs mt-0.5">{expenses.length} transactions</p>
                </div>
                <div className="relative" ref={yearDropRef}>
                    <button onClick={() => setYearDropOpen(o => !o)}
                        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ backgroundColor: toggleBg, color: isDark ? "#fff" : "#0D1F17", border: `1px solid ${toggleBorder}` }}>
                        {loadingYear
                            ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />Loading…</span>
                            : <>{year} <ChevronDown size={12} className={`transition-transform ${yearDropOpen ? "rotate-180" : ""}`} style={{ color: isDark ? "#8892a4" : "#4A6358" }} /></>}
                    </button>
                    {yearDropOpen && (
                        <div className="absolute top-full mt-1 right-0 z-20 rounded-lg shadow-lg"
                            style={{ backgroundColor: dropdownBg, backdropFilter: "blur(12px)", border: `1px solid ${toggleBorder}`, minWidth: "90px" }}>
                            {yearOptions.map(y => (
                                <button key={y} onClick={() => handleYearChange(y)}
                                    className="w-full text-left px-4 py-2 text-xs transition-all hover:bg-surface-bright"
                                    style={{ color: year === y ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                                    {y}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`.heatmap-scroll::-webkit-scrollbar{height:4px}.heatmap-scroll::-webkit-scrollbar-track{background:transparent}.heatmap-scroll::-webkit-scrollbar-thumb{background:${thumbColor};border-radius:999px}.heatmap-scroll::-webkit-scrollbar-thumb:hover{background:${thumbHoverColor}}`}</style>

            <div className="heatmap-scroll pb-2" style={{ overflowX: "scroll", overflowY: "hidden", WebkitOverflowScrolling: "touch", touchAction: "pan-x pinch-zoom", scrollbarWidth: "thin", scrollbarColor: `${thumbColor} transparent`, cursor: "grab" }}>
                <div style={{ display: "inline-block", paddingLeft: "4px", paddingBottom: "2px" }}>
                    <div style={{ display: "flex", gap: `${GAP}px`, marginLeft: "36px", marginBottom: "6px" }}>
                        {weeks.map((week, wi) => {
                            const day1 = week.find(d => d && d.day === 1);
                            const firstDayInWeek = week.find(d => d !== null);
                            let monthLabel = null;
                            if (day1) monthLabel = MONTH_NAMES[day1.month];
                            else if (wi === 0 && firstDayInWeek) monthLabel = MONTH_NAMES[firstDayInWeek.month];
                            return (
                                <div key={wi} style={{ width: `${CELL}px`, flexShrink: 0, position: "relative", height: "18px" }}>
                                    {monthLabel && <span style={{ position: "absolute", left: 0, bottom: 2, fontSize: "11px", color: isDark ? "#8892a4" : "#4A6358", whiteSpace: "nowrap", fontFamily: "monospace" }}>{monthLabel}</span>}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, width: "32px", flexShrink: 0 }}>
                            {DAY_LABELS.map((label, i) => (
                                <div key={i} style={{ height: `${CELL}px`, fontSize: "11px", color: isDark ? "#8892a4" : "#4A6358", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "4px", visibility: (i === 1 || i === 3 || i === 5) ? "visible" : "hidden" }}>{label}</div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: `${GAP}px` }}>
                            {weeks.map((week, wi) => (
                                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
                                    {week.map((day, di) => (
                                        <div key={di}
                                            style={{ width: `${CELL}px`, height: `${CELL}px`, borderRadius: "3px", backgroundColor: day ? getCellColor(day.amount) : "transparent", cursor: day?.amount ? "pointer" : "default", transition: "transform 0.1s ease-in-out", flexShrink: 0 }}
                                            onMouseEnter={e => { if (day?.amount) { e.target.style.transform = "scale(1.15)"; setTooltip({ date: day.dateStr, amount: day.amount, x: e.clientX, y: e.clientY }); } }}
                                            onMouseLeave={e => { if (day?.amount) { e.target.style.transform = "scale(1)"; setTooltip(null); } }}
                                            onClick={() => { if (day?.amount) setSelectedDate(day.dateStr); }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-tighter">Less</span>
                {(isDark ? ["rgba(26,36,56,0.9)","#0d4429","#166534","#16a34a","#4edea3"] : ["#E8EDE9","#bbf7d0","#4ade80","#16a34a","#006C49"]).map((color, i) => (
                    <div key={i} style={{ width: CELL, height: CELL, borderRadius: "3px", backgroundColor: color }} />
                ))}
                <span className="text-[10px] text-text-secondary uppercase tracking-tighter">More</span>
            </div>

            {tooltip && (
                <div className="fixed z-50 px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none"
                    style={{ left: tooltip.x + 12, top: tooltip.y - 44, backgroundColor: isDark ? "#2d3449" : "#ffffff", border: isDark ? "1px solid rgba(78,222,163,0.3)" : "1px solid rgba(0,108,73,0.2)", color: isDark ? "#fff" : "#0D1F17" }}>
                    <span style={{ fontFamily: "monospace" }}>{tooltip.date}</span> · ₹{Number(tooltip.amount).toLocaleString("en-IN")}
                    <span className="block text-center" style={{ color: isDark ? "rgba(78,222,163,0.7)" : "rgba(0,108,73,0.7)", fontSize: "10px", marginTop: "2px" }}>click to view</span>
                </div>
            )}
            {selectedDate && <DateExpensesModal date={selectedDate} onClose={() => setSelectedDate(null)} />}
        </div>
    );
}

// ─── Mobile Profile View ──────────────────────────────────────────────────────
function MobileProfileView({ userInfo, onSaveBudget, onDeleteAccount, onLogout, isDark }) {
    const [newBudget,         setNewBudget]         = useState(userInfo?.monthlyBudget || "");
    const [isSavingBudget,    setIsSavingBudget]    = useState(false);
    const [budgetSuccess,     setBudgetSuccess]     = useState(false);
    const [budgetError,       setBudgetError]       = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting,        setIsDeleting]        = useState(false);
    const [editingBudget,     setEditingBudget]     = useState(false);

    const primary     = isDark ? "#4edea3" : "#059669";
    const cardBg      = isDark ? "rgba(26,36,56,0.9)" : "#ffffff";
    const cardBorder  = isDark ? "rgba(78,222,163,0.10)" : "rgba(0,108,73,0.10)";
    const inputBg     = isDark ? "rgba(11,19,38,0.8)" : "#F4F7F5";
    const inputBorder = isDark ? "rgba(78,222,163,0.25)" : "rgba(0,108,73,0.20)";
    const labelColor  = isDark ? "rgba(136,146,164,0.7)" : "rgba(0,108,73,0.55)";

    async function handleSave() {
        if (!newBudget || Number(newBudget) <= 0) { setBudgetError("Enter a valid amount"); return; }
        setIsSavingBudget(true); setBudgetError(""); setBudgetSuccess(false);
        try {
            await onSaveBudget(Number(newBudget));
            setBudgetSuccess(true);
            setEditingBudget(false);
            setTimeout(() => setBudgetSuccess(false), 3000);
        } catch { setBudgetError("Failed to update budget"); }
        finally { setIsSavingBudget(false); }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try { await onDeleteAccount(); }
        catch { setIsDeleting(false); setShowDeleteConfirm(false); }
    }

    const initial = userInfo?.username?.charAt(0)?.toUpperCase() || "U";

    return (
        <div className="flex flex-col gap-4 pb-24">

            {/* Avatar + name card */}
            <div className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: isDark ? "linear-gradient(135deg,rgba(78,222,163,0.09) 0%,rgba(26,36,56,0.9) 60%)" : "linear-gradient(135deg,rgba(16,185,129,0.08) 0%,#ffffff 60%)", border: `1px solid ${cardBorder}` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
                    style={{ background: "linear-gradient(135deg,#4edea3,#10b981)", color: "#003824", boxShadow: isDark ? "0 0 24px rgba(78,222,163,0.25)" : "0 0 24px rgba(16,185,129,0.20)" }}>
                    {initial}
                </div>
                <div className="min-w-0">
                    <p className="text-text-primary font-bold text-lg leading-tight truncate">{userInfo?.name || userInfo?.username}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: labelColor, fontFamily: "'Berkeley Mono','Courier New',monospace" }}>@{userInfo?.username}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: labelColor }}>{userInfo?.email}</p>
                </div>
            </div>

            {/* Budget card */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wallet size={15} style={{ color: primary }} />
                        <span className="text-text-primary font-semibold text-sm">Monthly Budget</span>
                    </div>
                    {!editingBudget && (
                        <button onClick={() => setEditingBudget(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                            style={{ color: primary, backgroundColor: isDark ? "rgba(78,222,163,0.10)" : "rgba(16,185,129,0.08)" }}>
                            <Edit3 size={11} /> Edit
                        </button>
                    )}
                </div>

                {!editingBudget ? (
                    <div>
                        <p className="font-black text-3xl" style={{ color: primary, fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                            ₹{formatCurrency(userInfo?.monthlyBudget)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: labelColor }}>Current monthly budget</p>
                        {budgetSuccess && <p className="text-xs mt-1" style={{ color: primary }}>✓ Updated successfully</p>}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <input
                            type="number" min="1"
                            value={newBudget}
                            autoFocus
                            onChange={e => { setNewBudget(e.target.value); setBudgetError(""); }}
                            placeholder="Enter new budget"
                            className="w-full px-4 py-3 rounded-xl text-text-primary outline-none text-base"
                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, fontFamily: "'Berkeley Mono','Courier New',monospace" }}
                        />
                        {budgetError && <p className="text-xs" style={{ color: "#ef4444" }}>{budgetError}</p>}
                        <div className="flex gap-2">
                            <button onClick={handleSave} disabled={isSavingBudget}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg,#4edea3,#10b981)", color: "#003824" }}>
                                <Save size={14} />
                                {isSavingBudget ? "Saving…" : "Save Budget"}
                            </button>
                            <button onClick={() => { setEditingBudget(false); setBudgetError(""); }}
                                className="px-4 py-3 rounded-xl text-sm"
                                style={{ backgroundColor: isDark ? "rgba(49,57,77,0.7)" : "#E8EDE9", color: "var(--color-text-secondary)" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout */}
            <button onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ backgroundColor: isDark ? "rgba(49,57,77,0.6)" : "#F4F7F5", color: "var(--color-text-secondary)", border: isDark ? "1px solid rgba(61,73,98,0.5)" : "1px solid rgba(0,108,73,0.10)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.30)"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderColor = isDark ? "rgba(61,73,98,0.5)" : "rgba(0,108,73,0.10)"; e.currentTarget.style.backgroundColor = isDark ? "rgba(49,57,77,0.6)" : "#F4F7F5"; }}>
                <LogOut size={15} />
                Sign Out
            </button>

            {/* Danger Zone */}
            <div className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ backgroundColor: isDark ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.20)" }}>
                <div className="flex items-center gap-2">
                    <ShieldAlert size={15} style={{ color: "#ef4444" }} />
                    <span className="text-text-primary font-semibold text-sm">Danger Zone</span>
                </div>
                <p className="text-xs" style={{ color: labelColor }}>
                    Permanently deletes your account, all expenses, categories, and mappings. This cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                        style={{ backgroundColor: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <Trash2 size={14} /> Delete Account
                    </button>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold" style={{ color: "#ef4444" }}>Are you absolutely sure?</p>
                        <div className="flex gap-2">
                            <button onClick={handleDelete} disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                                style={{ backgroundColor: "#ef4444", color: "#ffffff" }}>
                                {isDeleting ? "Deleting…" : "Yes, Delete"}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl text-sm"
                                style={{ backgroundColor: isDark ? "rgba(49,57,77,0.7)" : "#E8EDE9", color: "var(--color-text-secondary)" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center text-xs mt-2" style={{ color: isDark ? "rgba(136,146,164,0.35)" : "rgba(74,99,88,0.40)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                SpendSmart · Precision Ledger
            </p>
        </div>
    );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage() {
    const { logout } = useAuth();
    const { isDark } = useTheme();
    const [userInfo,          setUserInfo]          = useState(null);
    const [expenses,          setExpenses]          = useState([]);
    const [isLoading,         setIsLoading]         = useState(true);
    const [error,             setError]             = useState(null);
    const [newBudget,         setNewBudget]         = useState("");
    const [isSavingBudget,    setIsSavingBudget]    = useState(false);
    const [budgetSuccess,     setBudgetSuccess]     = useState(false);
    const [budgetError,       setBudgetError]       = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting,        setIsDeleting]        = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, allExpenses] = await Promise.all([getUserInfo(), getAllExpenses()]);
                setUserInfo(user);
                setNewBudget(user.monthlyBudget || "");
                setExpenses(allExpenses);
            } catch {
                setError("Failed to load profile.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    async function handleSaveBudget(amount) {
        setIsSavingBudget(true); setBudgetError(""); setBudgetSuccess(false);
        try {
            const updated = await updateBudget(amount);
            setUserInfo(updated);
            setBudgetSuccess(true);
            setTimeout(() => setBudgetSuccess(false), 3000);
        } catch { setBudgetError("Failed to update budget"); throw new Error(); }
        finally { setIsSavingBudget(false); }
    }

    async function handleDeleteAccount() {
        setIsDeleting(true);
        try { await deleteAccount(); logout(); }
        catch { setIsDeleting(false); setShowDeleteConfirm(false); setError("Failed to delete account."); throw new Error(); }
    }

    if (isLoading) return <LoadingState message="Loading profile..." />;
    if (error)     return <ErrorState message={error} />;

    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden pb-4 md:pb-0">

            {/* ── Mobile / Tablet view — hidden on xl+ (1280px+) ── */}
            <div className="xl:hidden">
                <MobileProfileView
                    userInfo={userInfo}
                    isDark={isDark}
                    onSaveBudget={handleSaveBudget}
                    onDeleteAccount={handleDeleteAccount}
                    onLogout={logout}
                />
            </div>

            {/* ── Desktop view — hidden below xl (1280px) ── */}
            <div className="hidden xl:flex xl:flex-col xl:gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
                    <p className="text-text-secondary text-sm mt-1">Manage your account and preferences</p>
                </div>

                <div className="bg-surface-high rounded-xl p-6 w-full">
                    <h2 className="text-text-primary font-semibold mb-5">Account Information</h2>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {[
                            { icon: <User size={16} className="text-primary" />,   label: "FULL NAME",      value: userInfo?.name },
                            { icon: <AtSign size={16} className="text-primary" />, label: "USERNAME",       value: userInfo?.username, mono: true },
                            { icon: <Mail size={16} className="text-primary" />,   label: "EMAIL",          value: userInfo?.email },
                            { icon: <Wallet size={16} className="text-primary" />, label: "MONTHLY BUDGET", value: `₹${formatCurrency(userInfo?.monthlyBudget)}`, green: true, mono: true },
                        ].map(({ icon, label, value, mono, green }) => (
                            <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-low min-w-0 overflow-hidden">
                                <div className="shrink-0">{icon}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-text-secondary text-[10px] tracking-widest mb-1 truncate">{label}</p>
                                    <p className={`text-sm font-medium truncate ${green ? "text-primary" : "text-text-primary"}`} style={mono ? { fontFamily: "monospace" } : {}}>
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 w-full">
                    <div className="bg-surface-high rounded-xl p-6 w-full">
                        <h2 className="text-text-primary font-semibold mb-1">Update Monthly Budget</h2>
                        <p className="text-text-secondary text-xs mb-5">Used for budget warnings on your dashboard.</p>
                        <div className="flex gap-3 items-start w-full">
                            <div className="flex-1 min-w-0">
                                <input type="number" min="1" value={newBudget}
                                    onChange={e => { setNewBudget(e.target.value); setBudgetError(""); setBudgetSuccess(false); }}
                                    className="w-full px-4 py-3 rounded-xl text-text-primary outline-none transition-all"
                                    style={{ backgroundColor: "var(--color-surface-low)", fontFamily: "monospace" }} />
                                {budgetError   && <p className="text-error text-xs mt-2 truncate">{budgetError}</p>}
                                {budgetSuccess && <p className="text-primary text-xs mt-2 truncate">✓ Budget updated successfully</p>}
                            </div>
                            <button onClick={() => handleSaveBudget(Number(newBudget))} disabled={isSavingBudget}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium shrink-0"
                                style={{ background: "linear-gradient(135deg, #4edea3, #10b981)", color: "#003824" }}>
                                <Save size={14} />
                                {isSavingBudget ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface-high rounded-xl p-6 border border-error/20 w-full">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={16} className="text-error shrink-0" />
                            <h2 className="text-text-primary font-semibold">Danger Zone</h2>
                        </div>
                        <p className="text-text-secondary text-xs mb-5">Permanently delete your account and all data.</p>
                        {!showDeleteConfirm ? (
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors bg-error/10 text-error border border-error/30 hover:bg-error/20">
                                <Trash2 size={14} /> Delete Account
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3 w-full">
                                <p className="text-error text-sm font-semibold">Are you absolutely sure?</p>
                                <div className="flex gap-2 w-full">
                                    <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg text-sm font-medium bg-error text-white">
                                        {isDeleting ? "Deleting..." : "Yes, delete"}
                                    </button>
                                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-low">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full overflow-hidden">
                    <ActivityHeatmap expenses={expenses} />
                </div>

                <button onClick={logout} className="flex items-center gap-2 text-text-secondary text-sm hover:text-error transition-colors self-start mb-2">
                    <LogOut size={14} />
                    Sign out of SpendSmart
                </button>
            </div>
        </div>
    );
}

export default ProfilePage;
