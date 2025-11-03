"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useConfirm } from "@/context/confirm-context";
import { Plus, Tag, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ExpenseCategory } from "@/models/ExpenseCategory";
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
import { Switch } from "@/components/ui/switch";

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

const expenseCategoryFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  auto: z.number().min(0).max(1),
  active: z.number().min(0).max(1),
});

type ExpenseCategoryFormValues = z.infer<typeof expenseCategoryFormSchema>;

export default function ExpenseTypesPage() {
  const { session, status } = useAuth();
  const confirm = useConfirm();
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: {
      name: "",
      auto: 1,
      active: 1,
    },
  });

  const fetchExpenseCategories = useCallback(async (page: number = 1, pageSize?: number) => {
    if (!session) return;
    
    setIsLoading(true);
    const currentPageSize = pageSize ?? pagination.itemsPerPage;
    try {
      const response = await fetch(`/api/expense-type?userId=${session.user.id}&page=${page}&pageSize=${currentPageSize}`);
      const data = await response.json();
      
      setExpenseCategories(data.data || []);
      
      if (data.pagination) {
        setPagination({
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          itemsPerPage: data.pagination.pageSize,
        });
      }
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
      toast.error("Failed to fetch expense categories");
    } finally {
      setIsLoading(false);
    }
  }, [session, pagination.itemsPerPage]);

  useEffect(() => {
    if (session) {
      fetchExpenseCategories(1);
    }
  }, [session, fetchExpenseCategories]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchExpenseCategories(newPage);
    }
  }, [pagination.totalPages, fetchExpenseCategories]);

  const handlePageSizeChange = useCallback((newPageSize: string) => {
    const pageSize = parseInt(newPageSize);
    fetchExpenseCategories(1, pageSize);
  }, [fetchExpenseCategories]);

  const handleOpenDialog = useCallback((category?: ExpenseCategory) => {
    if (category) {
      setEditingCategory(category);
      form.reset({
        id: category.id,
        name: category.name,
        auto: category.auto,
        active: category.active,
      });
    } else {
      setEditingCategory(null);
      form.reset({
        id: undefined,
        name: "",
        auto: 1,
        active: 1,
      });
    }
    setIsDialogOpen(true);
  }, [form]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset({
      id: undefined,
      name: "",
      auto: 1,
      active: 1,
    });
  }, [form]);

  const handleSubmit = useCallback(async (values: ExpenseCategoryFormValues) => {
    if (!session) return;

    setIsSubmitting(true);
    
    try {
      const url = editingCategory ? `/api/expense-type/${editingCategory.id}` : "/api/expense-type";
      const method = editingCategory ? "PUT" : "POST";
      
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
        throw new Error(error.message || "Failed to save expense category");
      }

      toast.success(editingCategory ? "Expense category updated successfully" : "Expense category created successfully");
      handleCloseDialog();
      fetchExpenseCategories(pagination.currentPage);
    } catch (error) {
      console.error("Failed to save expense category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save expense category");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, editingCategory, handleCloseDialog, fetchExpenseCategories, pagination.currentPage]);

  const handleDelete = useCallback(async (category: ExpenseCategory) => {
    confirm.fire(async () => {
      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/expense-type/${category.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete expense category");
        }

        toast.success("Expense category deleted successfully");
        fetchExpenseCategories(pagination.currentPage);
      } catch (error) {
        console.error("Failed to delete expense category:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete expense category");
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [confirm, fetchExpenseCategories, pagination.currentPage]);

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
              Expense Types
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage and categorize your expense types
            </p>
          </div>
          <Button className="shadow-lg hover:shadow-xl transition-shadow" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense Type
          </Button>
        </div>

        {/* Expense Categories List */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expense Categories</CardTitle>
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
                <p className="mt-4 text-sm text-muted-foreground">Loading expense categories...</p>
              </div>
            ) : expenseCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No expense categories yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Start organizing your expenses by adding your first category
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Category
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {expenseCategories.map((category, index) => (
                    <div
                      key={category.id || index}
                      className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                            <Tag className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg">{category.name}</h4>
                              {category.active === 1 && (
                                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                                  Active
                                </span>
                              )}
                              {category.auto === 1 && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                                  Auto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(category)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <DialogTitle>{editingCategory ? "Edit Expense Category" : "Add New Expense Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the expense category information below." : "Fill in the details to create a new expense category."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-4 py-4">
                <FormField
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <Input
                        placeholder="e.g., Groceries, Utilities, Entertainment"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="auto"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-add to expenses</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Automatically insert to expenses table after creation
                        </div>
                      </div>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable or disable this expense category
                        </div>
                      </div>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                      />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}