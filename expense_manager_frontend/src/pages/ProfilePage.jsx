import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getUserInfo, updateBudget, deleteAccount } from "../services/userService.js";
import { getAllExpenses } from "../services/expenseService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { LoadingState, ErrorState } from "../components/ui/PageState.jsx";
import { LogOut, Trash2, Save, User, Mail, AtSign, Wallet, AlertTriangle } from "lucide-react";

// ─── Activity Heatmap ─────────────────────────────────────────────────────────
function ActivityHeatmap({ expenses }) {
    const { isDark } = useTheme();
    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DAY_LABELS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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
    const year = new Date().getFullYear();

    const days = [];
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            days.push({ dateStr, month, day, amount: spendingMap[dateStr] || 0 });
        }
    }

    const jan1Weekday = new Date(year, 0, 1).getDay();
    const paddedDays = [...Array(jan1Weekday).fill(null), ...days];
    const weeks = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
        weeks.push(paddedDays.slice(i, i + 7));
    }

    const CELL = 18;
    const GAP  = 4;

    // Scrollbar colors derived from theme
    const thumbColor     = isDark ? "rgba(78,222,163,0.28)"  : "rgba(16,185,129,0.38)";
    const thumbHoverColor = isDark ? "rgba(78,222,163,0.50)" : "rgba(16,185,129,0.58)";

    function getCellColor(amount) {
        if (!amount) return isDark ? "rgba(26,36,56,0.9)" : "#E8EDE9";
        const pct = amount / maxSpending;
        if (isDark) {
            if (pct < 0.25) return "#0d4429";
            if (pct < 0.50) return "#166534";
            if (pct < 0.75) return "#16a34a";
            return "#4edea3";
        } else {
            if (pct < 0.25) return "#bbf7d0";
            if (pct < 0.50) return "#4ade80";
            if (pct < 0.75) return "#16a34a";
            return "#006C49";
        }
    }

    const [tooltip, setTooltip] = useState(null);

    return (
        <div className="bg-surface-high rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-text-primary font-semibold">Spending Activity — {year}</h2>
                <p className="text-text-secondary text-xs">{expenses.length} total transactions</p>
            </div>

            {/*
              — overflow-x: auto  → only shows scrollbar when content genuinely overflows
              — scrollbar-width: thin + scrollbar-color → Firefox themed scrollbar
              — The style tag below handles webkit (Chrome/Edge) scrollbar theming
                inline, since we need JS-derived colors from isDark
            */}
            <style>{`
                .heatmap-scroll::-webkit-scrollbar { height: 4px; }
                .heatmap-scroll::-webkit-scrollbar-track { background: transparent; }
                .heatmap-scroll::-webkit-scrollbar-thumb {
                    background: ${thumbColor};
                    border-radius: 999px;
                }
                .heatmap-scroll::-webkit-scrollbar-thumb:hover {
                    background: ${thumbHoverColor};
                }
            `}</style>

            <div
                className="heatmap-scroll pb-2"
                style={{
                    overflowX: "auto",
                    scrollbarWidth: "thin",
                    scrollbarColor: `${thumbColor} transparent`,
                }}
            >
                {/* inner div — no minWidth:100% so it only takes the space it needs */}
                <div style={{ display: "inline-block", paddingLeft: "4px", paddingBottom: "2px" }}>

                    {/* Month Labels */}
                    <div style={{ display: "flex", gap: `${GAP}px`, marginLeft: "36px", marginBottom: "6px" }}>
                        {weeks.map((week, wi) => {
                            const day1 = week.find(d => d && d.day === 1);
                            const firstDayInWeek = week.find(d => d !== null);
                            let monthLabel = null;
                            if (day1) {
                                monthLabel = MONTH_NAMES[day1.month];
                            } else if (wi === 0 && firstDayInWeek) {
                                monthLabel = MONTH_NAMES[firstDayInWeek.month];
                            }
                            return (
                                <div key={wi} style={{ width: `${CELL}px`, flexShrink: 0, position: "relative", height: "18px" }}>
                                    {monthLabel && (
                                        <span style={{
                                            position: "absolute",
                                            left: 0,
                                            bottom: 2,
                                            fontSize: "11px",
                                            color: isDark ? "#8892a4" : "#4A6358",
                                            whiteSpace: "nowrap",
                                            fontFamily: "monospace"
                                        }}>
                                            {monthLabel}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid */}
                    <div style={{ display: "flex", gap: "4px" }}>
                        {/* Day Labels */}
                        <div style={{ display: "flex", flexDirection: "column", gap: `${GAP}px`, width: "32px", flexShrink: 0 }}>
                            {DAY_LABELS.map((label, i) => (
                                <div key={i} style={{
                                    height: `${CELL}px`,
                                    fontSize: "11px",
                                    color: isDark ? "#8892a4" : "#4A6358",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: "4px",
                                    visibility: (i === 1 || i === 3 || i === 5) ? "visible" : "hidden"
                                }}>
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Squares */}
                        <div style={{ display: "flex", gap: `${GAP}px` }}>
                            {weeks.map((week, wi) => (
                                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
                                    {week.map((day, di) => (
                                        <div
                                            key={di}
                                            style={{
                                                width: `${CELL}px`,
                                                height: `${CELL}px`,
                                                borderRadius: "3px",
                                                backgroundColor: day ? getCellColor(day.amount) : "transparent",
                                                cursor: day?.amount ? "pointer" : "default",
                                                transition: "transform 0.1s ease-in-out",
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={(e) => {
                                                if (day?.amount) {
                                                    e.target.style.transform = "scale(1.15)";
                                                    setTooltip({ date: day.dateStr, amount: day.amount, x: e.clientX, y: e.clientY });
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (day?.amount) {
                                                    e.target.style.transform = "scale(1)";
                                                    setTooltip(null);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-tighter">Less</span>
                {(isDark
                    ? ["rgba(26,36,56,0.9)","#0d4429","#166534","#16a34a","#4edea3"]
                    : ["#E8EDE9","#bbf7d0","#4ade80","#16a34a","#006C49"]
                ).map((color, i) => (
                    <div key={i} style={{ width: CELL, height: CELL, borderRadius: "3px", backgroundColor: color }} />
                ))}
                <span className="text-[10px] text-text-secondary uppercase tracking-tighter">More</span>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-50 px-3 py-2 rounded-lg text-xs shadow-xl pointer-events-none"
                     style={{
                         left: tooltip.x + 12,
                         top: tooltip.y - 44,
                         backgroundColor: isDark ? "#2d3449" : "#ffffff",
                         border: isDark ? "1px solid rgba(78,222,163,0.3)" : "1px solid rgba(0,108,73,0.2)",
                         color: isDark ? "#fff" : "#0D1F17",
                         boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.08)"
                     }}>
                    <span style={{ fontFamily: "monospace" }}>{tooltip.date}</span> • ₹{Number(tooltip.amount).toLocaleString("en-IN")}
                </div>
            )}
        </div>
    );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage() {
    const { logout } = useAuth();
    const [userInfo, setUserInfo] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newBudget, setNewBudget] = useState("");
    const [isSavingBudget, setIsSavingBudget] = useState(false);
    const [budgetSuccess, setBudgetSuccess] = useState(false);
    const [budgetError, setBudgetError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, allExpenses] = await Promise.all([getUserInfo(), getAllExpenses()]);
                setUserInfo(user);
                setNewBudget(user.monthlyBudget || "");
                setExpenses(allExpenses);
            } catch (err) {
                console.error("Profile fetch error:", err);
                setError("Failed to load profile.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    async function handleSaveBudget() {
        if (!newBudget || Number(newBudget) <= 0) { setBudgetError("Please enter a valid budget amount"); return; }
        setIsSavingBudget(true); setBudgetError(""); setBudgetSuccess(false);
        try {
            const updated = await updateBudget(Number(newBudget));
            setUserInfo(updated);
            setBudgetSuccess(true);
            setTimeout(() => setBudgetSuccess(false), 3000);
        } catch {
            setBudgetError("Failed to update budget");
        } finally {
            setIsSavingBudget(false);
        }
    }

    async function handleDeleteAccount() {
        setIsDeleting(true);
        try {
            await deleteAccount();
            logout();
        } catch {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setError("Failed to delete account. Try again.");
        }
    }

    if (isLoading) return <LoadingState message="Loading profile..." />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
                <p className="text-text-secondary text-sm mt-1">Manage your account and preferences</p>
            </div>

            {/* Account Info Cards */}
            <div className="bg-surface-high rounded-xl p-6">
                <h2 className="text-text-primary font-semibold mb-5">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { icon: <User size={16} className="text-primary" />,   label: "FULL NAME",      value: userInfo?.name },
                        { icon: <AtSign size={16} className="text-primary" />, label: "USERNAME",       value: userInfo?.username, mono: true },
                        { icon: <Mail size={16} className="text-primary" />,   label: "EMAIL",          value: userInfo?.email },
                        { icon: <Wallet size={16} className="text-primary" />, label: "MONTHLY BUDGET", value: `₹${formatCurrency(userInfo?.monthlyBudget)}`, green: true, mono: true },
                    ].map(({ icon, label, value, mono, green }) => (
                        <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-low">
                            {icon}
                            <div>
                                <p className="text-text-secondary text-[10px] tracking-widest mb-1">{label}</p>
                                <p className={`text-sm font-medium ${green ? "text-primary" : "text-text-primary"}`}
                                   style={mono ? { fontFamily: "monospace" } : {}}>
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Budget & Danger Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-high rounded-xl p-6">
                    <h2 className="text-text-primary font-semibold mb-1">Update Monthly Budget</h2>
                    <p className="text-text-secondary text-xs mb-5">Used for budget warnings on your dashboard.</p>
                    <div className="flex gap-3 items-start">
                        <div className="flex-1">
                            <input
                                type="number" min="1"
                                value={newBudget}
                                onChange={e => { setNewBudget(e.target.value); setBudgetError(""); setBudgetSuccess(false); }}
                                className="w-full px-4 py-3 rounded-xl text-text-primary outline-none transition-all"
                                style={{ backgroundColor: "var(--color-surface-low)", fontFamily: "monospace" }}
                            />
                            {budgetError && <p className="text-error text-xs mt-2">{budgetError}</p>}
                            {budgetSuccess && <p className="text-primary text-xs mt-2">✓ Budget updated successfully</p>}
                        </div>
                        <button onClick={handleSaveBudget} disabled={isSavingBudget}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium shrink-0"
                                style={{ background: "linear-gradient(135deg, #4edea3, #10b981)", color: "#003824" }}
                        >
                            <Save size={14} />
                            {isSavingBudget ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                <div className="bg-surface-high rounded-xl p-6 border border-error/20">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={16} className="text-error" />
                        <h2 className="text-text-primary font-semibold">Danger Zone</h2>
                    </div>
                    <p className="text-text-secondary text-xs mb-5">Permanently delete your account and all data.</p>
                    {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors bg-error/10 text-error border border-error/30 hover:bg-error/20"
                        >
                            <Trash2 size={14} /> Delete Account
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-error text-sm font-semibold">Are you absolutely sure?</p>
                            <div className="flex gap-2">
                                <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg text-sm font-medium bg-error text-white">
                                    {isDeleting ? "Deleting..." : "Yes, delete"}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-surface-low">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Heatmap */}
            <ActivityHeatmap expenses={expenses} />

            <button onClick={logout} className="flex items-center gap-2 text-text-secondary text-sm hover:text-error transition-colors self-start mb-10">
                <LogOut size={14} />
                Sign out of SpendSmart
            </button>
        </div>
    );
}

export default ProfilePage;
