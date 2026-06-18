"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/hooks/use-currency";
import { useRouter } from "next/navigation";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    PiggyBank,
    FileText,
    PlusCircle,
    List,
    RefreshCw,
    AlertCircle,
    Layers,
    BarChart3,
    LineChart as LineChartIcon,
} from "lucide-react";
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface DashboardStats {
    totalSalaries: number;
    totalBudget: number;
    totalExpenses: number;
    totalExpenseAmount: number;
    totalCategories: number;
    currentMonth: string;
    currentMonthExpenses: number;
    currentMonthExpenseCount: number;
    currentMonthBudget: number;
    currentMonthSalaryCount: number;
    averageExpenseAmount: number;
    recentSalaries: { id: number; title: string; month: string; year: number; totalBudget: number }[];
    budgetUtilization: number;
}

interface PayrollHistoryItem {
    month: string;
    year: number;
    totalBudget: number;
    totalExpenses: number;
    remaining: number;
    utilization: number;
}

export default function DashboardPage() {
    const { session, status } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!session?.user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const [statsResponse, historyResponse] = await Promise.all([
                fetch(`/api/dashboard/stats?userId=${session.user.id}`),
                fetch(`/api/dashboard/payroll-history?userId=${session.user.id}`),
            ]);

            if (!statsResponse.ok) {
                throw new Error("Failed to fetch dashboard statistics");
            }

            const statsData = await statsResponse.json();
            setStats(statsData);

            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setPayrollHistory(historyData.history || []);
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
            setHistoryLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchStats();
        }
    }, [status, fetchStats]);

    const { formatCurrency } = useCurrency();

    const formatMonthLabel = (month: string, year: number) => {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthIndex = monthNames.indexOf(month);
        if (monthIndex === -1) return `${month.slice(0, 3)} ${year}`;
        return `${month.slice(0, 3)} ${year}`;
    };

    const getUtilizationColor = (percent: number) => {
        if (percent >= 90) return "bg-red-500";
        if (percent >= 70) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
            <div className="container mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Welcome back, {session.user?.name || session.user?.email?.split("@")[0] || "User"}!
                        </h2>
                        <p className="text-muted-foreground">
                            {`Here's an overview of your financial activity`}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchStats}
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={fetchStats}>
                            Retry
                        </Button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Budget
                            </CardTitle>
                            <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/30">
                                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-32" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(stats?.totalBudget ?? 0)}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Across {stats?.totalSalaries ?? 0} salary records
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Expenses
                            </CardTitle>
                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-32" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(stats?.totalExpenseAmount ?? 0)}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {stats?.totalExpenses ?? 0} total expense items
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg. Expense
                            </CardTitle>
                            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-32" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(stats?.averageExpenseAmount ?? 0)}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Per expense item
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Categories
                            </CardTitle>
                            <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                                <Layers className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">
                                        {stats?.totalCategories ?? 0}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Expense categories
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Current Month Overview */}
                    <Card className="shadow-sm lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <PiggyBank className="h-5 w-5 text-primary" />
                                        {stats?.currentMonth ?? "Current"} Month Overview
                                    </CardTitle>
                                    <CardDescription>
                                        Your financial performance for {stats?.currentMonth ?? "this month"}
                                    </CardDescription>
                                </div>
                                {!loading && stats && (
                                    <Badge variant={stats.budgetUtilization >= 90 ? "destructive" : stats.budgetUtilization >= 70 ? "secondary" : "default"}>
                                        {stats.budgetUtilization}% utilized
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-8 w-48" />
                                </div>
                            ) : stats ? (
                                <div className="space-y-6">
                                    {/* Budget Utilization */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Budget Utilization</span>
                                            <span className="font-medium">{stats.budgetUtilization}%</span>
                                        </div>
                                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-primary/20">
                                            <div
                                                className={`h-full w-full flex-1 transition-all ${getUtilizationColor(stats.budgetUtilization)}`}
                                                style={{ transform: `translateX(-${100 - Math.min(stats.budgetUtilization, 100)}%)` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-lg border bg-card p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Budget</span>
                                                <Wallet className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(stats.currentMonthBudget)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.currentMonthSalaryCount} salary record(s)
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-card p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Spent</span>
                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                            </div>
                                            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(stats.currentMonthExpenses)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.currentMonthExpenseCount} expense(s)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Remaining Budget */}
                                    <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950/30 dark:to-indigo-950/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Remaining Budget</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(Math.max(0, stats.currentMonthBudget - stats.currentMonthExpenses))}
                                                </p>
                                            </div>
                                            <div className="rounded-full bg-white p-3 shadow-sm dark:bg-gray-800">
                                                <PiggyBank className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    No data available for this month. Create a payroll to get started.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Your account information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                                            {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {session.user?.name || "User"}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {session.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-medium">User ID:</span> {session.user?.id}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-medium">Status:</span>{" "}
                                            <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Common tasks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Button
                                        className="w-full justify-start"
                                        variant="default"
                                        onClick={() => router.push("/dashboard/payroll")}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create Payroll
                                    </Button>
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => router.push("/dashboard/payroll")}
                                    >
                                        <List className="mr-2 h-4 w-4" />
                                        View All Payrolls
                                    </Button>
                                    <Button
                                        className="w-full justify-start"
                                        variant="outline"
                                        onClick={() => router.push("/dashboard/expense-types")}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Manage Categories
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Payrolls */}
                <Card className="mt-6 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Payrolls</CardTitle>
                                <CardDescription>Your latest salary records</CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/dashboard/payroll")}
                            >
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : stats?.recentSalaries && stats.recentSalaries.length > 0 ? (
                            <div className="space-y-1">
                                {stats.recentSalaries.map((salary, index) => (
                                    <div
                                        key={salary.id}
                                        className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                                        onClick={() => router.push(`/dashboard/payroll/${salary.id}`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                {salary.title[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{salary.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(
                                                        Date.UTC(salary.year, parseInt(salary.month) - 1)
                                                    ).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">
                                                {formatCurrency(salary.totalBudget)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-8 text-center">
                                <div className="rounded-full bg-muted p-3">
                                    <Wallet className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    No payrolls created yet
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push("/dashboard/payroll")}
                                >
                                    Create your first payroll
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payroll History Chart */}
                <Card className="mt-6 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <LineChartIcon className="h-5 w-5 text-primary" />
                                    Payroll History
                                </CardTitle>
                                <CardDescription>
                                    Budget vs expenses over time
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {historyLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-[300px] w-full" />
                            </div>
                        ) : payrollHistory.length > 0 ? (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsLineChart
                                        data={payrollHistory.map((item) => ({
                                            name: formatMonthLabel(item.month, item.year),
                                            Budget: item.totalBudget,
                                            Expenses: item.totalExpenses,
                                            Remaining: Math.max(0, item.remaining),
                                        }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            className="text-muted-foreground"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            className="text-muted-foreground"
                                            tickFormatter={(value) => {
                                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                                return value.toString();
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--popover))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                color: "hsl(var(--popover-foreground))",
                                            }}
                                            formatter={(value: number) => [formatCurrency(value), undefined]}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="Budget"
                                            stroke="hsl(142.1 76.2% 36.3%)"
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: "hsl(142.1 76.2% 36.3%)" }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Expenses"
                                            stroke="hsl(0 72.2% 50.6%)"
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: "hsl(0 72.2% 50.6%)" }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Remaining"
                                            stroke="hsl(221.2 83.2% 53.3%)"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={{ r: 4, fill: "hsl(221.2 83.2% 53.3%)" }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-8 text-center">
                                <div className="rounded-full bg-muted p-3">
                                    <LineChartIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    No payroll history available yet
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push("/dashboard/payroll")}
                                >
                                    Create your first payroll
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
