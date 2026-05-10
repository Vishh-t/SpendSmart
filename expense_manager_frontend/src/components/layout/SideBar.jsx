import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { LayoutDashboard, Receipt, Tag, User, Plus, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const navLinks = [
    { path: "/dashboard",  label: "Dashboard",  icon: <LayoutDashboard size={18} /> },
    { path: "/expenses",   label: "Expenses",   icon: <Receipt size={18} /> },
    { path: "/categories", label: "Categories", icon: <Tag size={18} /> },
    { path: "/profile",    label: "Profile",    icon: <User size={18} /> },
];

function SideBar({ onAddExpense, collapsed, onToggle }) {

    const location         = useLocation();
    const { user, logout } = useAuth();

    // Check if currently on profile page — for avatar glow
    const isOnProfile = location.pathname === "/profile";

    return (
        <div
            className="sidebar-bg min-h-screen flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out z-30"
            style={{ width: collapsed ? "64px" : "224px" }}
        >
            {/* ── Logo + collapse toggle ─────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-6 mb-4">
                {!collapsed && (
                    <h1 className="text-xl font-bold whitespace-nowrap overflow-hidden" style={{ color: "#6EF0B8" }}>
                        ⬡ SpendSmart
                    </h1>
                )}
                <button
                    onClick={onToggle}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0 ${collapsed ? "mx-auto" : ""}`}
                    style={{ color: "rgba(255,255,255,0.50)", backgroundColor: "transparent" }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)";
                        e.currentTarget.style.color = "#6EF0B8";
                        e.currentTarget.style.boxShadow = "0 0 10px rgba(110,240,184,0.15)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.50)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                </button>
            </div>

            {/* ── Nav Links ─────────────────────────────────────────── */}
            <nav className="flex flex-col gap-1 flex-1 px-2">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            title={collapsed ? link.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${collapsed ? "justify-center" : ""}`}
                            style={{
                                backgroundColor: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                                color: isActive ? "#6EF0B8" : "rgba(255,255,255,0.55)",
                                boxShadow: isActive ? "0 0 12px rgba(110,240,184,0.10)" : "none",
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.09)";
                                    e.currentTarget.style.color = "rgba(255,255,255,0.90)";
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                                }
                            }}
                        >
                            <span className="shrink-0">{link.icon}</span>
                            {!collapsed && <span className="whitespace-nowrap overflow-hidden">{link.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Bottom Section ─────────────────────────────────────── */}
            <div className="flex flex-col gap-3 px-2 pb-6">

                {/* User Info — clicking avatar or name redirects to /profile */}
                {collapsed ? (
                    // Collapsed — just the avatar, clickable
                    <Link
                        to="/profile"
                        className="flex justify-center py-1"
                        title="View Profile"
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                            style={{
                                backgroundColor: "#10B981",
                                color: "#003824",
                                // Glow when on profile page or on hover (hover handled via CSS class below)
                                boxShadow: isOnProfile ? "0 0 14px rgba(78,222,163,0.50)" : "none",
                                outline: isOnProfile ? "2px solid rgba(78,222,163,0.40)" : "none",
                                outlineOffset: "2px"
                            }}
                            onMouseEnter={e => {
                                if (!isOnProfile) {
                                    e.currentTarget.style.boxShadow = "0 0 12px rgba(78,222,163,0.35)";
                                    e.currentTarget.style.outline = "2px solid rgba(78,222,163,0.25)";
                                    e.currentTarget.style.outlineOffset = "2px";
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isOnProfile) {
                                    e.currentTarget.style.boxShadow = "none";
                                    e.currentTarget.style.outline = "none";
                                }
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                    </Link>
                ) : (
                    // Expanded — avatar + username + subtitle, full row clickable
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-2 rounded-lg py-1.5 transition-all"
                        title="View Profile"
                        style={{ backgroundColor: isOnProfile ? "rgba(255,255,255,0.08)" : "transparent" }}
                        onMouseEnter={e => {
                            if (!isOnProfile) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                        }}
                        onMouseLeave={e => {
                            if (!isOnProfile) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
                        {/* Avatar */}
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                            style={{
                                backgroundColor: "#10B981",
                                color: "#003824",
                                boxShadow: isOnProfile ? "0 0 14px rgba(78,222,163,0.50)" : "none",
                                outline: isOnProfile ? "2px solid rgba(78,222,163,0.40)" : "none",
                                outlineOffset: "2px"
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>

                        {/* Username + subtitle */}
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.90)" }}>
                                {user?.username}
                            </p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>PRECISION LEDGER</p>
                        </div>
                    </Link>
                )}

                {/* Add Expense Button */}
                <button
                    onClick={onAddExpense}
                    title={collapsed ? "Add Expense" : undefined}
                    className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-all"
                    style={{ background: "linear-gradient(135deg, #4edea3, #10b981)", color: "#003824" }}
                    onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = "0 0 18px rgba(78,222,163,0.40)";
                        e.currentTarget.style.opacity = "0.92";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.opacity = "1";
                    }}
                >
                    <Plus size={16} />
                    {!collapsed && <span>Add Expense</span>}
                </button>

                {/* Logout */}
                <button
                    onClick={logout}
                    title={collapsed ? "Logout" : undefined}
                    className="w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg transition-all"
                    style={{ color: "rgba(255,255,255,0.40)", backgroundColor: "transparent" }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.40)";
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <LogOut size={14} />
                    {!collapsed && <span>Logout</span>}
                </button>

            </div>
        </div>
    );
}

export default SideBar;
