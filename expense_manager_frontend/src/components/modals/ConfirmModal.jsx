import { useTheme } from "../../context/ThemeContext.jsx";

function ConfirmModal({ message, onConfirm, onCancel }) {
    const { isDark } = useTheme();

    const modalBg   = isDark ? "rgba(45,52,73,0.70)"   : "rgba(255,255,255,0.95)";
    const modalBdr  = isDark ? "rgba(239,68,68,0.20)"  : "rgba(239,68,68,0.18)";
    const overlayBg = isDark ? "rgba(11,19,38,0.78)"   : "rgba(13,31,23,0.45)";
    const cancelBg  = isDark ? "rgba(49,57,77,0.70)"   : "#E8EDE9";
    const cancelCol = isDark ? "#8892a4"                : "#4A6358";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: overlayBg, backdropFilter: "blur(8px)" }}
        >
            <div
                className="w-full max-w-sm mx-4 rounded-2xl p-7 flex flex-col gap-6 shadow-2xl"
                style={{
                    backgroundColor: modalBg,
                    backdropFilter: "blur(28px)",
                    border: `1px solid ${modalBdr}`,
                    boxShadow: isDark
                        ? "0 24px 60px rgba(0,0,0,0.45)"
                        : "0 12px 40px rgba(0,0,0,0.12)",
                }}
            >
                {/* icon + message */}
                <div className="flex flex-col gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
                    >
                        🗑️
                    </div>
                    <p className="text-text-primary text-sm leading-relaxed">{message}</p>
                    <p className="text-text-secondary text-xs">
                        This action is permanent and cannot be reversed.
                    </p>
                </div>

                {/* actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-lg text-sm transition-all"
                        style={{ backgroundColor: cancelBg, color: cancelCol }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--color-text-primary)"}
                        onMouseLeave={e => e.currentTarget.style.color = cancelCol}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                        style={{ backgroundColor: "#ef4444" }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#dc2626";
                            e.currentTarget.style.boxShadow = "0 0 18px rgba(239,68,68,0.40)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#ef4444";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
