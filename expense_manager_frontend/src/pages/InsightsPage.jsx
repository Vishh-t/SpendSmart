import { useEffect, useState, useCallback } from "react";
import {
    AlertTriangle, TrendingUp, Minus, Repeat2,
    Flame, Trophy, Zap, Info, Calendar,
    ArrowUpRight, ArrowDownRight, Sparkles, Activity
} from "lucide-react";
import {
    getAnomalies, getMerchantLeaderboard, getSubscriptionTracker,
    getWeeklyDNA, getDailyBurnRate, getMonthlyDelta
} from "../services/insightsService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { useTheme } from "../context/ThemeContext.jsx";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

/* ─── constants ─────────────────────────────────────────────────────────── */
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_KEYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function now() { return new Date(); }

function getDayIndex(val) {
    if (val == null) return 0;
    const s = String(val).toUpperCase().trim();
    const i = DAY_KEYS.indexOf(s);
    return i !== -1 ? i : (parseInt(s, 10) - 1) || 0;
}

function severityColor(sev) {
    if (!sev || sev === "INSUFFICIENT_DATA") return "#6b7280";
    if (sev === "Unusual")   return "#ef4444";
    if (sev === "Very High") return "#f97316";
    return "#f59e0b";
}

function trendMeta(trend) {
    if (trend === "UP")   return { icon: <ArrowUpRight size={12}/>,  color: "#ef4444",  bg: "rgba(239,68,68,0.10)"   };
    if (trend === "DOWN") return { icon: <ArrowDownRight size={12}/>, color: "#10b981", bg: "rgba(16,185,129,0.10)"  };
    if (trend === "NEW")  return { icon: <Sparkles size={12}/>,       color: "#a78bfa", bg: "rgba(167,139,250,0.10)" };
    return                       { icon: <Minus size={12}/>,          color: "#6b7280", bg: "rgba(107,114,128,0.08)" };
}

