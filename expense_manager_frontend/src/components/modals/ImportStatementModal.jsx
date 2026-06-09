import { useState, useRef, useEffect, useCallback } from "react";
import {
    X, Upload, FileText, Loader2, ChevronDown,
    AlertTriangle, CheckCircle2, Trash2, ShieldAlert,
    ToggleLeft, ToggleRight, ArrowLeft, Sparkles, Plus, CalendarDays, Search
} from "lucide-react";
import { parseStatement, saveMapping, bulkAddExpenses } from "../../services/importService.js";
import { getAllCategories, addCategory } from "../../services/categoryService.js";
import Calendar, { toYMD, MONTHS } from "../ui/Calendar.jsx";

/* ─── confidence badge ───────────────────────────────────────────────────── */
function ConfidenceBadge({ score }) {
    if (score == null) return null;
    const high   = score >= 90;
    const medium = score >= 60;
    const color  = high   ? "rgba(78,222,163,0.18)"  : medium ? "rgba(251,191,36,0.18)"  : "rgba(239,68,68,0.15)";
    const text   = high   ? "#4edea3"                : medium ? "#fbbf24"                : "#ef4444";
    const label  = high   ? "High"                   : medium ? "Med"                   : "Low";
    return (
        <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: color, color: text, border: `1px solid ${text}30` }}
        >
            {label}
        </span>
    );
}

