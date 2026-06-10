import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { getAnnualSummary, getBudgetStatus, getFinancialSummary, getSortedExpenses } from "../services/expenseService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { LoadingState, ErrorState } from "../components/ui/PageState.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import SpendingChart from "../components/dashboard/SpendingChart.jsx";
import CategoryDonut from "../components/dashboard/CategoryDonut.jsx";
import RecentExpenses from "../components/dashboard/RecentExpenses.jsx";
import { useData } from "../context/DataContext.jsx";

function DashBoard() {
    const [financialSummary, setFinancialSummary] = useState(null);
    const [budgetStatus,     setBudgetStatus]     = useState(null);
    const [annualSummary,    setAnnualSummary]    = useState(null);
    const [recentExpenses,   setRecentExpenses]   = useState([]);
    const [isLoading,        setIsLoading]        = useState(true);
    const [error,            setError]            = useState(null);

    const { refreshKey } = useData();

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const currentYear = new Date().getFullYear();
                const [financial, budget, annual, expenses] = await Promise.all([
                    getFinancialSummary(),
                    getBudgetStatus(),
                    getAnnualSummary(currentYear),
                    getSortedExpenses("expenseTimestamp", "desc")
                ]);
                setFinancialSummary(financial);
                setBudgetStatus(budget);
                setAnnualSummary(annual);
                setRecentExpenses(expenses.slice(0, 5));
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchDashboardData().catch(console.error);
    }, [refreshKey]);

    if (isLoading) return <LoadingState />;
    if (error)     return <ErrorState message={error} />;

    const budgetPercent = ((budgetStatus?.spent / budgetStatus?.budget) * 100).toFixed(1);

    return (
        <div className="flex flex-col gap-4 md:gap-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-text-secondary text-xs md:text-sm mt-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-text-secondary" />
                    Updated: {new Date().toLocaleString()}
                </p>
            </div>

            {/* Budget Alert */}
            {budgetStatus?.warning && (
                <div className="flex items-start md:items-center justify-between bg-error/10 border-l-4 border-error px-4 py-3 rounded-lg gap-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
                        <div>
                            <p className="text-text-primary text-sm font-semibold">Budget Alert</p>
                            <p className="text-text-secondary text-xs">
                                You have consumed {budgetPercent}% of your monthly budget.
                            </p>
                        </div>
                    </div>
                    <p className="text-error text-sm font-semibold shrink-0">{budgetPercent}% Used</p>
                </div>
            )}

            {/* Stat Cards — 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                    title="TOTAL SPENT"
                    value={`₹${formatCurrency(financialSummary?.totalSpent)}`}
                    subtitle={`${financialSummary?.transactionCount} transactions`}
                />
                <StatCard
                    title="THIS MONTH"
                    value={`₹${formatCurrency(budgetStatus?.spent)}`}
                    subtitle="Current month"
                />
                <StatCard
                    title="BUDGET LEFT"
                    value={`₹${formatCurrency(budgetStatus?.remaining)}`}
                    valueColor={budgetStatus?.remaining < 0 ? "text-error" : "text-primary"}
                    subtitle={`${budgetPercent}% used`}
                >
                    <div className="w-full bg-surface-low rounded-full h-1.5 mt-1">
                        <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                                width: `${Math.min((budgetStatus?.spent / budgetStatus?.budget) * 100, 100)}%`,
                                backgroundColor:
                                    (budgetStatus?.spent / budgetStatus?.budget) * 100 >= 100 ? "#ef4444" :
                                    (budgetStatus?.spent / budgetStatus?.budget) * 100 >= 80  ? "#f59e0b" :
                                                                                                "#4edea3"
                            }}
                        />
                    </div>
                </StatCard>
                <StatCard
                    title="TRANSACTIONS"
                    value={financialSummary?.transactionCount}
                    subtitle={`Avg ₹${formatCurrency(financialSummary?.averageExpenseValue)}`}
                />
            </div>

            {/* Charts — stack on mobile */}
            <div className="flex flex-col md:flex-row gap-4">
                <SpendingChart annualSummary={annualSummary} />
                <CategoryDonut financialSummary={financialSummary} />
            </div>

            {/* Recent Expenses */}
            <RecentExpenses expenses={recentExpenses} />
        </div>
    );
}

export default DashBoard;