/* ─── reusable pieces ───────────────────────────────────────────────────── */
function Card({ children, isDark, className = "", style = {} }) {
    return (
        <div
            className={`rounded-2xl p-5 flex flex-col gap-4 ${className}`}
            style={{
                background:  isDark ? "#1a2438" : "#ffffff",
                border:      isDark ? "1px solid rgba(78,222,163,0.10)" : "1px solid rgba(16,185,129,0.15)",
                boxShadow:   isDark ? "0 2px 24px rgba(0,0,0,0.30)" : "0 2px 16px rgba(16,185,129,0.06)",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function CardHeader({ icon, title, subtitle, isDark, action }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div>
                <div className="flex items-center gap-2">
                    <span style={{ color: isDark ? "#4edea3" : "#059669" }}>{icon}</span>
                    <span className="text-text-primary font-bold text-sm tracking-tight">{title}</span>
                </div>
                {subtitle && (
                    <p className="text-xs mt-0.5 pl-6" style={{ color: isDark ? "rgba(136,146,164,0.7)" : "rgba(0,108,73,0.55)" }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

function Pulse({ isDark, h = "h-4", w = "w-full" }) {
    return (
        <div
            className={`${h} ${w} rounded-lg animate-pulse`}
            style={{ background: isDark ? "rgba(49,57,77,0.65)" : "rgba(16,185,129,0.07)" }}
        />
    );
}

function EmptyState({ icon, text, isDark }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-60">
            <span style={{ color: isDark ? "#4edea3" : "#059669" }}>{icon}</span>
            <p className="text-text-secondary text-xs text-center">{text}</p>
        </div>
    );
}

function SelectEl({ value, onChange, options, isDark }) {
    return (
        <select
            value={value}
            onChange={onChange}
            style={{
                background:   isDark ? "rgba(49,57,77,0.9)" : "rgba(16,185,129,0.07)",
                color:        isDark ? "#e2e8f0" : "#0D4A2A",
                border:       isDark ? "1px solid rgba(78,222,163,0.18)" : "1px solid rgba(16,185,129,0.25)",
                borderRadius: "7px",
                padding:      "3px 7px",
                fontSize:     "11px",
                fontWeight:   700,
                outline:      "none",
                cursor:       "pointer",
            }}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

/* ════════════════════════════════════════════════════════════════════════ */
function InsightsPage() {
    const { isDark } = useTheme();

    const [burnRate,      setBurnRate]      = useState(null);
    const [anomalies,     setAnomalies]     = useState([]);
    const [merchants,     setMerchants]     = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [weeklyDNA,     setWeeklyDNA]     = useState([]);
    const [monthlyDelta,  setMonthlyDelta]  = useState([]);

    const [loadingBurn,  setLoadingBurn]  = useState(true);
    const [loadingAnom,  setLoadingAnom]  = useState(true);
    const [loadingMerch, setLoadingMerch] = useState(true);
    const [loadingSubs,  setLoadingSubs]  = useState(true);
    const [loadingDNA,   setLoadingDNA]   = useState(true);
    const [loadingDelta, setLoadingDelta] = useState(true);

    const [anomMonth, setAnomalyMonth] = useState(now().getMonth() + 1);
    const [anomYear,  setAnomalyYear]  = useState(now().getFullYear());
    const [dnaMonths, setDnaMonths]    = useState(null);
    const [d1Month,   setD1Month]      = useState(now().getMonth() + 1);
    const [d1Year,    setD1Year]       = useState(now().getFullYear());
    const [d2Month,   setD2Month]      = useState(now().getMonth() === 0 ? 12 : now().getMonth());
    const [d2Year,    setD2Year]       = useState(now().getMonth() === 0 ? now().getFullYear() - 1 : now().getFullYear());

    const fetchBurn  = useCallback(async () => { setLoadingBurn(true);  try { setBurnRate(await getDailyBurnRate()); } catch { setBurnRate(null); } finally { setLoadingBurn(false); } }, []);
    const fetchMerch = useCallback(async () => { setLoadingMerch(true); try { setMerchants(await getMerchantLeaderboard()); } catch { setMerchants([]); } finally { setLoadingMerch(false); } }, []);
    const fetchSubs  = useCallback(async () => { setLoadingSubs(true);  try { setSubscriptions(await getSubscriptionTracker()); } catch { setSubscriptions([]); } finally { setLoadingSubs(false); } }, []);

    const fetchAnomalies = useCallback(async () => {
        setLoadingAnom(true);
        try { setAnomalies(await getAnomalies(anomMonth, anomYear)); } catch { setAnomalies([]); }
        finally { setLoadingAnom(false); }
    }, [anomMonth, anomYear]);

    const fetchDNA = useCallback(async () => {
        setLoadingDNA(true);
        try { setWeeklyDNA(await getWeeklyDNA(dnaMonths)); } catch { setWeeklyDNA([]); }
        finally { setLoadingDNA(false); }
    }, [dnaMonths]);

    const fetchDelta = useCallback(async () => {
        setLoadingDelta(true);
        try { setMonthlyDelta(await getMonthlyDelta(d1Month, d1Year, d2Month, d2Year)); } catch { setMonthlyDelta([]); }
        finally { setLoadingDelta(false); }
    }, [d1Month, d1Year, d2Month, d2Year]);

    useEffect(() => { void fetchBurn();      }, [fetchBurn]);
    useEffect(() => { void fetchMerch();     }, [fetchMerch]);
    useEffect(() => { void fetchSubs();      }, [fetchSubs]);
    useEffect(() => { void fetchAnomalies(); }, [fetchAnomalies]);
    useEffect(() => { void fetchDNA();       }, [fetchDNA]);
    useEffect(() => { void fetchDelta();     }, [fetchDelta]);

    /* ── derived ── */
    const realAnomalies  = anomalies.filter(a => !a.insufficientData);
    const insuffAnomalies = anomalies.filter(a => a.insufficientData);

    const budget = burnRate
        ? (Number(burnRate.projectedMonthEndSpend) || 0) + Math.max(Number(burnRate.projectedSurplus) || 0, 0)
        : 0;
    const budgetPct = budget > 0 ? Math.min((Number(burnRate.projectedMonthEndSpend) / budget) * 100, 100) : 0;

    /* build DNA chart data — sort Mon→Sun */
    const dnaChartData = [...weeklyDNA]
        .sort((a, b) => getDayIndex(a.day) - getDayIndex(b.day))
        .map(d => ({
            day:  DAY_LABELS[getDayIndex(d.day)],
            avg:  Number(d.averageSpend || 0),
            txns: d.transactionCount || 0,
        }));
    const dnaMax = dnaChartData.length ? Math.max(...dnaChartData.map(d => d.avg)) : 1;

    const burnColor = !burnRate ? (isDark ? "#4edea3" : "#059669")
        : burnRate.status === "EXCEEDED" ? "#ef4444"
        : burnRate.status === "WARNING"  ? "#f59e0b"
        : isDark ? "#4edea3" : "#059669";

    const monthOpts  = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
    const yearOpts   = [now().getFullYear(), now().getFullYear() - 1, now().getFullYear() - 2].map(y => ({ value: y, label: y }));
    const dnaOpts    = [{ value: "all", label: "All time" }, { value: 3, label: "3 months" }, { value: 6, label: "6 months" }, { value: 12, label: "12 months" }];

    /* ── tooltip for DNA chart ── */
    function DnaTooltip({ active, payload, label }) {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ background: isDark ? "#1a2438" : "#fff", border: isDark ? "1px solid rgba(78,222,163,0.2)" : "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: 12 }}>
                <p style={{ color: isDark ? "#4edea3" : "#059669", fontWeight: 700 }}>{label}</p>
                <p style={{ color: isDark ? "#fff" : "#0D1F17" }}>₹{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════════ */
    return (
        <div className="flex flex-col gap-5 pb-8">

            {/* ── HEADER ── */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tight">Insights</h1>
                    <p className="text-xs mt-0.5" style={{ color: isDark ? "rgba(136,146,164,0.7)" : "rgba(0,108,73,0.55)" }}>
                        Precision analysis · {now().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                </div>
            </div>

            {/* ══ ROW 1 — Burn Rate hero (2/5) + Anomaly Detector (3/5) ══ */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 3fr" }}>

                {/* ── BURN RATE ── */}
                <Card
                    isDark={isDark}
                    style={{
                        background: isDark
                            ? "linear-gradient(145deg, rgba(78,222,163,0.09) 0%, #1a2438 60%)"
                            : "linear-gradient(145deg, rgba(16,185,129,0.08) 0%, #ffffff 60%)",
                        border: isDark ? "1px solid rgba(78,222,163,0.18)" : "1px solid rgba(16,185,129,0.20)",
                    }}
                >
                    <CardHeader
                        icon={<Flame size={15}/>}
                        title="Daily Burn Rate"
                        isDark={isDark}
                        action={
                            burnRate && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: burnRate.status === "EXCEEDED" ? "rgba(239,68,68,0.13)" : burnRate.status === "WARNING" ? "rgba(245,158,11,0.13)" : isDark ? "rgba(78,222,163,0.13)" : "rgba(16,185,129,0.10)", color: burnColor }}>
                                    {burnRate.status}
                                </span>
                            )
                        }
                    />

                    {loadingBurn ? (
                        <div className="flex flex-col gap-2"><Pulse isDark={isDark} h="h-9" w="w-36"/><Pulse isDark={isDark} h="h-2"/><Pulse isDark={isDark} h="h-2" w="w-3/4"/></div>
                    ) : !burnRate ? (
                        <EmptyState icon={<Flame size={24}/>} text="No spending data this month." isDark={isDark}/>
                    ) : (
                        <>
                            <div>
                                <p className="font-black text-text-primary tracking-tight" style={{ fontSize: "2.6rem", lineHeight: 1.1 }}>
                                    ₹{formatCurrency(burnRate.dailyBurnRate)}
                                    <span className="text-text-secondary font-normal text-sm ml-1">/day</span>
                                </p>
                                <p className="text-xs mt-1" style={{ color: isDark ? "rgba(136,146,164,0.65)" : "rgba(0,108,73,0.50)" }}>Exponential weighted average</p>
                            </div>

                            {/* progress bar */}
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span style={{ color: isDark ? "#8892a4" : "rgba(0,108,73,0.6)" }}>Projected month-end</span>
                                    <span className="font-bold text-text-primary">₹{formatCurrency(burnRate.projectedMonthEndSpend)}</span>
                                </div>
                                <div className="w-full h-2 rounded-full" style={{ background: isDark ? "rgba(49,57,77,0.9)" : "rgba(16,185,129,0.10)" }}>
                                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${budgetPct}%`, background: `linear-gradient(90deg, ${burnColor}, ${burnColor}cc)` }}/>
                                </div>
                            </div>

                            {/* two mini stats */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    {
                                        label: "Budget Remaining",
                                        value: `₹${formatCurrency(Math.abs(Number(burnRate.budgetRemaining)))}${Number(burnRate.budgetRemaining) < 0 ? " over" : ""}`,
                                        color: Number(burnRate.budgetRemaining) < 0 ? "#ef4444" : burnColor,
                                    },
                                    {
                                        label: "Days Until Empty",
                                        value: burnRate.daysUntilBudgetExhausted === 0 ? "—" : `${burnRate.daysUntilBudgetExhausted}d`,
                                        color: burnRate.daysUntilBudgetExhausted <= 5 && burnRate.daysUntilBudgetExhausted > 0 ? "#ef4444"
                                             : burnRate.daysUntilBudgetExhausted <= 10 ? "#f59e0b" : burnColor,
                                    },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="rounded-xl p-3" style={{ background: isDark ? "rgba(49,57,77,0.45)" : "rgba(16,185,129,0.06)", border: isDark ? "1px solid rgba(78,222,163,0.06)" : "1px solid rgba(16,185,129,0.10)" }}>
                                        <p className="text-xs" style={{ color: isDark ? "#8892a4" : "rgba(0,108,73,0.6)" }}>{label}</p>
                                        <p className="font-black text-base mt-0.5" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* ── ANOMALY DETECTOR ── */}
                <Card isDark={isDark}>
                    <CardHeader
                        icon={<AlertTriangle size={15}/>}
                        title="Anomaly Detector"
                        subtitle="Spending outliers via σ analysis"
                        isDark={isDark}
                        action={
                            <div className="flex items-center gap-1.5">
                                <SelectEl isDark={isDark} value={anomMonth} onChange={e => setAnomalyMonth(Number(e.target.value))} options={monthOpts}/>
                                <SelectEl isDark={isDark} value={anomYear}  onChange={e => setAnomalyYear(Number(e.target.value))}  options={yearOpts}/>
                            </div>
                        }
                    />
                    <div className="flex flex-col gap-2 overflow-y-auto pr-0.5" style={{ maxHeight: "230px" }}>
                        {loadingAnom ? (
                            [1,2,3].map(i => <Pulse key={i} isDark={isDark} h="h-14"/>)
                        ) : realAnomalies.length === 0 && insuffAnomalies.length === 0 ? (
                            <EmptyState icon={<Zap size={22}/>} text="No anomalies this period — spending looks normal." isDark={isDark}/>
                        ) : (
                            <>
                                {realAnomalies.map((a, i) => {
                                    const sc = severityColor(a.severity);
                                    return (
                                        <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: isDark ? `rgba(${a.severity === "Unusual" ? "239,68,68" : a.severity === "Very High" ? "249,115,22" : "245,158,11"},0.07)` : `rgba(${a.severity === "Unusual" ? "239,68,68" : a.severity === "Very High" ? "249,115,22" : "245,158,11"},0.05)`, borderLeft: `3px solid ${sc}` }}>
                                            <AlertTriangle size={13} style={{ color: sc, marginTop: 2, flexShrink: 0 }}/>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-text-primary text-sm font-bold">{a.categoryName}</span>
                                                    <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 5, background: `${sc}18`, color: sc }}>{a.severity}</span>
                                                    {a.deviationMultiple && <span style={{ fontSize: 10, color: isDark ? "#8892a4" : "#4A6358" }}>{a.deviationMultiple}σ</span>}
                                                </div>
                                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: isDark ? "#8892a4" : "rgba(0,108,73,0.65)" }}>{a.message}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-text-primary text-sm font-bold">₹{formatCurrency(a.currentMonthSpend)}</p>
                                                {a.historicalMean && <p className="text-xs" style={{ color: isDark ? "#8892a4" : "rgba(0,108,73,0.55)" }}>avg ₹{formatCurrency(a.historicalMean)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {insuffAnomalies.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: isDark ? "rgba(49,57,77,0.4)" : "rgba(16,185,129,0.04)", color: isDark ? "#8892a4" : "rgba(0,108,73,0.55)" }}>
                                        <Info size={12}/>
                                        {insuffAnomalies.length} categor{insuffAnomalies.length === 1 ? "y needs" : "ies need"} more history: {insuffAnomalies.map(a => a.categoryName).join(", ")}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            </div>

            {/* ══ ROW 2 — Spending DNA + Period Comparison ══ */}
            <div className="grid grid-cols-2 gap-4">

                {/* ── SPENDING DNA ── */}
                <Card isDark={isDark}>
                    <CardHeader
                        icon={<Activity size={15}/>}
                        title="Spending DNA"
                        subtitle="Average spend by day of week"
                        isDark={isDark}
                        action={
                            <SelectEl
                                isDark={isDark}
                                value={dnaMonths ?? "all"}
                                onChange={e => setDnaMonths(e.target.value === "all" ? null : Number(e.target.value))}
                                options={dnaOpts}
                            />
                        }
                    />
                    {loadingDNA ? (
                        <Pulse isDark={isDark} h="h-44"/>
                    ) : dnaChartData.length === 0 ? (
                        <EmptyState icon={<Activity size={22}/>} text="No data available." isDark={isDark}/>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={170}>
                                <BarChart data={dnaChartData} barCategoryGap="30%">
                                    <XAxis dataKey="day" tick={{ fill: isDark ? "#8892a4" : "#4A6358", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false}/>
                                    <YAxis hide/>
                                    <Tooltip content={<DnaTooltip/>}/>
                                    <Bar dataKey="avg" radius={[6,6,2,2]}>
                                        {dnaChartData.map((d, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    d.avg === dnaMax
                                                        ? (isDark ? "#4edea3" : "#10b981")
                                                        : i >= 5
                                                        ? (isDark ? "rgba(78,222,163,0.42)" : "rgba(16,185,129,0.38)")
                                                        : (isDark ? "rgba(78,222,163,0.22)" : "rgba(16,185,129,0.22)")
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            {(() => {
                                const peak = dnaChartData.reduce((a, b) => a.avg > b.avg ? a : b);
                                return (
                                    <p className="text-xs text-center" style={{ color: isDark ? "rgba(136,146,164,0.7)" : "rgba(0,108,73,0.55)" }}>
                                        Peak on <span className="font-bold" style={{ color: isDark ? "#4edea3" : "#059669" }}>{peak.day}s</span> — avg ₹{formatCurrency(peak.avg)} · {peak.txns} txns
                                    </p>
                                );
                            })()}
                        </>
                    )}
                </Card>

                {/* ── PERIOD COMPARISON ── */}
                <Card isDark={isDark}>
                    <CardHeader
                        icon={<TrendingUp size={15}/>}
                        title="Period Comparison"
                        subtitle="Category-level delta between two months"
                        isDark={isDark}
                        action={
                            <div className="flex items-center gap-1">
                                <SelectEl isDark={isDark} value={d1Month} onChange={e => setD1Month(Number(e.target.value))} options={monthOpts}/>
                                <SelectEl isDark={isDark} value={d1Year}  onChange={e => setD1Year(Number(e.target.value))}  options={yearOpts.slice(0,2)}/>
                                <span className="text-text-secondary text-xs mx-0.5">vs</span>
                                <SelectEl isDark={isDark} value={d2Month} onChange={e => setD2Month(Number(e.target.value))} options={monthOpts}/>
                                <SelectEl isDark={isDark} value={d2Year}  onChange={e => setD2Year(Number(e.target.value))}  options={yearOpts.slice(0,2)}/>
                            </div>
                        }
                    />
                    <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: "220px" }}>
                        {loadingDelta ? (
                            [1,2,3,4].map(i => <Pulse key={i} isDark={isDark} h="h-10"/>)
                        ) : monthlyDelta.length === 0 ? (
                            <EmptyState icon={<TrendingUp size={22}/>} text="No data for selected period." isDark={isDark}/>
                        ) : (
                            [...monthlyDelta]
                                .sort((a, b) => Math.abs(Number(b.deltaPercentage ?? 0)) - Math.abs(Number(a.deltaPercentage ?? 0)))
                                .map((d, i) => {
                                    const { icon, color, bg } = trendMeta(d.trend);
                                    return (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: isDark ? "rgba(49,57,77,0.35)" : "rgba(16,185,129,0.04)", border: isDark ? "1px solid rgba(78,222,163,0.05)" : "1px solid rgba(16,185,129,0.08)" }}>
                                            <span style={{ color, flexShrink: 0 }}>{icon}</span>
                                            <span className="text-text-primary text-sm font-medium flex-1 truncate">{d.category}</span>
                                            <span className="text-xs shrink-0" style={{ color: isDark ? "#8892a4" : "rgba(0,108,73,0.55)" }}>
                                                ₹{formatCurrency(d.lastMonthSpend)} →&nbsp;
                                            </span>
                                            <span className="text-sm font-bold shrink-0 text-text-primary">₹{formatCurrency(d.currentMonthSpend)}</span>
                                            {d.deltaPercentage != null && (
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: bg, color, flexShrink: 0 }}>
                                                    {Number(d.deltaPercentage) > 0 ? "+" : ""}{Number(d.deltaPercentage).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </Card>
            </div>

            {/* ══ ROW 3 — Top Merchants + Recurring Tracker ══ */}
            <div className="grid grid-cols-2 gap-4">

                {/* ── TOP MERCHANTS ── */}
                <Card isDark={isDark}>
                    <CardHeader icon={<Trophy size={15}/>} title="Top Merchants" subtitle="Ranked by total lifetime spend" isDark={isDark}/>
                    <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: "260px" }}>
                        {loadingMerch ? (
                            [1,2,3,4,5].map(i => <Pulse key={i} isDark={isDark} h="h-10"/>)
                        ) : merchants.length === 0 ? (
                            <EmptyState icon={<Trophy size={22}/>} text="No merchant data — import a statement to populate this." isDark={isDark}/>
                        ) : (
                            merchants.slice(0, 10).map((m, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: isDark ? "rgba(49,57,77,0.35)" : "rgba(16,185,129,0.04)", border: isDark ? "1px solid rgba(78,222,163,0.04)" : "1px solid rgba(16,185,129,0.08)" }}>
                                    <span className="font-black text-xs w-5 text-center shrink-0" style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : isDark ? "#4b5563" : "#9ca3af" }}>
                                        #{m.rank}
                                    </span>
                                    <span className="text-text-primary text-sm font-medium flex-1 truncate">{m.keyword}</span>
                                    <div className="w-16 h-1.5 rounded-full shrink-0" style={{ background: isDark ? "rgba(49,57,77,0.8)" : "rgba(16,185,129,0.10)" }}>
                                        <div className="h-1.5 rounded-full" style={{ width: `${Number(m.percentage)}%`, background: isDark ? "linear-gradient(90deg,#4edea3,#10b981)" : "linear-gradient(90deg,#10b981,#059669)" }}/>
                                    </div>
                                    <span className="text-xs shrink-0 w-9 text-right" style={{ color: isDark ? "#8892a4" : "rgba(0,108,73,0.55)" }}>{Number(m.percentage).toFixed(1)}%</span>
                                    <span className="text-sm font-bold shrink-0 text-text-primary">₹{formatCurrency(m.totalSpent)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* ── RECURRING TRACKER ── */}
                <Card isDark={isDark}>
                    <CardHeader icon={<Repeat2 size={15}/>} title="Recurring Tracker" subtitle="Auto-detected monthly subscriptions" isDark={isDark}/>
                    <div className="flex flex-col gap-2 overflow-y-auto pr-0.5" style={{ maxHeight: "220px" }}>
                        {loadingSubs ? (
                            [1,2,3].map(i => <Pulse key={i} isDark={isDark} h="h-14"/>)
                        ) : subscriptions.length === 0 ? (
                            <EmptyState icon={<Repeat2 size={22}/>} text="No recurring expenses detected yet." isDark={isDark}/>
                        ) : (
                            subscriptions.map((s, i) => {
                                const daysUntilNext = Math.ceil((new Date(s.nextExpectedChargeDate) - new Date()) / 86400000);
                                const isDue = daysUntilNext >= 0 && daysUntilNext <= 5;
                                return (
                                    <div key={i} className="rounded-xl px-3 py-3" style={{ background: isDark ? "rgba(49,57,77,0.40)" : "rgba(16,185,129,0.04)", border: isDue ? `1px solid rgba(245,158,11,0.35)` : isDark ? "1px solid rgba(78,222,163,0.06)" : "1px solid rgba(16,185,129,0.10)" }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-text-primary text-sm font-bold truncate">{s.keyword}</span>
                                                    {isDue && (
                                                        <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 5, background: "rgba(245,158,11,0.15)", color: "#f59e0b", flexShrink: 0 }}>
                                                            Due in {daysUntilNext}d
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs mt-0.5 truncate" style={{ color: isDark ? "rgba(136,146,164,0.65)" : "rgba(0,108,73,0.50)" }}>
                                                    Every ~{s.averageGap}d · Next: {s.nextExpectedChargeDate}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-text-primary font-bold text-sm">₹{formatCurrency(s.averageAmount)}/mo</p>
                                                <p className="text-xs" style={{ color: isDark ? "rgba(136,146,164,0.65)" : "rgba(0,108,73,0.50)" }}>₹{formatCurrency(s.annualCost)}/yr</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {subscriptions.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mt-auto" style={{ background: isDark ? "rgba(78,222,163,0.07)" : "rgba(16,185,129,0.07)", border: isDark ? "1px solid rgba(78,222,163,0.12)" : "1px solid rgba(16,185,129,0.15)" }}>
                            <span className="text-xs font-semibold" style={{ color: isDark ? "rgba(136,146,164,0.8)" : "rgba(0,108,73,0.7)" }}>Total annual commitment</span>
                            <span className="font-black text-base" style={{ color: isDark ? "#4edea3" : "#059669" }}>
                                ₹{formatCurrency(subscriptions.reduce((s, r) => s + Number(r.annualCost), 0))}
                            </span>
                        </div>
                    )}
                </Card>
            </div>

        </div>
    );

    function DnaTooltip({ active, payload, label }) {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ background: isDark ? "#1a2438" : "#fff", border: isDark ? "1px solid rgba(78,222,163,0.2)" : "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: 12 }}>
                <p style={{ color: isDark ? "#4edea3" : "#059669", fontWeight: 700 }}>{label}</p>
                <p style={{ color: isDark ? "#fff" : "#0D1F17" }}>₹{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
}

export default InsightsPage;
