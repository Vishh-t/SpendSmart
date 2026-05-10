import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { addCategory } from "../../services/categoryService.js";
import { useTheme } from "../../context/ThemeContext.jsx";

function AddCategoryModal({ onClose, onSuccess }) {

    const { isDark } = useTheme();
    const [categoryName, setCategoryName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error,        setError]        = useState(null);

    // ── theme tokens ──────────────────────────────────────────────────────
    const modalBg    = isDark ? "rgba(45,52,73,0.65)"        : "rgba(255,255,255,0.92)";
    const modalBdr   = isDark ? "rgba(78,222,163,0.15)"      : "rgba(0,108,73,0.18)";
    const inputBg    = isDark ? "rgba(49,57,77,0.85)"        : "rgba(232,237,233,0.9)";
    const cancelBg   = isDark ? "rgba(49,57,77,0.55)"        : "rgba(232,237,233,0.8)";
    const overlayBg  = isDark ? "rgba(11,19,38,0.78)"        : "rgba(13,31,23,0.45)";
    const ctaGrad    = isDark
        ? "linear-gradient(135deg, #4edea3, #10b981)"
        : "linear-gradient(135deg, #10B981, #059669)";
    const ctaGradDis = isDark ? "rgba(78,222,163,0.35)"      : "rgba(16,185,129,0.30)";

    async function handleSubmit() {
        const name = categoryName.trim();
        if (!name) { setError("Category name cannot be empty."); return; }
        setError(null);
        setIsSubmitting(true);
        try {
            await addCategory(name);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to add category.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        /* backdrop — no click-to-close per project rule */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: overlayBg, backdropFilter: "blur(8px)" }}
        >
            <div
                className="relative w-full max-w-sm mx-4 rounded-2xl p-7 shadow-2xl flex flex-col gap-5"
                style={{
                    backgroundColor: modalBg,
                    backdropFilter: "blur(28px)",
                    border: `1px solid ${modalBdr}`,
                    boxShadow: isDark
                        ? "0 24px 60px rgba(0,0,0,0.40)"
                        : "0 12px 40px rgba(0,0,0,0.12)",
                }}
            >
                {/* ── header ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-text-primary font-semibold text-lg leading-tight">
                            New Category
                        </h2>
                        <p className="text-text-secondary text-xs mt-0.5">
                            Add a category to organise your expenses
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
                        style={{ color: isDark ? "#8892a4" : "#4A6358" }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = isDark
                                ? "rgba(78,222,163,0.10)" : "rgba(0,108,73,0.08)";
                            e.currentTarget.style.color = "var(--color-primary)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358";
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── input ──────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-text-secondary text-xs tracking-widest">
                        CATEGORY NAME
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Groceries, Travel, EMI…"
                        value={categoryName}
                        autoFocus
                        onChange={e => { setCategoryName(e.target.value); setError(null); }}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        className="rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-secondary outline-none transition-all"
                        style={{ backgroundColor: inputBg }}
                    />
                </div>

                {/* ── error ──────────────────────────────────────────── */}
                {error && (
                    <div
                        className="rounded-lg px-4 py-2.5 text-xs"
                        style={{
                            backgroundColor: "rgba(239,68,68,0.10)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            color: "#ef4444",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* ── actions ────────────────────────────────────────── */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-lg text-sm transition-all disabled:opacity-40"
                        style={{
                            backgroundColor: cancelBg,
                            color: isDark ? "#8892a4" : "#4A6358",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--color-text-primary)"}
                        onMouseLeave={e => e.currentTarget.style.color = isDark ? "#8892a4" : "#4A6358"}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                            background: isSubmitting ? ctaGradDis : ctaGrad,
                            color: "#003824",
                        }}
                        onMouseEnter={e => {
                            if (!isSubmitting) e.currentTarget.style.boxShadow = isDark
                                ? "0 0 18px rgba(78,222,163,0.35)"
                                : "0 0 18px rgba(16,185,129,0.28)";
                        }}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                    >
                        {isSubmitting ? (
                            <><Loader2 size={14} className="animate-spin" />Saving…</>
                        ) : (
                            "Create Category"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddCategoryModal;
