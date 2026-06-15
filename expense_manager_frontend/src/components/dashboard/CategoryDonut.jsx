import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext.jsx";

const COLORS_DARK  = ["#4edea3","#60a5fa","#f59e0b","#c084fc","#fb923c","#34d399","#f472b6"];
const COLORS_LIGHT = ["#059669","#2563eb","#d97706","#7c3aed","#ea580c","#16a34a","#db2777"];

function CategoryDonut({ financialSummary }) {
    const { isDark } = useTheme();
    const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

    const donutData = financialSummary?.categoryPercentage
        ? Object.entries(financialSummary.categoryPercentage).map(([name, value], index) => ({
            name,
            value: Number(value),
            fill: COLORS[index % COLORS.length]
        }))
        : [];

    const isEmpty = donutData.length === 0;

    return (
        <div className="bg-surface-high rounded-xl p-4 md:p-5 w-full md:w-72">
            <h2 className="text-text-primary font-semibold mb-6">Category Breakdown</h2>

            {isEmpty ? (
                <div className="flex items-center justify-center h-48">
                    <p className="text-text-secondary text-sm">No data yet</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                dataKey="value"
                                paddingAngle={3}
                            />
            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const { name, value, fill } = payload[0].payload;
                                    return (
                                        <div style={{ backgroundColor: isDark ? "#2d3449" : "#ffffff", border: isDark ? "1px solid rgba(78,222,163,0.2)" : "1px solid rgba(0,108,73,0.15)", borderRadius: "8px", padding: "8px 12px", boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.08)" }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: fill }} />
                                                <p style={{ color: isDark ? "#ffffff" : "#0D1F17", fontSize: 12, fontWeight: 700 }}>{name}</p>
                                            </div>
                                            <p style={{ color: isDark ? "#4edea3" : "#059669", fontSize: 12 }}>{Number(value).toFixed(1)}%</p>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="flex flex-col gap-2 mt-2">
                        {donutData.slice(0, 3).map((entry, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-text-secondary text-xs">{entry.name}</span>
                                </div>
                                <span className="text-text-secondary text-xs">{Number(entry.value).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default CategoryDonut;
