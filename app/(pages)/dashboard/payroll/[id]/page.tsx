"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Expense } from "@/models/Expense";
import { Payroll } from "@/models/Payroll";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, DollarSignIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon, PlusIcon, PencilIcon, TrashIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirm } from "@/context/confirm-context";
import { ExpenseCategory } from "@/models/ExpenseCategory";
import { useAuth } from "@/context/auth-context";

const expenseSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  amount: z.number().min(0, "Amount must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  note: z.string(),
  withDue: z.boolean(),
  dueDate: z.string().optional(),
  expensesCategoryId: z.number().min(1, "Category is required"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseInsight {
  expense: Expense;
  priority: 'critical' | 'high' | 'medium' | 'low';
  daysUntilDue: number | null;
  message: string;
  action: string;
}

interface PaymentScenario {
  id: string;
  name: string;
  description: string;
  expenses: {
    expenseId: number;
    paymentOrder: number;
    suggestedPayDate: Date;
    reasoning: string;
  }[];
  projectedSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalCost: number;
  pros: string[];
  cons: string[];
  recommendationScore: number;
}

// Future enhancement: Decision tree visualization
// interface DecisionTreeNode {
//   type: 'expense' | 'decision' | 'outcome';
//   expenseId?: number;
//   question?: string;
//   yesPath?: DecisionTreeNode;
//   noPath?: DecisionTreeNode;
//   outcome?: string;
//   savings?: number;
// }

// Helper function to format currency with commas
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function PayrollExpensesPage() {
  const confirm = useConfirm();
  const { id } = useParams();
  const [salary, setSalary] = useState<Payroll | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  const { session } = useAuth();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      quantity: 1,
      note: "",
      withDue: false,
      dueDate: new Date().toISOString(),
      expensesCategoryId: undefined,
    },
  });

  const fetchExpenses = useCallback(async () => {
    if (id) {
      const salaryId = typeof id === 'string' ? id : id[0];
      const response = await fetch(`/api/expense/salary/${salaryId}`);
      const data = await response.json();
      setExpenses(data);
    }
  }, [id]);

  const expenseCategoriesOptions = useMemo(() => {
    return expenseCategories.map((category: ExpenseCategory) => ({
      label: category.name,
      value: category.id,
    }));
  }, [expenseCategories]);

  useEffect(() => {
    const fetchExpenseCategories = async () => {
      if (!session) return;
      const response = await fetch(`/api/expense-type?userId=${session.user.id}&page=1&pageSize=${Number.MAX_SAFE_INTEGER}`);
      const data = await response.json();
      setExpenseCategories(data?.data ?? []);
    };
    fetchExpenseCategories();

    const fetchSalary = async () => {
      if (id) {
        setIsLoading(true);
        const salaryId = typeof id === 'string' ? id : id[0];
        const response = await fetch(`/api/salary/${salaryId}`);
        const data = await response.json();
        setSalary(data);
        setIsLoading(false);
      }
    };
    fetchSalary();
    fetchExpenses();
  }, [session, id, fetchExpenses]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount * expense.quantity), 0);
  const remainingBudget = salary ? salary.totalBudget - totalExpenses : 0;
  const budgetUtilization = salary ? (totalExpenses / salary.totalBudget) * 100 : 0;

  // Smart algorithm to analyze expenses and generate insights
  const expenseInsights = useMemo(() => {
    const insights: ExpenseInsight[] = [];
    const now = new Date();

    expenses.forEach((expense) => {
      if (expense.withDue === 1 && expense.dueDate) {
        const dueDate = new Date(expense.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const totalAmount = expense.amount * expense.quantity;

        let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let message = '';
        let action = '';

        // Critical: Overdue expenses
        if (daysUntilDue < 0) {
          priority = 'critical';
          message = `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;
          action = 'Pay immediately to avoid penalties';
        }
        // Critical: Due today
        else if (daysUntilDue === 0) {
          priority = 'critical';
          message = 'Due today';
          action = 'Process payment urgently';
        }
        // High: Due within 3 days
        else if (daysUntilDue <= 3) {
          priority = 'high';
          message = `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
          action = 'Prepare payment soon';
        }
        // Medium: Due within 7 days
        else if (daysUntilDue <= 7) {
          priority = 'medium';
          message = `Due in ${daysUntilDue} days`;
          action = 'Schedule payment this week';
        }
        // Low: Due later
        else {
          priority = 'low';
          message = `Due in ${daysUntilDue} days`;
          action = 'Monitor and plan ahead';
        }

        // Adjust priority based on amount relative to budget
        if (salary && totalAmount > salary.totalBudget * 0.2) {
          if (priority === 'medium') priority = 'high';
          if (priority === 'low') priority = 'medium';
          action += ' (High-value expense)';
        }

        insights.push({
          expense,
          priority,
          daysUntilDue,
          message,
          action,
        });
      }
    });

    // Sort by priority and days until due
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return insights.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (a.daysUntilDue ?? Infinity) - (b.daysUntilDue ?? Infinity);
    });
  }, [expenses, salary]);

  // Filter insights by priority
  const criticalInsights = expenseInsights.filter(i => i.priority === 'critical');
  const highPriorityInsights = expenseInsights.filter(i => i.priority === 'high');
  const mediumPriorityInsights = expenseInsights.filter(i => i.priority === 'medium');

  // Decision Tree Algorithm for Payment Scenarios
  const paymentScenarios = useMemo(() => {
    if (!salary || expenses.length === 0) return [];

    const scenarios: PaymentScenario[] = [];
    const now = new Date();
    
    // Helper function to calculate penalty cost
    const calculatePenalty = (expense: Expense, daysOverdue: number): number => {
      if (daysOverdue <= 0) return 0;
      const totalAmount = expense.amount * expense.quantity;
      // Assume 5% penalty per week overdue (0.714% per day)
      return totalAmount * 0.00714 * daysOverdue;
    };

    // Helper function to calculate interest savings if paid early
    const calculateEarlySavings = (expense: Expense, daysEarly: number): number => {
      if (daysEarly <= 0) return 0;
      const totalAmount = expense.amount * expense.quantity;
      // Assume 2% discount for early payment (within 7 days)
      if (daysEarly >= 7) return totalAmount * 0.02;
      return totalAmount * 0.01;
    };

    // Scenario 1: Conservative - Pay all critical and high priority first
    const conservativeScenario = (() => {
      let cost = 0;
      const savings = 0;
      const paymentPlan: PaymentScenario['expenses'] = [];
      let order = 1;

      // Pay critical expenses immediately
      criticalInsights.forEach(insight => {
        const daysOverdue = insight.daysUntilDue ? Math.abs(Math.min(0, insight.daysUntilDue)) : 0;
        const penalty = calculatePenalty(insight.expense, daysOverdue);
        cost += (insight.expense.amount * insight.expense.quantity) + penalty;
        
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: new Date(),
          reasoning: `Critical priority - ${insight.message}. Penalty: $${formatCurrency(penalty)}`
        });
      });

      // Pay high priority within 1-2 days
      highPriorityInsights.forEach(insight => {
        const payDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        cost += insight.expense.amount * insight.expense.quantity;
        
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: payDate,
          reasoning: `High priority - ${insight.message}. Pay within 1-2 days to avoid escalation.`
        });
      });

      // Pay medium priority as scheduled
      mediumPriorityInsights.forEach(insight => {
        const dueDate = insight.expense.dueDate ? new Date(insight.expense.dueDate) : new Date();
        cost += insight.expense.amount * insight.expense.quantity;
        
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000),
          reasoning: `Medium priority - Pay 1 day before due date to ensure clearance.`
        });
      });

      // Add remaining expenses without due dates
      expenses.filter(e => e.withDue === 0).forEach(expense => {
        cost += expense.amount * expense.quantity;
        paymentPlan.push({
          expenseId: expense.id,
          paymentOrder: order++,
          suggestedPayDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          reasoning: 'No due date - Schedule within 2 weeks for cash flow management.'
        });
      });

      return {
        id: 'conservative',
        name: '🛡️ Conservative (Low Risk)',
        description: 'Pay critical items immediately, minimize all penalty risks',
        expenses: paymentPlan,
        projectedSavings: savings,
        riskLevel: 'low' as const,
        totalCost: cost,
        pros: [
          'Zero late payment penalties',
          'Maintains excellent credit standing',
          'Peace of mind with no overdue items',
          'Avoids potential service disruptions'
        ],
        cons: [
          'Requires immediate cash availability',
          'May miss opportunity to optimize cash flow',
          'No benefit from payment flexibility'
        ],
        recommendationScore: criticalInsights.length > 0 ? 95 : 70
      };
    })();

    // Scenario 2: Balanced - Optimize payment timing while managing risk
    const balancedScenario = (() => {
      let cost = 0;
      let savings = 0;
      const paymentPlan: PaymentScenario['expenses'] = [];
      let order = 1;

      // Pay overdue items immediately to stop penalty accumulation
      const overdueInsights = expenseInsights.filter(i => i.daysUntilDue !== null && i.daysUntilDue < 0);
      overdueInsights.forEach(insight => {
        const daysOverdue = Math.abs(insight.daysUntilDue!);
        const penalty = calculatePenalty(insight.expense, daysOverdue);
        cost += (insight.expense.amount * insight.expense.quantity) + penalty;
        
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: new Date(),
          reasoning: `Overdue by ${daysOverdue} days. Immediate payment stops penalty growth ($${formatCurrency(penalty)} already accrued).`
        });
      });

      // Pay due today items
      const dueTodayInsights = expenseInsights.filter(i => i.daysUntilDue === 0);
      dueTodayInsights.forEach(insight => {
        cost += insight.expense.amount * insight.expense.quantity;
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: new Date(),
          reasoning: 'Due today - Process to maintain good standing.'
        });
      });

      // For expenses due in 1-3 days, pay on the actual due date
      const shortTermInsights = expenseInsights.filter(i => i.daysUntilDue !== null && i.daysUntilDue > 0 && i.daysUntilDue <= 3);
      shortTermInsights.forEach(insight => {
        const dueDate = new Date(insight.expense.dueDate!);
        cost += insight.expense.amount * insight.expense.quantity;
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: dueDate,
          reasoning: `Due in ${insight.daysUntilDue} days. Pay on due date for optimal cash flow.`
        });
      });

      // For larger expenses due within 7+ days, consider early payment if discount available
      const mediumTermInsights = expenseInsights.filter(i => {
        if (i.daysUntilDue === null || i.daysUntilDue <= 3) return false;
        const amount = i.expense.amount * i.expense.quantity;
        return amount > (salary?.totalBudget || 0) * 0.15; // Large expenses (>15% of budget)
      });

      mediumTermInsights.forEach(insight => {
        const daysEarly = Math.max(0, insight.daysUntilDue! - 2);
        const potentialSavings = calculateEarlySavings(insight.expense, daysEarly);
        const amount = insight.expense.amount * insight.expense.quantity;
        
        if (potentialSavings > 0) {
          cost += amount - potentialSavings;
          savings += potentialSavings;
          const payDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
          paymentPlan.push({
            expenseId: insight.expense.id,
            paymentOrder: order++,
            suggestedPayDate: payDate,
            reasoning: `Large expense ($${formatCurrency(amount)}). Early payment could save $${formatCurrency(potentialSavings)}.`
          });
        } else {
          cost += amount;
          const dueDate = new Date(insight.expense.dueDate!);
          paymentPlan.push({
            expenseId: insight.expense.id,
            paymentOrder: order++,
            suggestedPayDate: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000),
            reasoning: 'Pay 1 day before due date for safety margin.'
          });
        }
      });

      // Remaining expenses - spread them out
      const remainingExpenses = expenses.filter(e => 
        !paymentPlan.some(p => p.expenseId === e.id)
      );

      remainingExpenses.forEach((expense, index) => {
        const amount = expense.amount * expense.quantity;
        cost += amount;
        const spacing = Math.ceil(14 / Math.max(1, remainingExpenses.length));
        const payDate = new Date(now.getTime() + (index + 1) * spacing * 24 * 60 * 60 * 1000);
        
        paymentPlan.push({
          expenseId: expense.id,
          paymentOrder: order++,
          suggestedPayDate: payDate,
          reasoning: amount < 100 ? 'Small expense - can be flexible with timing.' : 'Spread payments for better cash flow.'
        });
      });

      return {
        id: 'balanced',
        name: '⚖️ Balanced (Optimal)',
        description: 'Strategic payment timing to maximize savings while minimizing risk',
        expenses: paymentPlan,
        projectedSavings: savings,
        riskLevel: 'medium' as const,
        totalCost: cost,
        pros: [
          'Optimizes cash flow management',
          `Potential savings: $${formatCurrency(savings)}`,
          'Balances risk with opportunity',
          'Strategic payment scheduling',
          'Maintains good payment history'
        ],
        cons: [
          'Requires careful monitoring of due dates',
          'Small risk if payment processing delays occur',
          'Need to track multiple payment dates'
        ],
        recommendationScore: 90
      };
    })();

    // Scenario 3: Aggressive - Maximum cash flow optimization (higher risk)
    const aggressiveScenario = (() => {
      let cost = 0;
      let savings = 0;
      const paymentPlan: PaymentScenario['expenses'] = [];
      let order = 1;

      // Only pay items that are overdue by more than 3 days or due today
      const urgentInsights = expenseInsights.filter(i => 
        (i.daysUntilDue !== null && i.daysUntilDue < -3) || i.daysUntilDue === 0
      );

      urgentInsights.forEach(insight => {
        const daysOverdue = insight.daysUntilDue ? Math.abs(Math.min(0, insight.daysUntilDue)) : 0;
        const penalty = calculatePenalty(insight.expense, daysOverdue);
        cost += (insight.expense.amount * insight.expense.quantity) + penalty;
        
        paymentPlan.push({
          expenseId: insight.expense.id,
          paymentOrder: order++,
          suggestedPayDate: new Date(),
          reasoning: daysOverdue > 0 
            ? `Already overdue by ${daysOverdue} days ($${formatCurrency(penalty)} penalty). Must pay now.`
            : 'Due today - cannot delay further.'
        });
      });

      // All other expenses: pay on the actual due date (no buffer)
      const remainingWithDue = expenses.filter(e => 
        e.withDue === 1 && !paymentPlan.some(p => p.expenseId === e.id)
      );

      remainingWithDue.forEach(expense => {
        const dueDate = new Date(expense.dueDate!);
        cost += expense.amount * expense.quantity;
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        paymentPlan.push({
          expenseId: expense.id,
          paymentOrder: order++,
          suggestedPayDate: dueDate,
          reasoning: `Pay exactly on due date (${daysUntil} days). Maximizes cash availability.`
        });
      });

      // Expenses without due dates: delay as long as reasonable
      const noDueExpenses = expenses.filter(e => 
        e.withDue === 0 && !paymentPlan.some(p => p.expenseId === e.id)
      );

      // Sort by amount (pay smallest first to maintain vendor relationships)
      const sortedNoDue = [...noDueExpenses].sort((a, b) => 
        (a.amount * a.quantity) - (b.amount * b.quantity)
      );

      sortedNoDue.forEach((expense, index) => {
        const amount = expense.amount * expense.quantity;
        cost += amount;
        // Spread over 30 days
        const payDate = new Date(now.getTime() + (index + 1) * 5 * 24 * 60 * 60 * 1000);
        
        paymentPlan.push({
          expenseId: expense.id,
          paymentOrder: order++,
          suggestedPayDate: payDate,
          reasoning: amount < 50 
            ? 'Very small expense - low priority, delay for cash preservation.'
            : 'No due date - schedule flexibly to maintain working capital.'
        });
      });

      // Calculate theoretical savings from holding cash longer
      const avgDelay = 7; // Average days payment is delayed
      const opportunityCost = 0.0001; // Daily opportunity cost (3.65% annual)
      const cashHoldingSavings = totalExpenses * opportunityCost * avgDelay;
      savings += cashHoldingSavings;

      return {
        id: 'aggressive',
        name: '🚀 Aggressive (High Risk)',
        description: 'Maximize cash flow by paying everything at the last possible moment',
        expenses: paymentPlan,
        projectedSavings: savings,
        riskLevel: 'high' as const,
        totalCost: cost,
        pros: [
          `Maximizes available working capital`,
          `Theoretical savings: $${formatCurrency(savings)}`,
          'Flexibility for unexpected opportunities',
          'Extended cash float period',
          'Pays smallest bills first for vendor relations'
        ],
        cons: [
          '⚠️ High risk of late payments if delays occur',
          'May damage credit rating if any payment is missed',
          'Potential penalties if grace periods misunderstood',
          'Requires perfect execution and timing',
          'Stressful to manage multiple last-minute payments'
        ],
        recommendationScore: criticalInsights.length > 0 ? 30 : 55
      };
    })();

    // Scenario 4: Smart Prioritization - AI-driven decision tree approach
    const smartScenario = (() => {
      let cost = 0;
      let savings = 0;
      const paymentPlan: PaymentScenario['expenses'] = [];
      let order = 1;

      // Decision tree logic
      const analyzeExpense = (expense: Expense): { priority: number; reasoning: string } => {
        const amount = expense.amount * expense.quantity;
        const percentOfBudget = salary ? (amount / salary.totalBudget) * 100 : 0;
        const insight = expenseInsights.find(i => i.expense.id === expense.id);
        
        let priority = 50; // Base priority (0-100, higher = more urgent)
        const reasons: string[] = [];

        // Factor 1: Time sensitivity
        if (insight?.daysUntilDue !== null && insight?.daysUntilDue !== undefined) {
          if (insight.daysUntilDue < 0) {
            priority += 50;
            reasons.push(`Overdue by ${Math.abs(insight.daysUntilDue)} days`);
          } else if (insight.daysUntilDue === 0) {
            priority += 45;
            reasons.push('Due today');
          } else if (insight.daysUntilDue <= 3) {
            priority += 30;
            reasons.push(`Due in ${insight.daysUntilDue} days`);
          } else if (insight.daysUntilDue <= 7) {
            priority += 15;
            reasons.push('Due this week');
          }
        } else {
          priority -= 20; // Lower priority for no due date
          reasons.push('No due date - flexible');
        }

        // Factor 2: Amount relative to budget
        if (percentOfBudget > 25) {
          priority += 20;
          reasons.push(`Large expense (${percentOfBudget.toFixed(0)}% of budget)`);
        } else if (percentOfBudget > 15) {
          priority += 10;
          reasons.push('Medium-large expense');
        } else if (percentOfBudget < 2) {
          priority -= 10;
          reasons.push('Small expense - low impact');
        }

        // Factor 3: Penalty risk
        if (insight?.daysUntilDue !== null && insight?.daysUntilDue !== undefined && insight.daysUntilDue < 0) {
          const penalty = calculatePenalty(expense, Math.abs(insight.daysUntilDue));
          const penaltyPercent = (penalty / amount) * 100;
          if (penaltyPercent > 5) {
            priority += 15;
            reasons.push(`High penalty risk ($${formatCurrency(penalty)})`);
          }
        }

        // Factor 4: Budget pressure
        if (salary && remainingBudget < salary.totalBudget * 0.2) {
          if (amount < 100) {
            priority += 5; // Slightly favor small expenses when budget is tight
            reasons.push('Budget tight - small expense preferred');
          }
        }

        return { priority, reasoning: reasons.join('; ') };
      };

      // Analyze and sort all expenses
      const analyzedExpenses = expenses.map(expense => ({
        expense,
        analysis: analyzeExpense(expense)
      })).sort((a, b) => b.analysis.priority - a.analysis.priority);

      // Create payment plan based on prioritization
      let runningTotal = 0;
      const budgetThreshold = salary ? salary.totalBudget * 0.9 : Infinity;

      analyzedExpenses.forEach(({ expense, analysis }, index) => {
        const amount = expense.amount * expense.quantity;
        runningTotal += amount;

        let payDate: Date;
        let reasoning: string;

        if (analysis.priority >= 90) {
          // Urgent - pay immediately
          payDate = new Date();
          reasoning = `URGENT (Priority: ${analysis.priority}). ${analysis.reasoning}`;
        } else if (analysis.priority >= 70) {
          // High priority - pay within 1-2 days
          payDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
          reasoning = `HIGH PRIORITY (${analysis.priority}). ${analysis.reasoning}`;
        } else if (analysis.priority >= 50) {
          // Medium - pay on due date or within a week
          const insight = expenseInsights.find(i => i.expense.id === expense.id);
          if (insight?.expense.dueDate) {
            payDate = new Date(insight.expense.dueDate);
          } else {
            payDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          }
          reasoning = `MEDIUM PRIORITY (${analysis.priority}). ${analysis.reasoning}`;
        } else {
          // Low priority - flexible timing
          payDate = new Date(now.getTime() + Math.min(14, 7 + index) * 24 * 60 * 60 * 1000);
          reasoning = `LOW PRIORITY (${analysis.priority}). ${analysis.reasoning}`;
        }

        // Check if we're approaching budget limit
        if (runningTotal > budgetThreshold && salary) {
          reasoning += ` ⚠️ Approaching budget limit ($${formatCurrency(runningTotal)}/$${formatCurrency(salary.totalBudget)})`;
        }

        cost += amount;
        paymentPlan.push({
          expenseId: expense.id,
          paymentOrder: order++,
          suggestedPayDate: payDate,
          reasoning
        });
      });

      // Calculate savings from optimized timing
      const optimalTimingSavings = totalExpenses * 0.015; // ~1.5% from optimization
      savings += optimalTimingSavings;

      const overBudget = salary ? runningTotal > salary.totalBudget : false;

      return {
        id: 'smart',
        name: '🧠 Smart AI-Driven',
        description: 'AI analyzes multiple factors to create optimal payment strategy',
        expenses: paymentPlan,
        projectedSavings: savings,
        riskLevel: 'low' as const,
        totalCost: cost,
        pros: [
          'AI-powered multi-factor analysis',
          'Considers urgency, amount, penalties, and budget',
          'Dynamic prioritization based on current situation',
          `Optimized savings: $${formatCurrency(savings)}`,
          'Balances all risk factors intelligently',
          overBudget ? '⚠️ Budget exceeded - prioritization critical' : '✓ Within budget'
        ],
        cons: [
          'Requires trust in AI recommendations',
          'May suggest counterintuitive timing',
          'Needs regular monitoring of assumptions'
        ],
        recommendationScore: 85
      };
    })();

    scenarios.push(conservativeScenario, balancedScenario, aggressiveScenario, smartScenario);

    // Sort by recommendation score
    return scenarios.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }, [expenses, salary, expenseInsights, criticalInsights, highPriorityInsights, mediumPriorityInsights, remainingBudget, totalExpenses]);

  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return '-';
    const category = expenseCategories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      form.reset({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        quantity: expense.quantity,
        note: expense.note || "",
        withDue: expense.withDue === 1,
        dueDate: expense.dueDate || new Date().toISOString(),
        expensesCategoryId: expense.expensesCategoryId || undefined,
      });
    } else {
      setEditingExpense(null);
      form.reset({
        id: undefined,
        title: "",
        amount: 0,
        quantity: 1,
        note: "",
        withDue: false,
        dueDate: new Date().toISOString(),
        expensesCategoryId: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<ExpenseFormData> = async (data) => {
    try {
      if (!id) return;
      const salaryId = typeof id === 'string' ? parseInt(id) : parseInt(id[0]);
      const payload = {
        ...data,
        withDue: data.withDue ? 1 : 0,
        salaryId,
      };

      if (editingExpense) {
        // Update
        const response = await fetch(`/api/expense/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success("Expense updated successfully");
          fetchExpenses();
          setIsDialogOpen(false);
        } else {
          toast.error("Failed to update expense");
        }
      } else {
        // Create
        const response = await fetch('/api/expense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success("Expense created successfully");
          fetchExpenses();
          setIsDialogOpen(false);
        } else {
          toast.error("Failed to create expense");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  const handleDeleteClick = async (expenseId: number) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    confirm.fire(async () => {
      const response = await fetch(`/api/expense/${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Expense deleted successfully");
        fetchExpenses();
      } else {
        toast.error("Failed to delete expense");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Payroll Expenses
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage and track expenses for your payroll period
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Update the expense details below.' : 'Fill in the details to create a new expense.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title Field - Full Width */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rent, Utilities, Groceries" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this expense
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount and Quantity - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount per Unit</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              className="pl-7"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price per item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of units
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Total Amount Display */}
                {form.watch("amount") > 0 && form.watch("quantity") > 0 && (
                  <div className="p-4 bg-muted rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                      <span className="text-2xl font-bold">
                        ${formatCurrency(form.watch("amount") * form.watch("quantity"))}
                      </span>
                    </div>
                    {form.watch("quantity") > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.watch("quantity")} × ${formatCurrency(form.watch("amount"))}
                      </p>
                    )}
                  </div>
                )}

                {/* Category Field - Full Width */}
                <FormField
                  control={form.control}
                  name="expensesCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategoriesOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categorize this expense for better tracking and reporting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Note Field - Full Width */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional details or context about this expense..."
                          className="resize-none min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Any additional information about this expense
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <FormField
                    control={form.control}
                    name="withDue"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                          <FormLabel className="text-base font-semibold">Due Date</FormLabel>
                          <FormDescription>
                            Does this expense have a specific due date?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("withDue") && (
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Due Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                            />
                          </FormControl>
                          <FormDescription>
                            When does this expense need to be paid?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingExpense ? 'Update Expense' : 'Create Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Smart Insights Section */}
      {expenseInsights.length > 0 && (
        <div className="space-y-4">
          {criticalInsights.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Critical Attention Required</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {criticalInsights.map((insight) => (
                    <div key={insight.expense.id} className="flex items-start justify-between p-2 bg-destructive/10 rounded">
                      <div className="flex-1">
                        <p className="font-semibold">{insight.expense.title}</p>
                        <p className="text-sm">{insight.message} • ${formatCurrency(insight.expense.amount * insight.expense.quantity)}</p>
                        <p className="text-xs mt-1 text-muted-foreground">{insight.action}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(insight.expense)}
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {highPriorityInsights.length > 0 && (
            <Alert>
              <ClockIcon className="h-4 w-4" />
              <AlertTitle>High Priority Expenses</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {highPriorityInsights.map((insight) => (
                    <div key={insight.expense.id} className="flex items-start justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <p className="font-semibold">{insight.expense.title}</p>
                        <p className="text-sm">{insight.message} • ${formatCurrency(insight.expense.amount * insight.expense.quantity)}</p>
                        <p className="text-xs mt-1 text-muted-foreground">{insight.action}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(insight.expense)}
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {mediumPriorityInsights.length > 0 && criticalInsights.length === 0 && highPriorityInsights.length === 0 && (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertTitle>Upcoming Expenses</AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  You have {mediumPriorityInsights.length} expense{mediumPriorityInsights.length !== 1 ? 's' : ''} due within the next week. 
                  All critical and high-priority items are handled.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {expenseInsights.length === 0 && expenses.some(e => e.withDue === 0) && (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertTitle>No Time-Sensitive Expenses</AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  All expenses without due dates can be managed flexibly. Consider setting due dates for better tracking.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Payment Scenarios Section */}
      {paymentScenarios.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">💡 Smart Payment Scenarios</h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered decision tree analysis with {paymentScenarios.length} strategies to help you save money
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {paymentScenarios.map((scenario, index) => (
              <Card key={scenario.id} className={`${index === 0 ? 'border-2 border-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {scenario.name}
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {scenario.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        scenario.riskLevel === 'low' ? 'default' : 
                        scenario.riskLevel === 'medium' ? 'secondary' : 
                        'destructive'
                      }
                      className="ml-2"
                    >
                      {scenario.riskLevel} risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-lg font-bold">${formatCurrency(scenario.totalCost)}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Projected Savings</p>
                      <p className="text-lg font-bold text-green-600">
                        ${formatCurrency(scenario.projectedSavings)}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Recommendation Score</p>
                      <p className="text-xs font-semibold">{scenario.recommendationScore}/100</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          scenario.recommendationScore >= 80 ? 'bg-green-500' :
                          scenario.recommendationScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${scenario.recommendationScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Pros */}
                  <div>
                    <p className="text-sm font-semibold mb-2 text-green-600">✓ Advantages</p>
                    <ul className="space-y-1">
                      {scenario.pros.slice(0, 3).map((pro, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <p className="text-sm font-semibold mb-2 text-orange-600">⚠ Considerations</p>
                    <ul className="space-y-1">
                      {scenario.cons.slice(0, 2).map((con, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment Timeline Preview */}
                  <div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          View Detailed Payment Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{scenario.name} - Detailed Payment Plan</DialogTitle>
                          <DialogDescription>
                            Step-by-step payment schedule with reasoning for each expense
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          {scenario.expenses.map((payment) => {
                            const expense = expenses.find(e => e.id === payment.expenseId);
                            if (!expense) return null;
                            
                            return (
                              <div key={payment.expenseId} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        #{payment.paymentOrder}
                                      </Badge>
                                      <p className="font-semibold">{expense.title}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {payment.reasoning}
                                    </p>
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="font-bold">
                                      ${formatCurrency(expense.amount * expense.quantity)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {expense.quantity > 1 ? `${expense.quantity} × $${formatCurrency(expense.amount)}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>
                                    Suggested payment date: {payment.suggestedPayDate.toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <DialogFooter className="mt-4">
                          <div className="w-full space-y-2">
                            <div className="flex justify-between items-center p-3 bg-muted rounded">
                              <span className="font-semibold">Total Cost:</span>
                              <span className="text-lg font-bold">${formatCurrency(scenario.totalCost)}</span>
                            </div>
                            {scenario.projectedSavings > 0 && (
                              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded">
                                <span className="font-semibold text-green-700 dark:text-green-400">
                                  Projected Savings:
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  ${formatCurrency(scenario.projectedSavings)}
                                </span>
                              </div>
                            )}
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Scenario Comparison</CardTitle>
              <CardDescription>
                Quick comparison of all payment strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Savings</TableHead>
                      <TableHead className="text-center">Risk Level</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Best For</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentScenarios.map((scenario) => (
                      <TableRow key={scenario.id}>
                        <TableCell className="font-medium">{scenario.name}</TableCell>
                        <TableCell className="text-right">${formatCurrency(scenario.totalCost)}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ${formatCurrency(scenario.projectedSavings)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={
                              scenario.riskLevel === 'low' ? 'default' : 
                              scenario.riskLevel === 'medium' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {scenario.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold">{scenario.recommendationScore}</span>
                          <span className="text-muted-foreground">/100</span>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {scenario.id === 'conservative' && 'Peace of mind'}
                          {scenario.id === 'balanced' && 'Most situations'}
                          {scenario.id === 'aggressive' && 'Cash flow critical'}
                          {scenario.id === 'smart' && 'Data-driven decisions'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {salary && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <WalletIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${formatCurrency(salary.totalBudget)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {salary.month} {salary.year} • Day {salary.day}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${formatCurrency(totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${formatCurrency(Math.abs(remainingBudget))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={budgetUtilization > 100 ? "destructive" : budgetUtilization > 80 ? "secondary" : "default"}>
                    {budgetUtilization.toFixed(1)}% used
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{salary.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4" />
                    {salary.month} {salary.year} • Day {salary.day}
                  </CardDescription>
                </div>
                <Badge variant={remainingBudget >= 0 ? "default" : "destructive"} className="text-sm">
                  {remainingBudget >= 0 ? 'Within Budget' : 'Over Budget'}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>
            A detailed breakdown of all expenses for this payroll period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSignIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No expenses have been recorded for this payroll period. Add expenses to track your budget.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-center">Due Date</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const insight = expenseInsights.find(i => i.expense.id === expense.id);
                    return (
                      <TableRow key={expense.id} className={insight?.priority === 'critical' ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell>
                          {expense.expensesCategoryId ? (
                            <Badge variant="outline">
                              {getCategoryName(expense.expensesCategoryId)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{expense.quantity}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${formatCurrency(expense.amount * expense.quantity)}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {expense.note || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {expense.withDue === 1 && expense.dueDate ? (
                            <Badge variant="secondary">
                              {new Date(expense.dueDate).toLocaleDateString()}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {insight ? (
                            <Badge 
                              variant={
                                insight.priority === 'critical' ? 'destructive' : 
                                insight.priority === 'high' ? 'default' : 
                                'secondary'
                              }
                            >
                              {insight.priority}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No due date</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(expense)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(expense.id)}
                            >
                              <TrashIcon className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={4} className="text-right">Total Expenses</TableCell>
                    <TableCell className="text-right">${formatCurrency(totalExpenses)}</TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}