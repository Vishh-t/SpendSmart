import { useState, useEffect, useRef } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { getSortedExpenses, getExpensesByCategory, deleteExpense, getFinancialSummary } from "../services/expenseService.js";
import { getAllCategories } from "../services/categoryService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { formatDateUpper } from "../utils/formatDate.js";
import { LoadingState, ErrorState } from "../components/ui/PageState.jsx";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import EditExpenseModal from "../components/modals/EditExpenseModal.jsx";
import CategoryExpensesModal from "../components/modals/CategoryExpensesModal.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useData } from "../context/DataContext.jsx";

const ITEMS_PER_PAGE = 5;

function ExpensesPage() {
    const [expenses,         setExpenses]         = useState([]);
    const [categories,       setCategories]       = useState([]);
    const [financialSummary, setFinancialSummary] = useState(null);
    const [isLoading,        setIsLoading]        = useState(true);
    const [error,            setError]            = useState(null);

    const [searchQuery,      setSearchQuery]      = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy,           setSortBy]           = useState("expenseTimestamp");
    const [order,            setOrder]            = useState("desc");
    const [currentPage,      setCurrentPage]      = useState(1);

    const [confirmExpenseId, setConfirmExpenseId] = useState(null);
    const [editExpense,      setEditExpense]      = useState(null);
    const [categoryModal,    setCategoryModal]    = useState(null);
    const [dropdownOpen,     setDropdownOpen]     = useState(false);
    const dropdownRef = useRef(null);

    const { isDark } = useTheme();
    const { refreshKey, triggerRefresh } = useData();

    const badgeGlowColor = isDark ? "rgba(78, 222, 163, 0.55)" : "rgba(16, 185, 129, 0.45)";

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredExpenses = expenses.filter(expense =>
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotal = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const showFilteredTotal = searchQuery.trim() !== "" || selectedCategory !== "all";

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const safeGet = (promise) => promise.catch(err => { if (err.response?.status === 404) return null; throw err; });
                const [expensesData, categoriesData, summaryData] = await Promise.all([
                    safeGet(getSortedExpenses(sortBy, order)),
                    safeGet(getAllCategories()),
                    safeGet(getFinancialSummary())
                ]);
                setExpenses(expensesData ?? []);
                setCategories(categoriesData ?? []);
                setFinancialSummary(summaryData ?? null);
            } catch (err) {
                setError("Failed to load expenses.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitialData().catch(console.error);
    }, [refreshKey]);

    async function handleCategoryChange(categoryId) {
        setSelectedCategory(categoryId); setSearchQuery(""); setCurrentPage(1); setDropdownOpen(false);
        try {
            const data = categoryId === "all" ? await getSortedExpenses(sortBy, order) : await getExpensesByCategory(categoryId);
            setExpenses(data);
        } catch { setExpenses([]); }
    }

    async function handleSortChange(newSortBy) {
        const newOrder = sortBy === newSortBy && order === "desc" ? "asc" : "desc";
        setSortBy(newSortBy); setOrder(newOrder); setCurrentPage(1);
        try { const data = await getSortedExpenses(newSortBy, newOrder); setExpenses(data); }
        catch { }
    }

    async function handleDelete(expenseId) {
        try { await deleteExpense(expenseId); setConfirmExpenseId(null); triggerRefresh(); }
        catch { }
    }

    async function handleEditSuccess() { setEditExpense(null); triggerRefresh(); }

    const totalPages        = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (isLoading) return <LoadingState />;
    if (error)     return <ErrorState message={error} />;

    return (
        <div className="flex flex-col gap-4 md:gap-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Expenses</h1>
                    <p className="text-text-secondary text-xs md:text-sm mt-1">Review and manage your precision ledger entries.</p>
                </div>
                {/* Stats — hidden on mobile to save space */}
                <div className="hidden sm:flex gap-6 md:gap-8">
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">MONTHLY BURN</p>
                        <p className="text-primary text-base md:text-lg font-bold">₹{formatCurrency(financialSummary?.totalSpent)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">AVG. TRANSACTION</p>
                        <p className="text-text-primary text-base md:text-lg font-bold">₹{formatCurrency(financialSummary?.averageExpenseValue)}</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                {/* Search */}
                <div className="flex items-center gap-2 bg-surface-high rounded-lg px-3 py-2.5 flex-1 min-w-0">
                    <Search size={15} className="text-text-secondary shrink-0" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-text-primary text-sm outline-none placeholder-text-secondary w-full min-w-0"
                    />
                </div>

                <div className="flex gap-2 shrink-0">
                    {/* Category Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-1.5 bg-surface-high text-text-primary text-xs rounded-lg px-3 py-2.5 w-full justify-between hover:bg-surface-bright transition-all"
                            style={{ minWidth: "110px" }}
                        >
                            <span className="truncate max-w-20">
                                {selectedCategory === "all" ? "All" : categories.find(c => c.categoryId === parseInt(selectedCategory))?.categoryName}
                            </span>
                            <span className="text-text-secondary text-xs shrink-0">{dropdownOpen ? "▲" : "▼"}</span>
                        </button>
                        {dropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 w-full z-20 rounded-lg shadow-lg overflow-y-auto"
                                style={{ backgroundColor: "rgba(var(--raw-dropdown-bg), 0.97)", backdropFilter: "blur(12px)", border: "1px solid rgba(78, 222, 163, 0.15)", maxHeight: "224px" }}>
                                <button onClick={() => handleCategoryChange("all")}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-bright ${selectedCategory === "all" ? "text-primary" : "text-text-secondary"}`}>
                                    All Categories
                                </button>
                                {categories.map((cat) => (
                                    <button key={cat.categoryId} onClick={() => handleCategoryChange(String(cat.categoryId))}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-bright ${selectedCategory === String(cat.categoryId) ? "text-primary" : "text-text-secondary"}`}>
                                        {cat.categoryName}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort Toggle */}
                    <button
                        onClick={() => handleSortChange(sortBy === "expenseTimestamp" ? "amount" : "expenseTimestamp")}
                        className="flex items-center gap-1.5 md:gap-2 bg-surface-high text-text-secondary text-sm rounded-lg px-3 md:px-4 py-2.5 hover:bg-surface-bright transition-all shrink-0"
                    >
                        <ArrowUpDown size={14} />
                        <span className="text-primary font-medium hidden sm:inline">{sortBy === "expenseTimestamp" ? "Date" : "Amount"}</span>
                        <span className="text-primary">{order === "desc" ? "↓" : "↑"}</span>
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="bg-surface-high rounded-xl hidden md:block">
                <table className="w-full">
                    <thead>
                        <tr className="text-text-secondary text-xs tracking-widest border-b border-surface-bright">
                            <th className="text-left p-5 font-medium">DATE</th>
                            <th className="text-left p-5 font-medium">DESCRIPTION</th>
                            <th className="text-left p-5 font-medium">CATEGORY</th>
                            <th className="text-right p-5 font-medium">AMOUNT</th>
                            <th className="text-right p-5 font-medium">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedExpenses.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-text-secondary text-sm py-12">
                                {expenses.length === 0 ? "No expenses yet — add one to get started." : "No expenses found."}
                            </td></tr>
                        ) : (
                            paginatedExpenses.map((expense) => (
                                <tr key={expense.expenseId} className="border-t border-surface-bright hover:bg-surface-bright/20 transition-all">
                                    <td className="p-5 text-text-secondary text-xs">{formatDateUpper(expense.expenseTimestamp)}</td>
                                    <td className="p-5 text-text-primary text-sm">{expense.description || "—"}</td>
                                    <td className="p-5">
                                        <button onClick={() => setCategoryModal({ id: expense.category?.categoryId, name: expense.category?.categoryName })}
                                            className="text-xs px-3 py-1 rounded-full transition-all"
                                            style={{ backgroundColor: "var(--color-surface-low)", color: "var(--color-text-secondary)", border: "1px solid transparent" }}
                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 12px ${badgeGlowColor}`; e.currentTarget.style.border = `1px solid ${isDark ? "rgba(78,222,163,0.35)" : "rgba(16,185,129,0.35)"}`; e.currentTarget.style.color = "var(--color-primary)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.border = "1px solid transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                                            {expense.category?.categoryName}
                                        </button>
                                    </td>
                                    <td className="p-5 text-right text-text-primary text-sm font-medium">-₹{formatCurrency(expense.amount)}</td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => setEditExpense(expense)} className="text-text-secondary text-xs hover:text-primary transition-all">Edit</button>
                                            <button onClick={() => setConfirmExpenseId(expense.expenseId)} className="text-text-secondary text-xs hover:text-error transition-all">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {showFilteredTotal && filteredExpenses.length > 0 && (
                        <tfoot>
                            <tr className="border-t-2" style={{ borderColor: "rgba(78,222,163,0.20)" }}>
                                <td colSpan={3} className="px-5 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                    Total across {filteredExpenses.length} result{filteredExpenses.length !== 1 ? "s" : ""}
                                    {searchQuery.trim() !== "" && <span className="ml-1">for <span style={{ color: "var(--color-text-primary)" }}>"{searchQuery}"</span></span>}
                                </td>
                                <td className="px-5 py-3 text-right text-sm font-bold" style={{ color: "var(--color-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                                    -₹{filteredTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    )}
                </table>
                {filteredExpenses.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-surface-bright">
                        <p className="text-text-secondary text-xs">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} of {filteredExpenses.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg bg-surface-low text-text-secondary text-xs hover:text-text-primary disabled:opacity-30">‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                .map((page, index, arr) => (
                                    <>
                                        {index > 0 && arr[index - 1] !== page - 1 && <span key={`dots-${page}`} className="text-text-secondary text-xs">...</span>}
                                        <button key={page} onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-xs transition-all ${currentPage === page ? "bg-primary text-surface font-semibold" : "bg-surface-low text-text-secondary hover:text-text-primary"}`}>
                                            {page}
                                        </button>
                                    </>
                                ))}
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg bg-surface-low text-text-secondary text-xs hover:text-text-primary disabled:opacity-30">›</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Card List */}
            <div className="flex flex-col gap-2 md:hidden">
                {paginatedExpenses.length === 0 ? (
                    <p className="text-center text-text-secondary text-sm py-8">
                        {expenses.length === 0 ? "No expenses yet." : "No expenses found."}
                    </p>
                ) : (
                    paginatedExpenses.map((expense) => (
                        <div key={expense.expenseId} className="bg-surface-high rounded-xl p-4 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-text-primary text-sm font-medium truncate">{expense.description || "—"}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-low text-text-secondary">
                                        {expense.category?.categoryName}
                                    </span>
                                    <span className="text-text-secondary text-[10px]">{formatDateUpper(expense.expenseTimestamp)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-text-primary text-sm font-semibold">-₹{formatCurrency(expense.amount)}</span>
                                <div className="flex gap-3">
                                    <button onClick={() => setEditExpense(expense)} className="text-primary text-xs">Edit</button>
                                    <button onClick={() => setConfirmExpenseId(expense.expenseId)} className="text-error text-xs">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {/* Mobile pagination */}
                {filteredExpenses.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-1 pt-2">
                        <p className="text-text-secondary text-xs">{currentPage}/{totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg bg-surface-high text-text-secondary text-xs disabled:opacity-30">‹</button>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg bg-surface-high text-text-secondary text-xs disabled:opacity-30">›</button>
                        </div>
                    </div>
                )}
            </div>

            {confirmExpenseId && <ConfirmModal message="Are you sure you want to delete this expense?" onConfirm={() => handleDelete(confirmExpenseId)} onCancel={() => setConfirmExpenseId(null)} />}
            {editExpense      && <EditExpenseModal expense={editExpense} onClose={() => setEditExpense(null)} onSuccess={handleEditSuccess} />}
            {categoryModal    && <CategoryExpensesModal category={categoryModal} onClose={() => setCategoryModal(null)} />}
        </div>
    );
}

export default ExpensesPage;
