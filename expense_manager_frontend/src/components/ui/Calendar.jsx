// Shared Calendar component — used by AddExpenseModal and EditExpenseModal
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

export const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];
export const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function todayDate() {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

export function toYMD(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDisplay(year, month, day) {
    if (!day) return "";
    return `${String(day).padStart(2, "0")} ${MONTHS[month].slice(0, 3)} ${year}`;
}

export function buildCalendarGrid(year, month) {
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
    const remainder = cells.length % 7;
    if (remainder !== 0) for (let d = 1; d <= 7 - remainder; d++) cells.push({ day: d, current: false });
    return cells;
}

function Calendar({ selectedYear, selectedMonth, selectedDay, onSelect, maxDate }) {
    const { isDark } = useTheme();
    const [viewYear,  setViewYear]  = useState(selectedYear  ?? todayDate().year);
    const [viewMonth, setViewMonth] = useState(selectedMonth ?? todayDate().month);
    const cells = buildCalendarGrid(viewYear, viewMonth);
    const td    = todayDate();

    // ── theme tokens ──────────────────────────────────────────────────────────
    const calBg        = isDark ? "rgba(13, 20, 40, 0.98)"  : "#FFFFFF";
    const calBorder    = isDark ? "rgba(78,222,163,0.15)"   : "rgba(0,108,73,0.15)";
    const calShadow    = isDark ? "none"                     : "0 8px 32px rgba(0,0,0,0.10)";
    const headerText   = isDark ? "#ffffff"                  : "#0D1F17";
    const secText      = isDark ? "#8892a4"                  : "#4A6358";
    const dividerColor = isDark ? "rgba(78,222,163,0.08)"   : "rgba(0,108,73,0.08)";
    const hoverBg      = isDark ? "rgba(78,222,163,0.10)"   : "rgba(0,108,73,0.08)";
    const navHoverBg   = isDark ? "rgba(49,57,77,0.8)"      : "rgba(0,108,73,0.10)";
    const primaryColor = isDark ? "#4edea3"                  : "#10B981";
    const selectedGrad = isDark
        ? "linear-gradient(135deg, #4edea3, #10b981)"
        : "linear-gradient(135deg, #10B981, #059669)";
    const selectedText = "#003824";
    const disabledText = isDark ? "rgba(136,146,164,0.3)" : "rgba(74,99,88,0.30)";
    const ghostText    = isDark ? "rgba(136,146,164,0.3)" : "rgba(74,99,88,0.25)";

    function prevMonth() {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    }
    function nextMonth() {
        if (viewYear === maxDate.year && viewMonth === maxDate.month) return;
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    }
    function isDisabled(day) {
        if (!day) return true;
        if (viewYear > maxDate.year) return true;
        if (viewYear === maxDate.year && viewMonth > maxDate.month) return true;
        if (viewYear === maxDate.year && viewMonth === maxDate.month && day > maxDate.day) return true;
        return false;
    }
    function isSelected(day, current) {
        return current && day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
    }
    function isToday(day, current) {
        return current && day === td.day && viewMonth === td.month && viewYear === td.year;
    }
    const nextDisabled = viewYear === maxDate.year && viewMonth === maxDate.month;

    return (
        <div
            className="rounded-xl p-4"
            style={{
                backgroundColor: calBg,
                border: `1px solid ${calBorder}`,
                backdropFilter: "blur(24px)",
                boxShadow: calShadow,
                minWidth: "272px",
            }}
        >
            {/* nav */}
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ color: secText }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = navHoverBg; e.currentTarget.style.color = primaryColor; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = secText; }}
                >
                    <ChevronLeft size={15} />
                </button>

                <span className="text-sm font-semibold tracking-wide" style={{ color: headerText }}>
                    {MONTHS[viewMonth]} {viewYear}
                </span>

                <button type="button" onClick={nextMonth} disabled={nextDisabled}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: secText }}
                    onMouseEnter={e => { if (!nextDisabled) { e.currentTarget.style.backgroundColor = navHoverBg; e.currentTarget.style.color = primaryColor; } }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = secText; }}
                >
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: secText }}>{d}</div>
                ))}
            </div>

            {/* cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((cell, i) => {
                    const selected = isSelected(cell.day, cell.current);
                    const today    = isToday(cell.day, cell.current);
                    const disabled = !cell.current || isDisabled(cell.day);

                    const baseColor = selected
                        ? selectedText
                        : !cell.current ? ghostText
                        : disabled ? disabledText
                        : today ? primaryColor
                        : secText;

                    return (
                        <button key={i} type="button" disabled={disabled}
                            onClick={() => !disabled && onSelect(viewYear, viewMonth, cell.day)}
                            className="relative w-full aspect-square flex items-center justify-center rounded-lg text-xs transition-all"
                            style={{
                                fontFamily: "'Berkeley Mono', 'Courier New', monospace",
                                color: baseColor,
                                background: selected ? selectedGrad : "transparent",
                                cursor: disabled ? "default" : "pointer",
                            }}
                            onMouseEnter={e => {
                                if (!selected && !disabled && cell.current) {
                                    e.currentTarget.style.backgroundColor = hoverBg;
                                    e.currentTarget.style.color = headerText;
                                }
                            }}
                            onMouseLeave={e => {
                                if (!selected && !disabled && cell.current) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = today ? primaryColor : secText;
                                }
                            }}
                        >
                            {cell.day}
                            {today && !selected && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                    style={{ backgroundColor: primaryColor }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: `1px solid ${dividerColor}` }}>
                <button type="button" onClick={() => onSelect(null, null, null)}
                    className="text-xs transition-colors"
                    style={{ color: secText }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                    onMouseLeave={e => e.currentTarget.style.color = secText}
                >
                    Clear
                </button>
                <button type="button" onClick={() => onSelect(td.year, td.month, td.day)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: primaryColor }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                    Today
                </button>
            </div>
        </div>
    );
}

export default Calendar;
