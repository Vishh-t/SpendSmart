import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Loader2, Target } from "lucide-react";
import { getAllCategories, addCategory, deleteCategory, setCategoryBudget, getCategoryBudgetSummary } from "../services/categoryService.js";
import { getFinancialSummary } from "../services/expenseService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { LoadingState, ErrorState } from "../components/ui/PageState.jsx";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const CATEGORY_ICONS = ["🏠","🛒","🚗","🎬","⚡","💊","✈️","📚","💻","🍔","👕","🎮","💰","🏋️","🎵"];
const COLORS_DARK  = ["#4edea3","#60a5fa","#f59e0b","#a78bfa","#34d399","#fb923c","#f472b6","#38bdf8","#4ade80","#facc15","#c084fc","#2dd4bf"];
const COLORS_LIGHT = ["#059669","#2563eb","#d97706","#7c3aed","#16a34a","#ea580c","#db2777","#0284c7","#15803d","#ca8a04","#9333ea","#0d9488"];

function CategoryCard({ category, totalSpent, budgetStatus, onDelete, onBudgetSet, colorIndex }) {
    const { isDark } = useTheme();
    const icon   = CATEGORY_ICONS[colorIndex % CATEGORY_ICONS.length];
    const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
    const color  = colors[colorIndex % colors.length];

    const [editingBudget, setEditingBudget] = useState(false);
    const [budgetInput,   setBudgetInput]   = useState("");
    const [budgetLoading, setBudgetLoading] = useState(false);

    async function handleBudgetSave() {
        const val = parseFloat(budgetInput);
        if (!val || val <= 0) return;
        setBudgetLoading(true);
        try { await setCategoryBudget(category.categoryId, val); onBudgetSet(); setEditingBudget(false); setBudgetInput(""); }
        finally { setBudgetLoading(false); }
    }

    const cardBg          = isDark ? "rgba(26,36,56,0.9)" : "#FFFFFF";
    const cardBorderIdle  = isDark ? "rgba(61,73,98,0.5)" : "rgba(0,108,73,0.10)";
    const cardShadowIdle  = isDark ? "none" : "0 4px 20px rgba(0,0,0,0.04)";
    const cardShadowHover = isDark ? "none" : "0 8px 28px rgba(0,0,0,0.08)";
    const barColor = budgetStatus?.status === "EXCEEDED" ? "#ef4444" : budgetStatus?.status === "WARNING" ? "#f59e0b" : color;
    const pct = budgetStatus ? Math.min(parseFloat(budgetStatus.percentage), 100) : 0;

    return (
        <div
            className="rounded-2xl p-5 md:p-6 flex flex-col gap-3 md:gap-4 transition-all group"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorderIdle}`, boxShadow: cardShadowIdle }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${color}55`; e.currentTarget.style.boxShadow = isDark ? `0 0 0 1px ${color}22` : cardShadowHover; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${cardBorderIdle}`; e.currentTarget.style.boxShadow = cardShadowIdle; }}
        >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl" style={{ backgroundColor: `${color}18` }}>
                {icon}
            </div>
            <div>
                <h3 className="text-text-primary font-semibold text-base md:text-lg leading-tight">{category.categoryName}</h3>
                <p className="text-text-secondary text-xs tracking-widest mt-0.5">EXPENSE SECTOR</p>
            </div>
            <div className="flex items-baseline gap-1">
                <p className="font-bold text-xl md:text-2xl" style={{ color, fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                    ₹{formatCurrency(totalSpent)}
                </p>
                <span className="text-sm font-normal" style={{ color: isDark ? "#8892a4" : "#4A6358" }}>total</span>
            </div>
            {budgetStatus ? (
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: isDark ? "#8892a4" : "#4A6358" }}>₹{formatCurrency(budgetStatus.spentThisMonth)} / ₹{formatCurrency(budgetStatus.categoryBudget)}</span>
                        <span className="text-xs font-bold" style={{ color: barColor }}>{budgetStatus.status}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <button onClick={() => { setEditingBudget(true); setBudgetInput(budgetStatus.monthlyBudget); }}
                        className="text-xs self-start opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: isDark ? "#8892a4" : "#4A6358" }}>edit budget</button>
                </div>
            ) : (
                !editingBudget && (
                    <button onClick={() => setEditingBudget(true)}
                        className="flex items-center gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-all self-start"
                        style={{ color: isDark ? "#8892a4" : "#4A6358" }}
                        onMouseEnter={e => e.currentTarget.style.color = color}
                        onMouseLeave={e => e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"}>
                        <Target size={11} /> Set budget
                    </button>
                )
            )}
            {editingBudget && (
                <div className="flex gap-2 items-center">
                    <input autoFocus type="number" placeholder="Monthly budget" value={budgetInput}
                        onChange={e => setBudgetInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleBudgetSave(); if (e.key === "Escape") setEditingBudget(false); }}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none text-text-primary"
                        style={{ backgroundColor: isDark ? "rgba(11,19,38,0.8)" : "#F4F7F5", border: `1px solid ${color}55` }} />
                    <button onClick={handleBudgetSave} disabled={budgetLoading} className="px-2 py-1.5 rounded-lg text-xs font-bold" style={{ background: `${color}22`, color }}>
                        {budgetLoading ? "…" : "Save"}
                    </button>
                    <button onClick={() => setEditingBudget(false)} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>✕</button>
                </div>
            )}
            <button onClick={() => onDelete(category.categoryId, category.categoryName)}
                className="flex items-center gap-1.5 text-xs transition-all opacity-0 group-hover:opacity-100 self-start"
                style={{ color: isDark ? "#8892a4" : "#4A6358" }}
                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"}>
                <Trash2 size={12} /> Remove sector
            </button>
        </div>
    );
}

function AddCategoryCard({ onAdd }) {
    const { isDark } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [name,      setName]      = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState("");

    const primaryColor = isDark ? "#4edea3" : "#10B981";
    const cardBg       = isDark ? "rgba(26,36,56,0.9)" : "#FFFFFF";
    const inputBg      = isDark ? "rgba(11,19,38,0.8)" : "#F4F7F5";
    const inputBorder  = isDark ? "rgba(78,222,163,0.3)" : "rgba(0,108,73,0.25)";
    const cancelBg     = isDark ? "rgba(49,57,77,0.8)" : "#E8EDE9";
    const dashedBorder = isDark ? "rgba(78,222,163,0.3)" : "rgba(0,108,73,0.25)";
    const dashedHover  = isDark ? "rgba(78,222,163,0.6)" : "rgba(0,108,73,0.55)";

    async function handleSubmit() {
        if (!name.trim()) return;
        setIsLoading(true); setError("");
        try { await addCategory(name.trim()); setName(""); setIsEditing(false); onAdd(); }
        catch { setError("Category already exists."); }
        finally { setIsLoading(false); }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSubmit();
        if (e.key === "Escape") { setIsEditing(false); setName(""); setError(""); }
    }

    if (!isEditing) {
        return (
            <button onClick={() => setIsEditing(true)}
                className="rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-40 md:min-h-52"
                style={{ backgroundColor: "transparent", border: `1px dashed ${dashedBorder}` }}
                onMouseEnter={e => e.currentTarget.style.border = `1px dashed ${dashedHover}`}
                onMouseLeave={e => e.currentTarget.style.border = `1px dashed ${dashedBorder}`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}18` }}>
                    <Plus size={18} style={{ color: primaryColor }} />
                </div>
                <div className="text-center">
                    <p className="text-text-primary text-sm font-medium">Initialize New Sector</p>
                    <p className="text-text-secondary text-xs mt-1">Add a custom category</p>
                </div>
            </button>
        );
    }

    return (
        <div className="rounded-2xl p-5 md:p-6 flex flex-col gap-4 min-h-40 md:min-h-52"
            style={{ backgroundColor: cardBg, border: `1px solid ${primaryColor}55` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}18` }}>
                <Tag size={16} style={{ color: primaryColor }} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
                <p className="text-text-secondary text-xs tracking-widest">NEW SECTOR NAME</p>
                <input autoFocus type="text" placeholder="e.g. Entertainment, Food…" value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all text-text-primary placeholder-text-secondary"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }} />
                {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
            </div>
            <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={isLoading || !name.trim()}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                        background: isLoading || !name.trim() ? (isDark ? "rgba(45,52,73,0.8)" : "#E8EDE9") : (isDark ? "linear-gradient(135deg,#4edea3,#10b981)" : "linear-gradient(135deg,#10B981,#059669)"),
                        color: isLoading || !name.trim() ? (isDark ? "#8892a4" : "#4A6358") : "#003824",
                        cursor: isLoading || !name.trim() ? "not-allowed" : "pointer",
                    }}>
                    {isLoading ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : "Add"}
                </button>
                <button onClick={() => { setIsEditing(false); setName(""); setError(""); }}
                    className="px-4 py-2 rounded-xl text-sm text-text-secondary transition-all"
                    style={{ backgroundColor: cancelBg }}>Cancel</button>
            </div>
        </div>
    );
}

function CategoriesPage() {
    const { isDark } = useTheme();
    const [categories,       setCategories]    = useState([]);
    const [financialSummary, setFinancialSummary] = useState(null);
    const [budgetSummary,    setBudgetSummary]  = useState([]);
    const [isLoading,        setIsLoading]      = useState(true);
    const [error,            setError]          = useState(null);
    const [confirmDelete,    setConfirmDelete]  = useState(null);
    const [deleteError,      setDeleteError]    = useState("");

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        try {
            const safeGet = (promise) => promise.catch(err => { if (err.response?.status === 404) return null; throw err; });
            const [cats, summary, budgets] = await Promise.all([
                safeGet(getAllCategories()),
                safeGet(getFinancialSummary()),
                safeGet(getCategoryBudgetSummary())
            ]);
            setCategories(cats ?? []); setFinancialSummary(summary ?? null); setBudgetSummary(budgets ?? []);
        } catch { setError("Failed to load categories."); }
        finally { setIsLoading(false); }
    }

    async function handleDelete(categoryId) {
        try {
            await deleteCategory(categoryId); setConfirmDelete(null); setDeleteError("");
            const [cats, summary, budgets] = await Promise.all([getAllCategories(), getFinancialSummary(), getCategoryBudgetSummary().catch(() => [])]);
            setCategories(cats); setFinancialSummary(summary); setBudgetSummary(budgets ?? []);
        } catch (err) {
            setConfirmDelete(null);
            if (err.response?.status === 409) setDeleteError(`Cannot delete "${confirmDelete?.name}" — it has expenses linked to it.`);
            else setDeleteError("Failed to delete category.");
        }
    }

    if (isLoading) return <LoadingState />;
    if (error)     return <ErrorState message={error} />;

    const totalExposure = financialSummary?.totalSpent ?? 0;

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Categories</h1>
                    <p className="text-text-secondary text-xs md:text-sm mt-1">Organize your ledger into precision sectors</p>
                </div>
                <div className="hidden sm:flex gap-6 md:gap-8">
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">TOTAL SECTORS</p>
                        <p className="text-base md:text-lg font-bold" style={{ color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>{categories.length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">TOTAL EXPOSURE</p>
                        <p className="text-text-primary text-base md:text-lg font-bold" style={{ fontFamily: "'Berkeley Mono','Courier New',monospace" }}>₹{formatCurrency(totalExposure)}</p>
                    </div>
                </div>
            </div>

            {deleteError && (
                <div className="flex items-center justify-between px-5 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)", color: "#ef4444" }}>
                    <span>{deleteError}</span>
                    <button onClick={() => setDeleteError("")} className="ml-4 text-lg leading-none hover:opacity-70">×</button>
                </div>
            )}

            {/* Grid — 1 col mobile, 2 tablet, 3 desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {categories.map((cat, index) => (
                    <CategoryCard
                        key={cat.categoryId}
                        category={cat}
                        totalSpent={financialSummary?.categoryBreakdown?.[cat.categoryName] || 0}
                        budgetStatus={budgetSummary.find(b => b.categoryName === cat.categoryName) ?? null}
                        onDelete={(id, name) => setConfirmDelete({ id, name })}
                        onBudgetSet={fetchData}
                        colorIndex={index}
                    />
                ))}
                <AddCategoryCard onAdd={fetchData} />
            </div>

            {categories.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-text-secondary text-sm">No sectors initialized yet.</p>
                    <p className="text-text-secondary text-xs mt-1">Add your first category above.</p>
                </div>
            )}

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