/* ─── category dropdown cell ─────────────────────────────────────────────── */
function CategoryCell({ value, categories, onChange, onCategoryAdded }) {
    const [open,       setOpen]       = useState(false);
    const [adding,     setAdding]     = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [saving,     setSaving]     = useState(false);
    const ref     = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        function outside(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAdding(false); setNewCatName(""); } }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, []);

    useEffect(() => {
        if (adding) setTimeout(() => inputRef.current?.focus(), 50);
    }, [adding]);

    const selected = categories.find(c => c.categoryId === value);

    async function handleAddCategory() {
        const name = newCatName.trim();
        if (!name) return;
        setSaving(true);
        try {
            await addCategory(name);
            const updated = await getAllCategories();
            onCategoryAdded(updated);
            const created = updated.find(c => c.categoryName.toLowerCase() === name.toLowerCase());
            if (created) onChange(created.categoryId);
            setAdding(false);
            setNewCatName("");
            setOpen(false);
        } catch {}
        finally { setSaving(false); }
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs w-full text-left"
                style={{
                    backgroundColor: value ? "rgba(var(--raw-input-bg), 0.6)" : "rgba(239,68,68,0.10)",
                    color: selected ? "var(--color-text-primary)" : "#ef4444",
                    border: value ? "1px solid transparent" : "1px solid rgba(239,68,68,0.25)",
                    minWidth: "130px"
                }}
            >
                <span className="flex-1 truncate">{selected?.categoryName ?? "Uncategorized"}</span>
                <ChevronDown size={11} style={{ color: value ? "var(--color-text-secondary)" : "#ef4444", flexShrink: 0 }} />
            </button>
            {open && (
                <div
                    className="absolute z-50 mt-1 rounded-xl shadow-2xl"
                    style={{
                        backgroundColor: "rgba(var(--raw-dropdown-bg), 0.98)",
                        border: "1px solid rgba(78,222,163,0.14)",
                        minWidth: "180px",
                        maxHeight: "240px",
                        overflowY: "auto",
                        top: "100%",
                        left: 0,
                    }}
                >
                    <button
                        className="w-full text-left px-3 py-2 text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                        onClick={() => { onChange(null); setOpen(false); }}
                    >
                        Uncategorized
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.categoryId}
                            className="w-full text-left px-3 py-2 text-xs"
                            style={{ color: cat.categoryId === value ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                            onClick={() => { onChange(cat.categoryId); setOpen(false); }}
                        >
                            {cat.categoryName}
                        </button>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(78,222,163,0.10)", margin: "4px 0" }} />
                    {!adding ? (
                        <button
                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-1.5"
                            style={{ color: "var(--color-primary)" }}
                            onClick={() => setAdding(true)}
                        >
                            <Plus size={11} /> New Category
                        </button>
                    ) : (
                        <div className="px-2 py-2 flex items-center gap-1.5">
                            <input
                                ref={inputRef}
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") { setAdding(false); setNewCatName(""); } }}
                                placeholder="Category name"
                                className="flex-1 text-xs rounded-lg px-2 py-1 outline-none"
                                style={{ backgroundColor: "rgba(var(--raw-input-bg),0.8)", color: "var(--color-text-primary)", border: "1px solid rgba(78,222,163,0.25)", minWidth: 0 }}
                            />
                            <button
                                onClick={handleAddCategory}
                                disabled={saving || !newCatName.trim()}
                                className="text-xs px-2 py-1 rounded-lg disabled:opacity-40"
                                style={{ background: "linear-gradient(135deg,#4edea3,#10b981)", color: "#003824", fontWeight: 600 }}
                            >
                                {saving ? "…" : "Add"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── date cell with custom calendar ────────────────────────────────────── */
function DateCell({ value, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, []);

    const parts  = value ? value.split("-") : null;
    const selYear  = parts ? parseInt(parts[0]) : null;
    const selMonth = parts ? parseInt(parts[1]) - 1 : null;
    const selDay   = parts ? parseInt(parts[2]) : null;

    const displayLabel = parts
        ? `${String(selDay).padStart(2,"0")}-${String(selMonth+1).padStart(2,"0")}-${selYear}`
        : "Pick date";

    const today = new Date();
    const maxDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };

    function handleSelect(y, m, d) {
        if (y == null) { onChange(""); setOpen(false); return; }
        onChange(toYMD(y, m, d));
        setOpen(false);
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => !disabled && setOpen(o => !o)}
                disabled={disabled}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
                style={{
                    backgroundColor: "rgba(var(--raw-input-bg), 0.5)",
                    color: parts ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    fontFamily: "'Berkeley Mono','Courier New',monospace",
                    border: "1px solid transparent",
                    minWidth: "110px",
                }}
            >
                <CalendarDays size={11} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                {displayLabel}
            </button>
            {open && (
                <div className="absolute z-50 mt-1" style={{ top: "100%", left: 0 }}>
                    <Calendar
                        selectedYear={selYear}
                        selectedMonth={selMonth}
                        selectedDay={selDay}
                        onSelect={handleSelect}
                        maxDate={maxDate}
                    />
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function ImportStatementModal({ onClose, onSuccess }) {
    const [screen, setScreen] = useState("upload");

    const [file,           setFile]           = useState(null);
    const [includeCredits, setIncludeCredits] = useState(false);
    const [dragOver,       setDragOver]       = useState(false);
    const [parsing,        setParsing]        = useState(false);
    const [parseError,     setParseError]     = useState(null);
    const fileInputRef = useRef(null);

    const [rows,        setRows]        = useState([]);
    const [categories,  setCategories]  = useState([]);
    const [saving,      setSaving]      = useState(false);
    const [saveError,   setSaveError]   = useState(null);
    const [savedCount,  setSavedCount]  = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        getAllCategories().then(setCategories).catch(() => setCategories([]));
    }, []);

    const totalRows          = rows.length;
    const duplicateRows      = rows.filter(r => r.duplicate).length;
    const activeRows         = rows.filter(r => !r._removed);
    const willSaveCount      = activeRows.length;
    const uncategorizedCount = activeRows.filter(r => !r.categoryId).length;
    const totalAmount        = activeRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const canSave            = willSaveCount > 0 && uncategorizedCount === 0;

    const merchantTotals = {};
    activeRows.forEach(r => {
        const key = (r.keyword || r.description || "unknown").toLowerCase();
        merchantTotals[key] = (merchantTotals[key] || 0) + (parseFloat(r.amount) || 0);
    });

    /* ── filtered rows for table display only ── */
    const filteredRows = searchQuery.trim() === ""
        ? rows
        : rows.filter(row => {
            const q = searchQuery.toLowerCase();
            const descMatch = (row.description ?? "").toLowerCase().includes(q);
            const catName   = categories.find(c => c.categoryId === row.categoryId)?.categoryName ?? "uncategorized";
            const catMatch  = catName.toLowerCase().includes(q);
            return descMatch || catMatch;
        });

    function handleFileChange(f) {
        if (!f) return;
        if (f.type !== "application/pdf") { setParseError("Only PDF files are supported."); return; }
        setFile(f);
        setParseError(null);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        handleFileChange(e.dataTransfer.files[0]);
    }

    async function handleParse() {
        if (!file) { setParseError("Please select a PDF file."); return; }
        setParsing(true);
        setParseError(null);
        try {
            const data = await parseStatement(file, includeCredits);
            const enriched = data.map((t, i) => ({
                ...t,
                _id: i,
                _removed: false,
                date: t.dateTime ? t.dateTime.split("T")[0] : "",
            }));
            setRows(enriched);
            setSearchQuery("");
            setScreen("preview");
        } catch (err) {
            setParseError(err?.response?.data?.message ?? "Failed to parse statement. Please try again.");
        } finally {
            setParsing(false);
        }
    }

    const updateRow = useCallback((id, field, value) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
    }, []);

    const removeRow = useCallback((id) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, _removed: true } : r));
    }, []);

    const restoreRow = useCallback((id) => {
        setRows(prev => prev.map(r => r._id === id ? { ...r, _removed: false } : r));
    }, []);

    async function handleSave() {
        setSaving(true);
        setSaveError(null);
        try {
            const toSave = activeRows.map(r => ({
                amount:      r.amount,
                description: r.description,
                categoryId:  r.categoryId,
                dateTime:    r.date ? r.date + "T00:00:00" : r.dateTime,
                keyword:     r.keyword,
            }));
            await bulkAddExpenses(toSave);

            const mappingPromises = activeRows
                .filter(r => r.keyword && r.categoryId)
                .map(r => saveMapping(r.keyword, r.categoryId).catch(() => {}));
            await Promise.allSettled(mappingPromises);

            setSavedCount(toSave.length);
            onSuccess?.();
        } catch (err) {
            setSaveError(err?.response?.data?.message ?? "Failed to save expenses. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(var(--raw-overlay-bg), 0.80)", backdropFilter: "blur(10px)" }}
        >
            <div
                className="relative flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: "rgba(var(--raw-modal-bg), 0.97)",
                    backdropFilter: "blur(28px)",
                    border: "1px solid rgba(78,222,163,0.15)",
                    width:  screen === "preview" ? "min(96vw, 1080px)" : "min(96vw, 520px)",
                    maxHeight: "90vh",
                    transition: "width 0.3s ease",
                }}
            >
                {/* ── HEADER ── */}
                <div
                    className="flex items-center justify-between px-7 py-5 shrink-0"
                    style={{
                        background: "linear-gradient(135deg, rgba(78,222,163,0.13) 0%, rgba(16,185,129,0.07) 100%)",
                        borderBottom: "1px solid rgba(78,222,163,0.12)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(180deg,#4edea3,#10b981)" }} />
                        <div>
                            <h2 className="text-text-primary font-semibold text-base leading-tight">
                                {screen === "upload" ? "Import Bank Statement" : "Review Transactions"}
                            </h2>
                            <p className="text-text-secondary text-xs mt-0.5">
                                {screen === "upload"
                                    ? "Upload a PDF — Gemini AI will extract your transactions"
                                    : `${totalRows} transactions found · review before saving`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {screen === "preview" && (
                            <button
                                onClick={() => { setScreen("upload"); setSaveError(null); setSavedCount(null); setSearchQuery(""); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                                style={{ color: "var(--color-text-secondary)", backgroundColor: "rgba(var(--raw-input-bg),0.5)" }}
                            >
                                <ArrowLeft size={12} /> Back
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            disabled={parsing || saving}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
                            style={{ color: "var(--color-text-secondary)" }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(78,222,163,0.12)"; e.currentTarget.style.color = "var(--color-primary)"; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── SCREEN 1 — UPLOAD ── */}
                {screen === "upload" && (
                    <div className="flex flex-col gap-6 px-7 py-6 overflow-y-auto">

                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
                            style={{
                                padding: "2.5rem 1.5rem",
                                border: dragOver ? "2px dashed var(--color-primary)" : file ? "2px solid rgba(78,222,163,0.40)" : "2px dashed rgba(78,222,163,0.20)",
                                backgroundColor: dragOver ? "rgba(78,222,163,0.07)" : file ? "rgba(78,222,163,0.05)" : "rgba(var(--raw-input-bg),0.3)",
                            }}
                        >
                            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFileChange(e.target.files[0])} />
                            {file ? (
                                <>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(78,222,163,0.12)" }}>
                                        <FileText size={22} style={{ color: "var(--color-primary)" }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-text-primary text-sm font-medium">{file.name}</p>
                                        <p className="text-text-secondary text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(78,222,163,0.08)" }}>
                                        <Upload size={20} style={{ color: "var(--color-text-secondary)" }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-text-primary text-sm font-medium">Drop your PDF here</p>
                                        <p className="text-text-secondary text-xs mt-0.5">or click to browse · PDF only</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-4 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(var(--raw-input-bg),0.5)" }}>
                            <div>
                                <p className="text-text-primary text-sm font-medium">Include Credits</p>
                                <p className="text-text-secondary text-xs mt-0.5">Also extract incoming transfers, refunds, salary</p>
                            </div>
                            <button onClick={() => setIncludeCredits(v => !v)}>
                                {includeCredits
                                    ? <ToggleRight size={28} style={{ color: "var(--color-primary)" }} />
                                    : <ToggleLeft  size={28} style={{ color: "var(--color-text-secondary)" }} />}
                            </button>
                        </div>

                        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
                            <ShieldAlert size={15} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "2px" }} />
                            <p className="text-xs" style={{ color: "#fbbf24", lineHeight: "1.6" }}>
                                Your statement will be sent to <strong>Google Gemini AI</strong> for processing.
                                Account numbers and IFSC codes are stripped before sending.
                                Do not use if you are uncomfortable sharing transaction data with a third-party AI.
                            </p>
                        </div>

                        {parseError && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
                                style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)", color: "var(--color-error)" }}>
                                <AlertTriangle size={13} /> {parseError}
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button onClick={onClose} className="flex-1 py-3 rounded-lg text-sm text-text-secondary" style={{ backgroundColor: "rgba(var(--raw-input-bg),0.5)" }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleParse}
                                disabled={parsing || !file}
                                className="flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                                style={{ background: "linear-gradient(135deg,#4edea3,#10b981)", color: "#003824" }}
                            >
                                {parsing ? <><Loader2 size={14} className="animate-spin" /> Analysing…</> : <><Sparkles size={14} /> Parse Statement</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── SCREEN 2 — PREVIEW ── */}
                {screen === "preview" && (
                    <div className="flex flex-col overflow-hidden flex-1" style={{ minHeight: 0 }}>

                        {/* stats bar */}
                        {savedCount === null ? (
                            <div className="flex items-center gap-4 px-7 py-3 shrink-0 flex-wrap"
                                style={{ borderBottom: "1px solid rgba(78,222,163,0.08)", backgroundColor: "rgba(var(--raw-card-bg),0.5)" }}>
                                <Stat label="Found"         value={totalRows}           color="var(--color-text-primary)" />
                                <Stat label="Will Save"     value={willSaveCount}       color="#4edea3" />
                                <Stat label="Duplicates"    value={duplicateRows}       color="#fbbf24" />
                                <Stat label="Uncategorized" value={uncategorizedCount}  color={uncategorizedCount > 0 ? "#ef4444" : "var(--color-text-primary)"} />
                                <Stat label="Total"         value={`₹${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} color="var(--color-text-primary)" />
                                <div className="flex-1" />
                                {/* ── search bar ── */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                                    style={{ backgroundColor: "rgba(var(--raw-input-bg),0.7)", border: "1px solid rgba(78,222,163,0.12)", minWidth: "200px" }}>
                                    <Search size={12} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        placeholder="Search description or category…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="text-xs outline-none bg-transparent flex-1"
                                        style={{ color: "var(--color-text-primary)" }}
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery("")} style={{ color: "var(--color-text-secondary)", lineHeight: 1 }}>
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 px-7 py-3.5 shrink-0"
                                style={{ borderBottom: "1px solid rgba(78,222,163,0.08)", backgroundColor: "rgba(78,222,163,0.07)" }}>
                                <CheckCircle2 size={18} style={{ color: "#4edea3" }} />
                                <p className="text-sm font-semibold" style={{ color: "#4edea3" }}>
                                    {savedCount} expense{savedCount !== 1 ? "s" : ""} saved successfully!
                                </p>
                                <button onClick={onClose} className="ml-auto text-xs px-3 py-1.5 rounded-lg"
                                    style={{ backgroundColor: "rgba(78,222,163,0.15)", color: "#4edea3" }}>
                                    Close
                                </button>
                            </div>
                        )}

                        {/* table */}
                        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
                            <table className="w-full text-sm border-collapse">
                                <thead className="sticky top-0 z-10" style={{ backgroundColor: "rgba(var(--raw-modal-bg),0.97)" }}>
                                    <tr style={{ borderBottom: "1px solid rgba(78,222,163,0.10)" }}>
                                        {["Date","Description","Amount","Category","Conf.",""].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest"
                                                style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                                No transactions match "{searchQuery}"
                                            </td>
                                        </tr>
                                    ) : filteredRows.map(row => {
                                        const isUncategorized = !row._removed && !row.categoryId;
                                        const isDup = row.duplicate && !row._removed;
                                        const bg = isUncategorized
                                            ? "rgba(239,68,68,0.06)"
                                            : isDup
                                            ? "rgba(251,191,36,0.04)"
                                            : "transparent";
                                        return (
                                        <tr key={row._id} style={{
                                            borderBottom: "1px solid rgba(78,222,163,0.05)",
                                            opacity: row._removed ? 0.35 : 1,
                                            backgroundColor: bg,
                                            transition: "opacity 0.2s, background-color 0.2s",
                                        }}>
                                            <td className="px-4 py-2.5">
                                                <DateCell
                                                    value={row.date ?? ""}
                                                    disabled={row._removed}
                                                    onChange={val => updateRow(row._id, "date", val)}
                                                />
                                            </td>
                                            <td className="px-4 py-2.5" style={{ maxWidth: "260px" }}>
                                                <input type="text" value={row.description ?? ""} disabled={row._removed}
                                                    onChange={e => updateRow(row._id, "description", e.target.value)}
                                                    className="text-xs rounded-lg px-2 py-1.5 outline-none w-full"
                                                    style={{ backgroundColor: "rgba(var(--raw-input-bg),0.5)", color: "var(--color-text-primary)", border: "1px solid transparent" }} />
                                                {!row._removed && (() => {
                                                    const key = (row.keyword || row.description || "").toLowerCase();
                                                    const total = merchantTotals[key];
                                                    return total > (parseFloat(row.amount) || 0) ? (
                                                        <span className="text-xs mt-0.5 block" style={{ color: "var(--color-text-secondary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                                                            Total: ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap"
                                                style={{ color: "var(--color-text-primary)", fontFamily: "'Berkeley Mono','Courier New',monospace" }}>
                                                ₹{parseFloat(row.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <CategoryCell
                                                    value={row.categoryId}
                                                    categories={categories}
                                                    onChange={val => updateRow(row._id, "categoryId", val)}
                                                    onCategoryAdded={setCategories}
                                                />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <ConfidenceBadge score={row.confidenceScore} />
                                                    {row.duplicate && <span title="Possible duplicate" style={{ color: "#fbbf24" }}><AlertTriangle size={12} /></span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {row._removed ? (
                                                    <button onClick={() => restoreRow(row._id)} className="text-xs px-2 py-1 rounded-lg"
                                                        style={{ color: "var(--color-primary)", backgroundColor: "rgba(78,222,163,0.10)" }}>
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button onClick={() => removeRow(row._id)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                                                        style={{ color: "var(--color-text-secondary)" }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "var(--color-error)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {savedCount === null && (
                            <div className="flex items-center gap-4 px-7 py-4 shrink-0" style={{ borderTop: "1px solid rgba(78,222,163,0.08)" }}>
                                {saveError && (
                                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-error)" }}>
                                        <AlertTriangle size={13} /> {saveError}
                                    </div>
                                )}
                                <div className="flex-1" />
                                {uncategorizedCount > 0 ? (
                                    <span className="text-xs flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                                        <AlertTriangle size={12} />
                                        {uncategorizedCount} row{uncategorizedCount !== 1 ? "s" : ""} need a category
                                    </span>
                                ) : (
                                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                        {willSaveCount} expense{willSaveCount !== 1 ? "s" : ""} will be added
                                    </span>
                                )}
                                <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm"
                                    style={{ backgroundColor: "rgba(var(--raw-input-bg),0.5)", color: "var(--color-text-secondary)" }}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving || !canSave}
                                    className="px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                                    style={{ background: "linear-gradient(135deg,#4edea3,#10b981)", color: "#003824" }}>
                                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : `Confirm & Save ${willSaveCount}`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── modal footer brand ── */}
                <div className="flex items-center justify-between px-7 py-3 shrink-0"
                    style={{ borderTop: "1px solid rgba(78,222,163,0.07)", background: "linear-gradient(135deg,rgba(78,222,163,0.04) 0%,rgba(16,185,129,0.02) 100%)" }}>
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)", fontFamily: "'Berkeley Mono','Courier New',monospace", opacity: 0.5 }}>
                        SpendSmart · Precision Ledger
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-primary)", opacity: 0.4 }}>●</span>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color, fontFamily: "'Berkeley Mono','Courier New',monospace" }}>{value}</span>
        </div>
    );
}

export default ImportStatementModal;
