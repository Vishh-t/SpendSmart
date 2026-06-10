import { useState, useEffect } from "react";
import { Plus, Moon, Sun, FileUp, Menu } from "lucide-react";
import SideBar from "./SideBar.jsx";
import AddExpenseModal from "../modals/AddExpenseModal.jsx";
import ImportStatementModal from "../modals/ImportStatementModal.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useData } from "../../context/DataContext.jsx";

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        function handler() { setIsMobile(window.innerWidth < 768); }
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isMobile;
}

function Layout({ children }) {
    const [showAddExpense,   setShowAddExpense]   = useState(false);
    const [showImport,       setShowImport]       = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const { triggerRefresh } = useData();
    const isMobile = useIsMobile();

    function handleExpenseSuccess() { setShowAddExpense(false); triggerRefresh(); }
    function handleImportSuccess()  { triggerRefresh(); }

    const sidebarW = sidebarCollapsed ? 64 : 224;
    const marginLeft = isMobile ? 0 : sidebarW;

    return (
        <div className="flex min-h-screen bg-surface">

            {/* ── Desktop Sidebar ── */}
            <div className="hidden md:block">
                <SideBar
                    onAddExpense={() => setShowAddExpense(true)}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(c => !c)}
                />
            </div>

            {/* ── Mobile Drawer overlay ── */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* ── Mobile Sidebar Drawer ── */}
            <div
                className="fixed top-0 left-0 h-full z-50 md:hidden transition-transform duration-300 ease-in-out"
                style={{
                    width: "240px",
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
                }}
            >
                <SideBar
                    onAddExpense={() => { setShowAddExpense(true); setMobileMenuOpen(false); }}
                    collapsed={false}
                    onToggle={() => setMobileMenuOpen(false)}
                    isMobileDrawer
                />
            </div>

            {/* ── Main Content ── */}
            <div
                className="flex flex-col flex-1 transition-all duration-300 ease-in-out"
                style={{ marginLeft: `${marginLeft}px` }}
            >
                {/* Header */}
                <header
                    className="flex items-center justify-between gap-2 px-4 md:px-8 py-3 md:py-4 shrink-0"
                    style={{
                        borderBottom: isDark ? "1px solid rgba(49,57,77,0.6)" : "1px solid rgba(0,108,73,0.10)",
                        backgroundColor: "var(--color-surface)",
                    }}
                >
                    {/* Mobile: hamburger + brand */}
                    <div className="flex items-center gap-3 md:hidden">
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-lg"
                            style={{ backgroundColor: isDark ? "rgba(49,57,77,0.6)" : "rgba(0,108,73,0.08)", color: isDark ? "#8892a4" : "#4A6358" }}
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu size={18} />
                        </button>
                        <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>⬡ SpendSmart</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? "Light Mode" : "Dark Mode"}
                            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                            style={{ backgroundColor: isDark ? "rgba(49,57,77,0.6)" : "rgba(0,108,73,0.08)", color: isDark ? "#8892a4" : "#4A6358" }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(78,222,163,0.12)" : "rgba(0,108,73,0.16)"; e.currentTarget.style.color = isDark ? "#4edea3" : "#006C49"; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(49,57,77,0.6)" : "rgba(0,108,73,0.08)"; e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"; }}
                        >
                            {isDark ? <Moon size={16} /> : <Sun size={16} />}
                        </button>

                        {/* Import Statement — icon only on mobile */}
                        <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                                backgroundColor: isDark ? "rgba(49,57,77,0.7)" : "rgba(0,108,73,0.08)",
                                color: isDark ? "#8892a4" : "#4A6358",
                                border: isDark ? "1px solid rgba(78,222,163,0.15)" : "1px solid rgba(0,108,73,0.15)",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(78,222,163,0.10)" : "rgba(0,108,73,0.14)"; e.currentTarget.style.color = isDark ? "#4edea3" : "#006C49"; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(49,57,77,0.7)" : "rgba(0,108,73,0.08)"; e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"; }}
                        >
                            <FileUp size={14} />
                            <span className="hidden sm:inline">Import Statement</span>
                        </button>

                        {/* Add Expense — icon only on mobile */}
                        <button
                            onClick={() => setShowAddExpense(true)}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{ background: isDark ? "linear-gradient(135deg,#4edea3,#10b981)" : "linear-gradient(135deg,#10B981,#059669)", color: "#003824" }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.90"; e.currentTarget.style.boxShadow = "0 0 18px rgba(78,222,163,0.35)"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Add Expense</span>
                        </button>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
                    {children}
                </main>

                {/* Footer — hidden on mobile */}
                <footer
                    className="hidden md:flex shrink-0 px-8 py-3"
                    style={{
                        borderTop: isDark ? "1px solid rgba(49,57,77,0.5)" : "1px solid rgba(0,108,73,0.08)",
                        backgroundColor: "var(--color-surface)",
                    }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
                        <span
                            className="text-xs"
                            style={{ fontFamily: "'Berkeley Mono','Courier New',monospace", color: isDark ? "rgba(136,146,164,0.45)" : "rgba(74,99,88,0.50)" }}
                        >
                            SpendSmart · Precision Ledger · <span style={{ color: isDark ? "rgba(78,222,163,0.55)" : "rgba(0,108,73,0.55)" }}>v1.0 Beta</span>
                        </span>
                        <div className="flex items-center gap-4 flex-wrap">
                            <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLSdUN3kRqoTg0Iee3ZFoDftccsKk13eEK0jLhwFOlFeRB_WKOg/viewform?usp=publish-editor"
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
                                style={{ color: isDark ? "#4edea3" : "#006C49", backgroundColor: isDark ? "rgba(78,222,163,0.10)" : "rgba(0,108,73,0.08)", border: isDark ? "1px solid rgba(78,222,163,0.25)" : "1px solid rgba(0,108,73,0.20)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(78,222,163,0.18)" : "rgba(0,108,73,0.14)"; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(78,222,163,0.10)" : "rgba(0,108,73,0.08)"; }}
                            >
                                Feedback ↗
                            </a>
                            <a href="https://github.com/Vishh-t/SpendSmart" target="_blank" rel="noopener noreferrer"
                                className="text-xs transition-all"
                                style={{ color: isDark ? "rgba(136,146,164,0.60)" : "rgba(74,99,88,0.65)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}
                                onMouseEnter={e => e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"}
                                onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(136,146,164,0.60)" : "rgba(74,99,88,0.65)"}
                            >GitHub ↗</a>
                            <a href="mailto:expense26@gmail.com"
                                className="text-xs transition-all"
                                style={{ color: isDark ? "rgba(136,146,164,0.60)" : "rgba(74,99,88,0.65)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}
                                onMouseEnter={e => e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"}
                                onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(136,146,164,0.60)" : "rgba(74,99,88,0.65)"}
                            >Contact ↗</a>
                            <span className="text-xs" style={{ fontFamily: "'Berkeley Mono','Courier New',monospace", color: isDark ? "rgba(78,222,163,0.30)" : "rgba(0,108,73,0.28)" }}>© 2026</span>
                        </div>
                    </div>
                </footer>

                {/* ── Mobile Bottom Nav ── */}
                <nav
                    className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2"
                    style={{
                        backgroundColor: isDark ? "rgba(11,19,38,0.97)" : "rgba(244,247,245,0.97)",
                        backdropFilter: "blur(16px)",
                        borderTop: isDark ? "1px solid rgba(78,222,163,0.12)" : "1px solid rgba(0,108,73,0.12)",
                    }}
                >
                    {[
                        { path: "/dashboard",  icon: <LayoutDashboardIcon />,  label: "Home" },
                        { path: "/expenses",   icon: <ReceiptIcon />,           label: "Expenses" },
                        { path: "/categories", icon: <TagIcon />,               label: "Categories" },
                        { path: "/insights",   icon: <LineChartIcon />,         label: "Insights" },
                        { path: "/profile",    icon: <UserIcon />,              label: "Profile" },
                    ].map(({ path, icon, label }) => (
                        <BottomNavItem key={path} path={path} icon={icon} label={label} isDark={isDark} />
                    ))}
                </nav>
            </div>

            {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} onSuccess={handleExpenseSuccess} />}
            {showImport     && <ImportStatementModal onClose={() => setShowImport(false)} onSuccess={handleImportSuccess} />}
        </div>
    );
}

import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, Tag, LineChart, User as UserIcon2 } from "lucide-react";

function BottomNavItem({ path, icon, label, isDark }) {
    const location = useLocation();
    const isActive = location.pathname === path;
    return (
        <Link
            to={path}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{
                color: isActive ? (isDark ? "#4edea3" : "#059669") : (isDark ? "rgba(136,146,164,0.6)" : "rgba(74,99,88,0.55)"),
                backgroundColor: isActive ? (isDark ? "rgba(78,222,163,0.10)" : "rgba(16,185,129,0.08)") : "transparent",
            }}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}

function LayoutDashboardIcon() { return <LayoutDashboard size={20} />; }
function ReceiptIcon()         { return <Receipt size={20} />; }
function TagIcon()             { return <Tag size={20} />; }
function LineChartIcon()       { return <LineChart size={20} />; }
function UserIcon()            { return <UserIcon2 size={20} />; }

export default Layout;
