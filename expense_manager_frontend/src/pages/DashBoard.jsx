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
                console.log("✅ Dashboard data loaded");
            } catch (err) {
                console.error("❌ Dashboard fetch error:", err.response?.status, err.response?.data);
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
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-text-secondary text-sm mt-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-text-secondary" />
                    Updated: {new Date().toLocaleString()}
                </p>
            </div>

            {/* Budget Alert */}
            {budgetStatus?.warning && (
                <div className="flex items-center justify-between bg-error/10 border-l-4 border-error px-5 py-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={18} className="text-error" />
                        <div>
                            <p className="text-text-primary text-sm font-semibold">Budget Alert</p>
                            <p className="text-text-secondary text-xs">
                                You have consumed {budgetPercent}% of your monthly budget. Consider adjusting your spending.
                            </p>
                        </div>
                    </div>
                    <p className="text-error text-sm font-semibold">{budgetPercent}% Used</p>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4">

                <StatCard
                    title="TOTAL SPENT"
                    value={`₹${formatCurrency(financialSummary?.totalSpent)}`}
                    subtitle={`${financialSummary?.transactionCount} total transactions`}
                />

                <StatCard
                    title="THIS MONTH"
                    value={`₹${formatCurrency(budgetStatus?.spent)}`}
                    subtitle="Current month spending"
                />

                <StatCard
                    title="BUDGET REMAINING"
                    value={`₹${formatCurrency(budgetStatus?.remaining)}`}
                    valueColor={budgetStatus?.remaining < 0 ? "text-error" : "text-primary"}
                    subtitle={`${budgetPercent}% of budget used`}
                >
                    {/* Progress bar */}
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
                    title="TOTAL TRANSACTIONS"
                    value={financialSummary?.transactionCount}
                    subtitle={`Avg ₹${formatCurrency(financialSummary?.averageExpenseValue)} / transaction`}
                />

            </div>

            {/* Charts */}
            <div className="flex gap-4">
                <SpendingChart annualSummary={annualSummary} />
                <CategoryDonut financialSummary={financialSummary} />
            </div>

            {/* Recent Expenses */}
            <RecentExpenses expenses={recentExpenses} />

        </div>
    );
}

export default DashBoard;
