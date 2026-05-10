import { useState } from "react";
import { Plus, Moon, Sun } from "lucide-react";
import SideBar from "./SideBar.jsx";
import AddExpenseModal from "../modals/AddExpenseModal.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

function Layout({ children }) {

    const [showAddExpense,   setShowAddExpense]   = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="flex min-h-screen bg-surface">

            <SideBar
                onAddExpense={() => setShowAddExpense(true)}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(c => !c)}
            />

            {/* ── right side ─────────────────────────────────────────── */}
            <div
                className="flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out"
                style={{ marginLeft: sidebarCollapsed ? "64px" : "224px" }}
            >
                {/* ── top bar ──────────────────────────────────────────── */}
                <header
                    className="flex items-center justify-end gap-3 px-8 py-4 shrink-0"
                    style={{
                        borderBottom: isDark
                            ? "1px solid rgba(49,57,77,0.6)"
                            : "1px solid rgba(0,108,73,0.10)",
                        backgroundColor: "var(--color-surface)",
                    }}
                >
                    {/* Theme toggle — crescent moon / sun */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                        style={{
                            backgroundColor: isDark ? "rgba(49,57,77,0.6)" : "rgba(0,108,73,0.08)",
                            color: isDark ? "#8892a4" : "#4A6358",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = isDark ? "rgba(78,222,163,0.12)" : "rgba(0,108,73,0.16)";
                            e.currentTarget.style.color = isDark ? "#4edea3" : "#006C49";
                            e.currentTarget.style.boxShadow = isDark
                                ? "0 0 12px rgba(78,222,163,0.2)"
                                : "0 0 12px rgba(0,108,73,0.15)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = isDark ? "rgba(49,57,77,0.6)" : "rgba(0,108,73,0.08)";
                            e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        {isDark ? <Moon size={16} /> : <Sun size={16} />}
                    </button>

                    {/* Add Expense CTA */}
                    <button
                        onClick={() => setShowAddExpense(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #4edea3, #10b981)"
                                : "linear-gradient(135deg, #10B981, #059669)",
                            color: "#003824",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = isDark
                                ? "0 0 18px rgba(78,222,163,0.35)"
                                : "0 0 18px rgba(16,185,129,0.30)";
                            e.currentTarget.style.opacity = "0.92";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.opacity = "1";
                        }}
                    >
                        <Plus size={15} />
                        Add Expense
                    </button>
                </header>

                {/* ── page content ─────────────────────────────────────── */}
                <main className="flex-1 p-8">
                    {children}
                </main>

                {/* ── page footer ──────────────────────────────────── */}
                <footer
                    className="shrink-0 flex items-center justify-between px-8 py-3"
                    style={{
                        borderTop: isDark
                            ? "1px solid rgba(49,57,77,0.5)"
                            : "1px solid rgba(0,108,73,0.08)",
                        backgroundColor: "var(--color-surface)",
                    }}
                >
                    <span
                        className="text-xs"
                        style={{
                            fontFamily: "'Berkeley Mono','Courier New',monospace",
                            color: isDark ? "rgba(136,146,164,0.45)" : "rgba(74,99,88,0.50)",
                        }}
                    >
                        SpendSmart · Precision Ledger
                    </span>
                    <span
                        className="text-xs"
                        style={{
                            fontFamily: "'Berkeley Mono','Courier New',monospace",
                            color: isDark ? "rgba(78,222,163,0.30)" : "rgba(0,108,73,0.28)",
                        }}
                    >
                        v1.0 · © 2026
                    </span>
                </footer>
            </div>

            {showAddExpense && (
                <AddExpenseModal
                    onClose={() => setShowAddExpense(false)}
                    onSuccess={() => setShowAddExpense(false)}
                />
            )}

        </div>
    );
}

export default Layout;
