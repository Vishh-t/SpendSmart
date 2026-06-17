import React, { useState, useEffect, useRef } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import {
    getFilteredPaginatedExpenses,
    deleteExpense,
    getFinancialSummary,
    getPaginatedExpenses
} from "../services/expenseService.js";
import { getAllCategories } from "../services/categoryService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { formatDateUpper } from "../utils/formatDate.js";
import { ErrorState, ExpensesSkeleton } from "../components/ui/PageState.jsx";
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
    const [isTableLoading,   setIsTableLoading]   = useState(false);
    const [hasLoadedOnce,    setHasLoadedOnce]    = useState(false);
    const [error,            setError]            = useState(null);

    // Server-side pagination tracking
    const [totalPages,       setTotalPages]       = useState(1);
    const [totalElements,    setTotalElements]    = useState(0);
    const [filteredTotal,    setFilteredTotal]    = useState(0);

    const [searchQuery,      setSearchQuery]      = useState("");
    const [searchInput,      setSearchInput]      = useState("");
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
    const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "all";

    // Debounce search input → searchQuery (300ms)
    useEffect(() => {
        const handle = setTimeout(() => {
            setSearchQuery(searchInput);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(handle);
    }, [searchInput]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Main Data Fetcher
    useEffect(() => {
        async function loadData() {
            try {
                setIsTableLoading(true);

                // Fetch basic config data once
                if (categories.length === 0) {
                    const [cats, summary] = await Promise.all([
                        getAllCategories().catch(() => []),
                        getFinancialSummary().catch(() => null)
                    ]);
                    setCategories(cats);
                    setFinancialSummary(summary);
                }

                // Always server-side paginated — filtered or not, only the matching page is fetched
                const data = isFiltering
                    ? await getFilteredPaginatedExpenses(
                        currentPage - 1, ITEMS_PER_PAGE, sortBy, order,
                        selectedCategory !== "all" ? selectedCategory : null,
                        searchQuery.trim() !== "" ? searchQuery.trim() : null
                      )
                    : await getPaginatedExpenses(currentPage - 1, ITEMS_PER_PAGE, sortBy, order);

                setExpenses(data.content || []);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || 0);
            } catch (err) {
                setError("Failed to load expenses.");
            } finally {
                setIsLoading(false);
                setIsTableLoading(false);
                setHasLoadedOnce(true);
            }
        }

        loadData();
    }, [currentPage, sortBy, order, selectedCategory, searchQuery, refreshKey]);

    function handleCategoryChange(categoryId) {
        setSelectedCategory(categoryId);
        setSearchQuery("");
        setCurrentPage(1);
        setDropdownOpen(false);
    }

    function handleSortChange(newSortBy) {
        const newOrder = sortBy === newSortBy && order === "desc" ? "asc" : "desc";
        setSortBy(newSortBy);
        setOrder(newOrder);
        setCurrentPage(1);
    }

    async function handleDelete(expenseId) {
        try { await deleteExpense(expenseId); setConfirmExpenseId(null); triggerRefresh(); }
        catch { }
    }

    async function handleEditSuccess() { setEditExpense(null); triggerRefresh(); }

    if (isLoading && !hasLoadedOnce) return <ExpensesSkeleton />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="flex flex-col gap-4 md:gap-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Expenses</h1>
                    <p className="text-text-secondary text-xs md:text-sm mt-1">Review and manage your precision ledger entries.</p>
                </div>
                {/* Stats */}
                <div className="hidden sm:flex gap-6 md:gap-8">
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">TOTAL BURN</p>
                        <p className="text-primary text-base md:text-lg font-bold">₹{formatCurrency(financialSummary?.totalSpent)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-text-secondary text-xs tracking-widest">AVG. MONTHLY BURN</p>
                        <p className="text-text-primary text-base md:text-lg font-bold">₹{formatCurrency(financialSummary?.averageMonthlySpend)}</p>
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
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="bg-transparent text-text-primary text-sm outline-none placeholder-text-secondary w-full min-w-0"
                    />
                    {isTableLoading && (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    )}
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
            <div className="bg-surface-high rounded-xl hidden md:block relative">
                {isTableLoading && (
                    <div className="absolute inset-0 z-10 rounded-xl" style={{ backgroundColor: "rgba(var(--raw-modal-bg), 0.35)", backdropFilter: "blur(1px)" }} />
                )}
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
                    {expenses.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-text-secondary text-sm py-12">
                            {totalElements === 0 && !isFiltering ? "No expenses yet — add one to get started." : "No expenses found."}
                        </td></tr>
                    ) : (
                        expenses.map((expense) => (
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
                    {isFiltering && expenses.length > 0 && (
                        <tfoot>
                        <tr className="border-t-2" style={{ borderColor: "rgba(78,222,163,0.20)" }}>
                            <td colSpan={5} className="px-5 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                {totalElements} result{totalElements !== 1 ? "s" : ""}
                                {searchQuery.trim() !== "" && <span className="ml-1">for <span style={{ color: "var(--color-text-primary)" }}>"{searchQuery}"</span></span>}
                            </td>
                        </tr>
                        </tfoot>
                    )}
                </table>
                {totalElements > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-surface-bright">
                        <p className="text-text-secondary text-xs">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalElements)} of {totalElements} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg bg-surface-low text-text-secondary text-xs hover:text-text-primary disabled:opacity-30">‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                .map((page, index, arr) => (
                                    <React.Fragment key={page}>
                                        {index > 0 && arr[index - 1] !== page - 1 && <span className="text-text-secondary text-xs">...</span>}
                                        <button onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-lg text-xs transition-all ${currentPage === page ? "bg-primary text-surface font-semibold" : "bg-surface-low text-text-secondary hover:text-text-primary"}`}>
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))}
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg bg-surface-low text-text-secondary text-xs hover:text-text-primary disabled:opacity-30">›</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Card List */}
            <div className="flex flex-col gap-3 md:hidden">
                {expenses.length === 0 ? (
                    <p className="text-center text-text-secondary text-sm py-8">
                        {totalElements === 0 && !isFiltering ? "No expenses yet." : "No expenses found."}
                    </p>
                ) : (
                    expenses.map((expense) => (
                        <div key={expense.expenseId} className="bg-surface-high rounded-xl p-4 flex items-start gap-3 border border-surface-bright/40 shadow-sm">
                            <div className="flex-1 min-w-0">
                                <p className="text-text-primary text-sm font-medium truncate">{expense.description || "—"}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-low text-text-secondary">
                                        {expense.category?.categoryName}
                                    </span>
                                    <span className="text-text-secondary text-[10px]">{formatDateUpper(expense.expenseTimestamp)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                                <span className="text-text-primary text-sm font-semibold">-₹{formatCurrency(expense.amount)}</span>
                                <div className="flex gap-3 mt-1.5">
                                    <button onClick={() => setEditExpense(expense)} className="text-primary text-xs font-medium">Edit</button>
                                    <button onClick={() => setConfirmExpenseId(expense.expenseId)} className="text-error text-xs font-medium">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {totalElements > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-1 pt-3 border-t border-surface-bright/20 mt-1">
                        <p className="text-text-secondary text-xs font-medium">Page {currentPage} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-9 h-9 rounded-lg bg-surface-high text-text-secondary text-sm flex items-center justify-center border border-surface-bright active:bg-surface-bright disabled:opacity-30">‹</button>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-9 h-9 rounded-lg bg-surface-high text-text-secondary text-sm flex items-center justify-center border border-surface-bright active:bg-surface-bright disabled:opacity-30">›</button>
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