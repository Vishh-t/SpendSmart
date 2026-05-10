import { useState, useEffect, useRef } from "react";
import { X, Search, Plus, Loader2, ChevronDown, CheckCircle2, CalendarDays } from "lucide-react";
import { updateExpense } from "../../services/expenseService.js";
import { getAllCategories, addCategory } from "../../services/categoryService.js";
import Calendar, { todayDate, toYMD, formatDisplay } from "../ui/Calendar.jsx";

function parseTimestamp(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

function EditExpenseModal({ expense, onClose, onSuccess }) {

    const parsed = parseTimestamp(expense?.expenseTimestamp);
    const td     = todayDate();

    const [amount,      setAmount]      = useState(expense?.amount ? String(expense.amount) : "");
    const [description, setDescription] = useState(expense?.description ?? "");
    const [selYear,     setSelYear]     = useState(parsed?.year  ?? td.year);
    const [selMonth,    setSelMonth]    = useState(parsed?.month ?? td.month);
    const [selDay,      setSelDay]      = useState(parsed?.day   ?? td.day);
    const [calOpen,     setCalOpen]     = useState(false);

    const [categories,       setCategories]       = useState([]);
    const [categorySearch,   setCategorySearch]   = useState(expense?.category?.categoryName ?? "");
    const [selectedCategory, setSelectedCategory] = useState(
        expense?.category ? { categoryId: expense.category.categoryId, categoryName: expense.category.categoryName } : null
    );
    const [dropdownOpen,     setDropdownOpen]     = useState(false);
    const [newCategoryName,  setNewCategoryName]  = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [categoryAdded,    setCategoryAdded]    = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error,        setError]        = useState(null);

    const dropdownRef = useRef(null);
    const calRef      = useRef(null);

    useEffect(() => {
        getAllCategories().then(setCategories).catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        function handleOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const filteredCategories = categories.filter(c =>
        c.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
    );
    const dateLabel = selDay ? formatDisplay(selYear, selMonth, selDay) : "Pick a date…";

    function handleDateSelect(year, month, day) {
        setSelYear(year); setSelMonth(month); setSelDay(day);
        if (day !== null) setCalOpen(false);
    }

    async function handleAddCategory() {
        const name = newCategoryName.trim();
        if (!name) return;
        setIsAddingCategory(true);
        setError(null);
        try {
            await addCategory(name);
            const updated = await getAllCategories();
            setCategories(updated);
            const created = updated.find(c => c.categoryName.toLowerCase() === name.toLowerCase());
            if (created) setSelectedCategory(created);
            setCategoryAdded(true);
            setNewCategoryName("");
            setCategorySearch(created?.categoryName ?? name);
            setDropdownOpen(false);
            setTimeout(() => setCategoryAdded(false), 2000);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to add category.");
        } finally {
            setIsAddingCategory(false);
        }
    }

    async function handleSubmit() {
        setError(null);
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError("Please enter a valid amount greater than 0.");
            return;
        }
        if (!selectedCategory) {
            setError("Please select a category.");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                amount:      Number(amount),
                description: description.trim() || null,
                expenseDate: selDay ? toYMD(selYear, selMonth, selDay) : null,
                categoryId:  selectedCategory.categoryId,
            };
            await updateExpense(expense.expenseId, payload);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to update expense. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const isBusy = isAddingCategory || isSubmitting;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(var(--raw-overlay-bg), 0.75)", backdropFilter: "blur(8px)" }}
        >
            <div
                className="relative w-full max-w-lg mx-4 rounded-2xl p-8 shadow-2xl flex flex-col gap-6"
                style={{
                    backgroundColor: "rgba(var(--raw-modal-bg), 0.95)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(78, 222, 163, 0.15)",
                }}
            >
                {/* ── themed header band ─────────────────────────────────── */}
                <div
                    className="flex items-center justify-between px-7 py-5"
                    style={{
                        background: "linear-gradient(135deg, rgba(78,222,163,0.13) 0%, rgba(16,185,129,0.07) 100%)",
                        borderBottom: "1px solid rgba(78,222,163,0.12)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-1 h-8 rounded-full"
                            style={{ background: "linear-gradient(180deg, #4edea3, #10b981)" }}
                        />
                        <div>
                            <h2 className="text-text-primary font-semibold text-base leading-tight">Edit Expense</h2>
                            <p className="text-text-secondary text-xs mt-0.5">
                                Editing entry <span style={{ fontFamily: "'Berkeley Mono',monospace", color: "var(--color-primary)" }}>#{expense?.expenseId}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose} disabled={isBusy}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(78,222,163,0.12)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── body ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-6 px-7 py-6">

                {/* amount + date */}
                <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-text-secondary text-xs tracking-widest">AMOUNT (₹)</label>
                        <div className="flex items-center gap-2 rounded-lg px-4 py-3.5"
                            style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.8)" }}>
                            <span className="text-text-secondary text-base font-medium">₹</span>
                            <input type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                                className="bg-transparent text-text-primary text-base outline-none placeholder-text-secondary w-full"
                                style={{ fontFamily: "monospace" }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 relative" style={{ minWidth: "168px" }} ref={calRef}>
                        <label className="text-text-secondary text-xs tracking-widest">DATE</label>
                        <button type="button" onClick={() => setCalOpen(o => !o)}
                            className="flex items-center justify-between gap-2 rounded-lg px-4 py-3.5 text-sm text-left"
                            style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.8)" }}>
                            <span style={{ fontFamily: "monospace", color: selDay ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>{dateLabel}</span>
                            <CalendarDays size={14} className="text-text-secondary shrink-0" />
                        </button>
                        {calOpen && (
                            <div className="absolute top-full mt-2 right-0 z-30">
                                <Calendar selectedYear={selYear} selectedMonth={selMonth} selectedDay={selDay} maxDate={td} onSelect={handleDateSelect} />
                            </div>
                        )}
                    </div>
                </div>

                {/* category */}
                <div className="flex flex-col gap-1.5" ref={dropdownRef}>
                    <label className="text-text-secondary text-xs tracking-widest">CATEGORY</label>
                    <button type="button" onClick={() => setDropdownOpen(prev => !prev)} disabled={isAddingCategory}
                        className="flex items-center justify-between w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50"
                        style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.8)" }}
                    >
                        <span className={selectedCategory ? "text-text-primary" : "text-text-secondary"}>
                            {selectedCategory ? selectedCategory.categoryName : "Select a category…"}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {categoryAdded && <CheckCircle2 size={14} className="text-primary" />}
                            <ChevronDown size={14} className={`text-text-secondary transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                        </div>
                    </button>

                    {dropdownOpen && (
                        <div className="rounded-xl overflow-hidden shadow-2xl flex flex-col"
                            style={{
                                backgroundColor: "rgba(var(--raw-dropdown-bg), 0.97)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(78, 222, 163, 0.12)",
                                maxHeight: "280px"
                            }}
                        >
                            <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: "rgba(78, 222, 163, 0.1)" }}>
                                <Search size={13} className="text-text-secondary shrink-0" />
                                <input type="text" placeholder="Search categories…" value={categorySearch}
                                    onChange={e => { setCategorySearch(e.target.value); setNewCategoryName(e.target.value); }}
                                    className="bg-transparent text-text-primary text-sm outline-none placeholder-text-secondary w-full"
                                    autoFocus
                                />
                                {categorySearch && (
                                    <button onClick={() => { setCategorySearch(""); setNewCategoryName(""); }} className="text-text-secondary hover:text-text-primary">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto flex-1" style={{ maxHeight: "160px" }}>
                                {filteredCategories.length === 0 && (
                                    <p className="text-text-secondary text-xs text-center py-4 px-3">
                                        {categorySearch ? `No match for "${categorySearch}"` : "No categories yet."}
                                    </p>
                                )}
                                {filteredCategories.map(cat => (
                                    <button key={cat.categoryId} type="button"
                                        onClick={() => { setSelectedCategory(cat); setCategorySearch(cat.categoryName); setNewCategoryName(""); setDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-high"
                                        style={{ color: selectedCategory?.categoryId === cat.categoryId ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                                    >
                                        {cat.categoryName}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t px-3 py-2.5" style={{ borderColor: "rgba(78, 222, 163, 0.1)" }}>
                                <p className="text-text-secondary text-xs mb-2 tracking-widest">+ NEW CATEGORY</p>
                                <div className="flex items-center gap-2">
                                    <input type="text" placeholder="Enter category name…" value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                                        className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder-text-secondary"
                                    />
                                    <button type="button" onMouseDown={e => e.preventDefault()} onClick={handleAddCategory}
                                        disabled={isAddingCategory || !newCategoryName.trim()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                        style={{ background: "linear-gradient(135deg, #4edea3, #10b981)", color: "#003824" }}
                                    >
                                        {isAddingCategory ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                        {isAddingCategory ? "Adding…" : "Add"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* description */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-text-secondary text-xs tracking-widest">DESCRIPTION <span className="normal-case opacity-50">(optional)</span></label>
                    <input type="text" placeholder="e.g. Dinner at Hyatt…" value={description} onChange={e => setDescription(e.target.value)}
                        className="rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-secondary outline-none"
                        style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.8)" }}
                    />
                </div>

                {/* error */}
                {error && (
                    <div className="rounded-lg px-4 py-2.5 text-xs"
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "var(--color-error)" }}
                    >
                        {error}
                    </div>
                )}

                {/* actions */}
                <div className="flex gap-3 pt-1">
                    <button type="button" onClick={onClose} disabled={isBusy}
                        className="flex-1 py-3 rounded-lg text-sm text-text-secondary hover:text-text-primary disabled:opacity-40"
                        style={{ backgroundColor: "rgba(var(--raw-input-bg), 0.5)" }}
                    >
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isBusy}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: isBusy ? "rgba(78, 222, 163, 0.4)" : "linear-gradient(135deg, #4edea3, #10b981)", color: "#003824" }}
                    >
                        {isSubmitting ? <><Loader2 size={14} className="animate-spin" />Saving…</> :
                         isAddingCategory ? <><Loader2 size={14} className="animate-spin" />Adding category…</> :
                         "Save Changes"}
                    </button>
                </div>
                </div>{/* end body */}

                {/* ── footer ─────────────────────────────────────────────── */}
                <div
                    className="flex items-center justify-between px-7 py-3"
                    style={{
                        borderTop: "1px solid rgba(78,222,163,0.08)",
                        background: "linear-gradient(135deg, rgba(78,222,163,0.04) 0%, rgba(16,185,129,0.02) 100%)",
                    }}
                >
                    <span
                        className="text-xs"
                        style={{
                            color: "var(--color-text-secondary)",
                            fontFamily: "'Berkeley Mono','Courier New',monospace",
                            opacity: 0.55,
                        }}
                    >
                        SpendSmart · Precision Ledger
                    </span>
                    <span
                        className="text-xs"
                        style={{ color: "var(--color-primary)", opacity: 0.45 }}
                    >
                        ●
                    </span>
                </div>
            </div>{/* end card */}
        </div>
    );
}

export default EditExpenseModal;
