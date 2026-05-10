import { useState, useRef, useEffect } from "react";
import {
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { getMonthlySummary } from "../../services/expenseService.js";
import { BarChart2, TrendingUp, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

const MONTHS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const BAR_COLORS_DARK  = ["#4edea3","#60a5fa","#f59e0b","#c084fc","#fb923c","#34d399","#f472b6","#38bdf8","#a3e635","#e879f9","#fbbf24","#2dd4bf"];
const BAR_COLORS_LIGHT = ["#059669","#2563eb","#d97706","#7c3aed","#ea580c","#16a34a","#db2777","#0284c7","#65a30d","#c026d3","#b45309","#0d9488"];

function buildAnnualData(monthlyBreakdown) {
    if (!monthlyBreakdown) return [];
    return Object.entries(monthlyBreakdown).map(([month, amount]) => ({
        label: month.substring(0, 3),
        amount: Number(amount)
    }));
}

function buildDayWiseData(expenses, month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), amount: 0 }));
    expenses.forEach(exp => {
        const day = new Date(exp.expenseTimestamp).getDate();
        days[day - 1].amount += Number(exp.amount);
    });
    return days;
}

function SpendingChart({ annualSummary }) {

    const [chartType,         setChartType]         = useState("bar");
    const [view,              setView]              = useState("annual");
    const [selectedMonth,     setSelectedMonth]     = useState(new Date().getMonth() + 1);
    const [dayWiseData,       setDayWiseData]       = useState([]);
    const [isDayWiseLoading,  setIsDayWiseLoading]  = useState(false);
    const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

    // Ref for detecting outside clicks on the month dropdown
    const monthDropdownRef = useRef(null);

    // Close dropdown when clicking anywhere outside it
    useEffect(() => {
        function handleClickOutside(e) {
            if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
                setMonthDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { isDark } = useTheme();
    const BAR_COLORS   = isDark ? BAR_COLORS_DARK : BAR_COLORS_LIGHT;
    const axisColor    = isDark ? "#8892a4" : "#4A6358";
    const gridColor    = isDark ? "rgba(136,146,164,0.1)" : "rgba(74,99,88,0.12)";
    const tooltipBg    = isDark ? "#2d3449" : "#ffffff";
    const tooltipText  = isDark ? "#ffffff" : "#0D1F17";
    const lineColor    = isDark ? "#4edea3" : "#059669";
    const toggleBg     = isDark ? "#2d3449" : "#ECF3EE";
    const toggleText   = isDark ? "#ffffff" : "#0D1F17";
    const toggleBorder = isDark ? "rgba(61,73,98,0.6)" : "rgba(0,108,73,0.2)";
    const iconInactive = isDark ? "#8892a4" : "#4A6358";
    const ctaActive    = isDark ? "#4edea3" : "#10B981";
    const ctaText      = isDark ? "#003824" : "#ffffff";
    const dropdownBg   = isDark ? "rgba(19,27,46,0.97)" : "rgba(255,255,255,0.97)";

    const currentYear = new Date().getFullYear();
    const annualData  = buildAnnualData(annualSummary?.monthlyBreakdown);

    async function loadDayWise(month) {
        setIsDayWiseLoading(true);
        setSelectedMonth(month);
        setMonthDropdownOpen(false);
        try {
            const summary = await getMonthlySummary(month, currentYear);
            setDayWiseData(buildDayWiseData(summary.expenses || [], month, currentYear));
        } catch (err) {
            console.error("Day-wise fetch failed:", err);
            setDayWiseData([]);
        } finally {
            setIsDayWiseLoading(false);
        }
    }

    async function switchToMonthly() {
        setView("monthly");
        await loadDayWise(selectedMonth);
    }

    function switchToAnnual() { setView("annual"); }

    const chartData = view === "annual" ? annualData : dayWiseData;

    const tooltipEl = (
        <Tooltip
            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Spent"]}
            contentStyle={{
                backgroundColor: tooltipBg,
                border: isDark ? "none" : "1px solid rgba(0,108,73,0.15)",
                borderRadius: "8px",
                color: tooltipText,
                fontSize: "12px",
                boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.08)"
            }}
        />
    );

    const grid = <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />;

    return (
        <div className="bg-surface-high rounded-xl p-5 flex-1">

            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-text-primary font-semibold">
                    {view === "annual" ? "Monthly Spending Trend" : `Day-wise — ${MONTHS[selectedMonth - 1]} ${currentYear}`}
                </h2>

                <div className="flex items-center gap-2">

                    {/* Bar / Line toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${toggleBorder}` }}>
                        <button onClick={() => setChartType("bar")} title="Bar chart"
                            className="flex items-center justify-center w-8 h-8 transition-all"
                            style={{ backgroundColor: chartType === "bar" ? ctaActive : "transparent", color: chartType === "bar" ? ctaText : iconInactive }}>
                            <BarChart2 size={14} />
                        </button>
                        <button onClick={() => setChartType("line")} title="Line chart"
                            className="flex items-center justify-center w-8 h-8 transition-all"
                            style={{ backgroundColor: chartType === "line" ? ctaActive : "transparent", color: chartType === "line" ? ctaText : iconInactive }}>
                            <TrendingUp size={14} />
                        </button>
                    </div>

                    {/* Annual / Monthly toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${toggleBorder}` }}>
                        <button onClick={switchToAnnual} className="px-3 py-1.5 text-xs transition-all"
                            style={{ backgroundColor: view === "annual" ? toggleBg : "transparent", color: view === "annual" ? toggleText : iconInactive }}>
                            Annual
                        </button>
                        <button onClick={switchToMonthly} className="px-3 py-1.5 text-xs transition-all"
                            style={{ backgroundColor: view === "monthly" ? toggleBg : "transparent", color: view === "monthly" ? toggleText : iconInactive }}>
                            Monthly
                        </button>
                    </div>

                    {/* Month selector — only visible in monthly view */}
                    {view === "monthly" && (
                        <div className="relative" ref={monthDropdownRef}>
                            <button
                                onClick={() => setMonthDropdownOpen(o => !o)}
                                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
                                style={{ backgroundColor: toggleBg, color: toggleText, border: `1px solid ${toggleBorder}` }}
                            >
                                {MONTHS[selectedMonth - 1]}
                                <ChevronDown size={12}
                                    className={`transition-transform ${monthDropdownOpen ? "rotate-180" : ""}`}
                                    style={{ color: iconInactive }} />
                            </button>

                            {monthDropdownOpen && (
                                <div
                                    className="absolute top-full mt-1 right-0 z-20 rounded-lg shadow-lg"
                                    style={{
                                        backgroundColor: dropdownBg,
                                        backdropFilter: "blur(12px)",
                                        border: `1px solid ${toggleBorder}`,
                                        minWidth: "120px",
                                        // Show exactly 3 items — each item is ~32px tall so 3 × 32 = 96px
                                        maxHeight: "96px",
                                        overflowY: "auto",
                                        // Custom scrollbar matching the theme
                                        scrollbarWidth: "thin",
                                        scrollbarColor: isDark
                                            ? "rgba(78,222,163,0.35) transparent"
                                            : "rgba(0,108,73,0.25) transparent",
                                    }}
                                >
                                    {MONTHS_FULL.map((m, i) => (
                                        <button
                                            key={i}
                                            onClick={() => loadDayWise(i + 1)}
                                            className="w-full text-left px-4 py-2 text-xs transition-all hover:bg-surface-bright"
                                            style={{
                                                color: selectedMonth === i + 1
                                                    ? "var(--color-primary)"
                                                    : "var(--color-text-secondary)"
                                            }}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            {isDayWiseLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-text-secondary text-sm">Loading...</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    {chartType === "bar" ? (
                        <BarChart data={chartData} barSize={view === "monthly" ? 8 : 20}>
                            {grid}
                            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={view === "monthly" ? 4 : 0} />
                            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                            {tooltipEl}
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <LineChart data={chartData}>
                            {grid}
                            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={view === "monthly" ? 4 : 0} />
                            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                            {tooltipEl}
                            <Line type="monotone" dataKey="amount" stroke={lineColor} strokeWidth={2}
                                dot={{ fill: lineColor, r: view === "monthly" ? 2 : 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            )}
        </div>
    );
}

export default SpendingChart;
