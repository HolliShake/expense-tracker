"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useConfirm } from "@/context/confirm-context";
import { Plus, Wallet, TrendingDown, DollarSign, ChevronLeft, ChevronRight, Calendar, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Payroll, PayrollTile } from "@/models/Payroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const MONTHS: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (month: string, day: number, year: number) => {
  const monthIndex = MONTHS.indexOf(month);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, monthIndex, day));
};

const payrollFormSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  month: z.string(),
  day: z.number().min(1, "Day must be between 1 and 31").max(31, "Day must be between 1 and 31"),
  year: z.number().min(2000, "Year must be between 2000 and 2100").max(2100, "Year must be between 2000 and 2100"),
  totalBudget: z.number().positive("Total budget must be greater than 0"),
});

type PayrollFormValues = z.infer<typeof payrollFormSchema>;

export default function SalaryPage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const confirm = useConfirm();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [payrollTiles, setPayrollTiles] = useState<PayrollTile>({
    totalSalary: 0,
    averageBudget: 0,
    thisMonthsTotalExpenses: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      title: `${MONTHS[new Date().getMonth()]} ${new Date().getDate()} ${new Date().getFullYear()} Salary`,
      month: MONTHS[new Date().getMonth()],
      day: new Date().getDate(),
      year: new Date().getFullYear(),
      totalBudget: 0,
    },
  });

  const fetchPayrollTiles = useCallback(async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/salary/tiles?userId=${session.user.id}`);
      const data = await response.json();
      if (data) {
        setPayrollTiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch payroll tiles:", error);
      toast.error("Failed to fetch payroll summary");
    }
  }, [session]);

  const fetchPayrolls = useCallback(async (page: number = 1, pageSize?: number) => {
    if (!session) return;
    
    setIsLoading(true);
    const currentPageSize = pageSize ?? pagination.itemsPerPage;
    try {
      const response = await fetch(`/api/salary?userId=${session.user.id}&page=${page}&pageSize=${currentPageSize}`);
      const data = await response.json();
      
      setPayrolls(data.data || []);
      
      if (data.pagination) {
        setPagination({
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          itemsPerPage: data.pagination.pageSize,
        });
      }
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
      toast.error("Failed to fetch payrolls");
    } finally {
      setIsLoading(false);
    }
  }, [session, pagination.itemsPerPage]);

  useEffect(() => {
    if (session) {
      fetchPayrolls(1);
      fetchPayrollTiles();
    }
  }, [session, fetchPayrolls, fetchPayrollTiles]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPayrolls(newPage);
    }
  }, [pagination.totalPages, fetchPayrolls]);

  const handlePageSizeChange = useCallback((newPageSize: string) => {
    const pageSize = parseInt(newPageSize);
    fetchPayrolls(1, pageSize);
  }, [fetchPayrolls]);

  const handleOpenDialog = useCallback((payroll?: Payroll) => {
    if (payroll) {
      setEditingPayroll(payroll);
      form.reset({
        id: payroll.id,
        title: payroll.title,
        month: payroll.month,
        day: payroll.day,
        year: payroll.year,
        totalBudget: Number(payroll.totalBudget),
      });
    } else {
      setEditingPayroll(null);
      form.reset({
        id: undefined,
        title: `${MONTHS[new Date().getMonth()]} ${new Date().getDate()} ${new Date().getFullYear()} Salary`,
        month: MONTHS[new Date().getMonth()],
        day: new Date().getDate(),
        year: new Date().getFullYear(),
        totalBudget: 0,
      });
    }
    setIsDialogOpen(true);
  }, [form]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingPayroll(null);
    form.reset({
      id: undefined,
      title: `${MONTHS[new Date().getMonth()]} ${new Date().getDate()} ${new Date().getFullYear()} Salary`,
      month: MONTHS[new Date().getMonth()],
      day: new Date().getDate(),
      year: new Date().getFullYear(),
      totalBudget: 0,
    });
  }, [form]);

  const handleSubmit = useCallback(async (values: PayrollFormValues) => {
    if (!session) return;

    setIsSubmitting(true);
    
    try {
      const url = editingPayroll ? `/api/salary/${editingPayroll.id}` : "/api/salary";
      const method = editingPayroll ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save payroll");
      }

      toast.success(editingPayroll ? "Payroll updated successfully" : "Payroll created successfully");
      handleCloseDialog();
      fetchPayrolls(pagination.currentPage);
      fetchPayrollTiles();
    } catch (error) {
      console.error("Failed to save payroll:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save payroll");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, editingPayroll, handleCloseDialog, fetchPayrolls, fetchPayrollTiles, pagination.currentPage]);

  const handleDelete = useCallback(async (payroll: Payroll) => {
    confirm.fire(async () => {
      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/salary/${payroll.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete payroll");
        }

        toast.success("Payroll deleted successfully");
        fetchPayrolls(pagination.currentPage);
        fetchPayrollTiles();
      } catch (error) {
        console.error("Failed to delete payroll:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete payroll");
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [confirm, fetchPayrolls, fetchPayrollTiles, pagination.currentPage]);

  const paginationButtons = useMemo(() => {
    if (pagination.totalPages <= 5) {
      return Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
    }
    
    if (pagination.currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    if (pagination.currentPage >= pagination.totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => pagination.totalPages - 4 + i);
    }
    
    return Array.from({ length: 5 }, (_, i) => pagination.currentPage - 2 + i);
  }, [pagination.currentPage, pagination.totalPages]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Payroll Management
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track and manage your payroll expenses
            </p>
          </div>
          <Button className="shadow-lg hover:shadow-xl transition-shadow" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payroll
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(payrollTiles.totalSalary)}</div>
              <p className="text-xs opacity-80">
                Across all payroll entries
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Payroll</CardTitle>
              <Wallet className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(payrollTiles.averageBudget)}</div>
              <p className="text-xs opacity-80">
                Per payroll period
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month&apos;s Total</CardTitle>
              <TrendingDown className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(payrollTiles.thisMonthsTotalExpenses)}</div>
              <p className="text-xs opacity-80">
                Current month expenses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll List */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payroll Records</CardTitle>
                <CardDescription>
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                  {pagination.totalItems} entries
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="pageSize" className="text-sm text-muted-foreground">
                  Show:
                </Label>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onValueChange={handlePageSizeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="pageSize" className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading payroll data...</p>
              </div>
            ) : payrolls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No payroll records yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Start tracking your payroll by adding your first entry
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Payroll
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {payrolls.map((salary, index) => (
                    <div
                      key={salary.id || index}
                      className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
                      onClick={(e) => {
                        router.push(`/dashboard/payroll/${salary.id}`)
                        e.stopPropagation();
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                            <Wallet className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">{salary.title}</h4>
                              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                                {salary.month}/{salary.year}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(salary.month, salary.day, salary.year)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrency(Number(salary.totalBudget) || 0)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Total Budget
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(salary)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(salary)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1 || isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {paginationButtons.map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages || isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPayroll ? "Edit Payroll" : "Add New Payroll"}</DialogTitle>
            <DialogDescription>
              {editingPayroll ? "Update the payroll information below." : "Fill in the details to create a new payroll entry."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-4 py-4">
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Input
                        placeholder="e.g., January 2024 Salary"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Input
                          type="number"
                          min={2000}
                          max={2100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="totalBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Budget</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingPayroll ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
