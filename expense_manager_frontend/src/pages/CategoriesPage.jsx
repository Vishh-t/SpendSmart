import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { getAllCategories, addCategory, deleteCategory } from "../services/categoryService.js";
import { getFinancialSummary } from "../services/expenseService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { LoadingState, ErrorState } from "../components/ui/PageState.jsx";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

// ─── icon + colour pools ──────────────────────────────────────────────────
const CATEGORY_ICONS = [
    "🏠","🛒","🚗","🎬","⚡","💊","✈️","📚","💻","🍔","👕","🎮","💰","🏋️","🎵"
];
const COLORS_DARK  = [
    "#4edea3","#60a5fa","#f59e0b","#a78bfa",
    "#34d399","#fb923c","#f472b6","#38bdf8",
    "#4ade80","#facc15","#c084fc","#2dd4bf"
];
const COLORS_LIGHT = [
    "#059669","#2563eb","#d97706","#7c3aed",
    "#16a34a","#ea580c","#db2777","#0284c7",
    "#15803d","#ca8a04","#9333ea","#0d9488"
];

// ─── CategoryCard ─────────────────────────────────────────────────────────
function CategoryCard({ category, totalSpent, onDelete, colorIndex }) {
    const { isDark } = useTheme();
    const icon   = CATEGORY_ICONS[colorIndex % CATEGORY_ICONS.length];
    const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
    const color  = colors[colorIndex % colors.length];

    // card bg + border tokens
    const cardBg          = isDark ? "rgba(26,36,56,0.9)"         : "#FFFFFF";
    const cardBorderIdle  = isDark ? "rgba(61,73,98,0.5)"         : "rgba(0,108,73,0.10)";
    const cardShadowIdle  = isDark ? "none"                        : "0 4px 20px rgba(0,0,0,0.04)";
    const cardShadowHover = isDark ? "none"                        : "0 8px 28px rgba(0,0,0,0.08)";

    return (
        <div
            className="rounded-2xl p-6 flex flex-col gap-4 transition-all group"
            style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorderIdle}`,
                boxShadow: cardShadowIdle,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.border = `1px solid ${color}55`;
                e.currentTarget.style.boxShadow = isDark
                    ? `0 0 0 1px ${color}22`
                    : cardShadowHover;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.border = `1px solid ${cardBorderIdle}`;
                e.currentTarget.style.boxShadow = cardShadowIdle;
            }}
        >
            {/* Icon box */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${color}18` }}
            >
                {icon}
            </div>

            {/* Name + subtitle */}
            <div>
                <h3 className="text-text-primary font-semibold text-lg leading-tight">
                    {category.categoryName}
                </h3>
                <p className="text-text-secondary text-xs tracking-widest mt-0.5">EXPENSE SECTOR</p>
            </div>

            {/* Total spent */}
            <div className="flex items-baseline gap-1">
                <p
                    className="font-bold text-2xl"
                    style={{ color, fontFamily: "'Berkeley Mono','Courier New',monospace" }}
                >
                    ₹{formatCurrency(totalSpent)}
                </p>
                <span
                    className="text-sm font-normal"
                    style={{ color: isDark ? "#8892a4" : "#4A6358" }}
                >
                    total
                </span>
            </div>

            {/* Delete button — appears on hover */}
            <button
                onClick={() => onDelete(category.categoryId, category.categoryName)}
                className="flex items-center gap-1.5 text-xs transition-all opacity-0 group-hover:opacity-100 self-start"
                style={{ color: isDark ? "#8892a4" : "#4A6358" }}
                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"}
            >
                <Trash2 size={12} />
                Remove sector
            </button>
        </div>
    );
}

