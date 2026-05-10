// Reusable glassmorphism modal shell
function ModalShell({ onClose, children, maxWidth = "max-w-lg" }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                backgroundColor: "rgba(var(--raw-overlay-bg), 0.75)",
                backdropFilter: "blur(8px)"
            }}
            onClick={onClose}
        >
            <div
                className={`relative w-full ${maxWidth} mx-4 rounded-2xl p-6 shadow-2xl`}
                style={{
                    backgroundColor: "rgba(var(--raw-modal-bg), 0.90)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(78, 222, 163, 0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export default ModalShell;
