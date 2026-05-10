// Reusable stat card used on the Dashboard
// Props: title, value, subtitle, valueColor (optional tailwind class)

function StatCard({ title, value, subtitle, valueColor = "text-text-primary", children }) {
    return (
        <div className="bg-surface-high rounded-xl p-5 flex flex-col gap-2">
            <p className="text-text-secondary text-xs tracking-widest">{title}</p>
            <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
            {subtitle && <p className="text-text-secondary text-xs">{subtitle}</p>}
            {children}
        </div>
    );
}

export default StatCard;