// ─── AddCategoryCard — inline card in the grid ────────────────────────────
function AddCategoryCard({ onAdd }) {
    const { isDark } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [name,      setName]      = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState("");

    const primaryColor  = isDark ? "#4edea3" : "#10B981";
    const cardBg        = isDark ? "rgba(26,36,56,0.9)" : "#FFFFFF";
    const inputBg       = isDark ? "rgba(11,19,38,0.8)" : "#F4F7F5";
    const inputBorder   = isDark ? "rgba(78,222,163,0.3)" : "rgba(0,108,73,0.25)";
    const cancelBg      = isDark ? "rgba(49,57,77,0.8)"   : "#E8EDE9";
    const dashedBorder  = isDark ? "rgba(78,222,163,0.3)" : "rgba(0,108,73,0.25)";
    const dashedHover   = isDark ? "rgba(78,222,163,0.6)" : "rgba(0,108,73,0.55)";

    async function handleSubmit() {
        if (!name.trim()) return;
        setIsLoading(true);
        setError("");
        try {
            await addCategory(name.trim());
            setName("");
            setIsEditing(false);
            onAdd();
        } catch {
            setError("Category already exists.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter")  handleSubmit();
        if (e.key === "Escape") { setIsEditing(false); setName(""); setError(""); }
    }

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-52"
                style={{ backgroundColor: "transparent", border: `1px dashed ${dashedBorder}` }}
                onMouseEnter={e => e.currentTarget.style.border = `1px dashed ${dashedHover}`}
                onMouseLeave={e => e.currentTarget.style.border = `1px dashed ${dashedBorder}`}
            >
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}18` }}
                >
                    <Plus size={20} style={{ color: primaryColor }} />
                </div>
                <div className="text-center">
                    <p className="text-text-primary text-sm font-medium">Initialize New Sector</p>
                    <p className="text-text-secondary text-xs mt-1">Add a custom category</p>
                </div>
            </button>
        );
    }

    return (
        <div
            className="rounded-2xl p-6 flex flex-col gap-4 min-h-52"
            style={{
                backgroundColor: cardBg,
                border: `1px solid ${primaryColor}55`,
            }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}18` }}
            >
                <Tag size={18} style={{ color: primaryColor }} />
            </div>

            <div className="flex flex-col gap-2 flex-1">
                <p className="text-text-secondary text-xs tracking-widest">NEW SECTOR NAME</p>
                <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Entertainment, Food…"
                    value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all text-text-primary placeholder-text-secondary"
                    style={{
                        backgroundColor: inputBg,
                        border: `1px solid ${inputBorder}`,
                    }}
                />
                {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !name.trim()}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                        background: isLoading || !name.trim()
                            ? isDark ? "rgba(45,52,73,0.8)" : "#E8EDE9"
                            : isDark
                                ? "linear-gradient(135deg, #4edea3, #10b981)"
                                : "linear-gradient(135deg, #10B981, #059669)",
                        color: isLoading || !name.trim()
                            ? isDark ? "#8892a4" : "#4A6358"
                            : "#003824",
                        cursor: isLoading || !name.trim() ? "not-allowed" : "pointer",
                    }}
                >
                    {isLoading ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : "Add"}
                </button>
                <button
                    onClick={() => { setIsEditing(false); setName(""); setError(""); }}
                    className="px-4 py-2 rounded-xl text-sm text-text-secondary transition-all"
                    style={{ backgroundColor: cancelBg }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── CategoriesPage ───────────────────────────────────────────────────────
function CategoriesPage() {

    const { isDark } = useTheme();
    const [categories,       setCategories]       = useState([]);
    const [financialSummary, setFinancialSummary] = useState(null);
    const [isLoading,        setIsLoading]         = useState(true);
    const [error,            setError]             = useState(null);
    const [confirmDelete,    setConfirmDelete]      = useState(null);
    const [deleteError,      setDeleteError]        = useState("");

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        try {
            const safeGet = (promise) => promise.catch(err => {
                if (err.response?.status === 404) return null;
                throw err;
            });
            const [cats, summary] = await Promise.all([
                safeGet(getAllCategories()),
                safeGet(getFinancialSummary())
            ]);
            setCategories(cats ?? []);
            setFinancialSummary(summary ?? null);
        } catch {
            setError("Failed to load categories.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(categoryId) {
        try {
            await deleteCategory(categoryId);
            setConfirmDelete(null);
            setDeleteError("");
            const [cats, summary] = await Promise.all([getAllCategories(), getFinancialSummary()]);
            setCategories(cats);
            setFinancialSummary(summary);
        } catch (err) {
            setConfirmDelete(null);
            if (err.response?.status === 409) {
                setDeleteError(`Cannot delete "${confirmDelete?.name}" — it has expenses linked to it.`);
            } else {
                setDeleteError("Failed to delete category.");
            }
        }
    }

    if (isLoading) return <LoadingState />;
    if (error)     return <ErrorState message={error} />;

    const totalExposure = financialSummary?.totalSpent ?? 0;

    return (
        <div className="flex flex-col gap-6">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Categories</h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Organize your ledger into precision sectors
                    </p>
                </div>
                <div className="flex gap-8">
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">TOTAL SECTORS</p>
                        <p
                            className="text-lg font-bold"
                            style={{
                                color: "var(--color-primary)",
                                fontFamily: "'Berkeley Mono','Courier New',monospace"
                            }}
                        >
                            {categories.length}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">TOTAL EXPOSURE</p>
                        <p
                            className="text-text-primary text-lg font-bold"
                            style={{ fontFamily: "'Berkeley Mono','Courier New',monospace" }}
                        >
                            ₹{formatCurrency(totalExposure)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Delete error banner ──────────────────────────────────── */}
            {deleteError && (
                <div
                    className="flex items-center justify-between px-5 py-3 rounded-xl text-sm"
                    style={{
                        backgroundColor: "rgba(239,68,68,0.10)",
                        border: "1px solid rgba(239,68,68,0.30)",
                        color: "#ef4444",
                    }}
                >
                    <span>{deleteError}</span>
                    <button
                        onClick={() => setDeleteError("")}
                        className="ml-4 text-lg leading-none hover:opacity-70 transition-opacity"
                    >×</button>
                </div>
            )}

            {/* ── Grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                {categories.map((cat, index) => (
                    <CategoryCard
                        key={cat.categoryId}
                        category={cat}
                        totalSpent={financialSummary?.categoryBreakdown?.[cat.categoryName] || 0}
                        onDelete={(id, name) => setConfirmDelete({ id, name })}
                        colorIndex={index}
                    />
                ))}
                <AddCategoryCard onAdd={fetchData} />
            </div>

            {/* ── Empty state ───────────────────────────────────────────── */}
            {categories.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-text-secondary text-sm">No sectors initialized yet.</p>
                    <p className="text-text-secondary text-xs mt-1">Add your first category above.</p>
                </div>
            )}

            {/* ── Confirm delete modal ─────────────────────────────────── */}
            {confirmDelete && (
                <ConfirmModal
                    message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
                    onConfirm={() => handleDelete(confirmDelete.id)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

        </div>
    );
}

export default CategoriesPage;
