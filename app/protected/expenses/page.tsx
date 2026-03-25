'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { AddExpenseDialog } from '@/components/dialogs/AddExpenseDialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  expense_date: string;
  created_at: string;
}

const CATEGORY_COLORS = {
  travel: 'bg-blue-100 text-blue-800',
  equipment: 'bg-purple-100 text-purple-800',
  office: 'bg-green-100 text-green-800',
  entertainment: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setExpenses((prev) => 
        prev.map((e) => e.id === id ? { ...e, status: newStatus as any } : e)
      );
    } catch (error) {
      console.error('Error updating expense status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount as any), 0);
  const approvedExpenses = expenses
    .filter((e) => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + parseFloat(e.amount as any), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">Submit and track expense claims</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Submit Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${approvedExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Overview</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {expenses.filter(e => e.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-[10px]">
                {expenses.filter(e => e.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          ${parseFloat(expense.amount as any).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS]
                            }
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.description || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[expense.status]}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.filter(e => e.status === 'pending').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No pending expenses to approve
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.filter(e => e.status === 'pending').map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            ${parseFloat(expense.amount as any).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS]
                              }
                            >
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleStatusUpdate(expense.id, 'approved')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(expense.id, 'rejected')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showAddDialog && (
        <AddExpenseDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onExpenseAdded={() => {
            setShowAddDialog(false);
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}
