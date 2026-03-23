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
import { Plus, BarChart3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { AddSalaryDialog } from '@/components/dialogs/AddSalaryDialog';

interface Salary {
  id: string;
  employee_id: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  tax: number;
  net_salary: number;
  salary_month: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSalariesAndEmployees();
  }, []);

  const fetchSalariesAndEmployees = async () => {
    try {
      const [salariesRes, employeesRes] = await Promise.all([
        supabase.from('salaries').select('*').order('salary_month', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, first_name, last_name'),
      ]);

      if (salariesRes.data) setSalaries(salariesRes.data);

      if (employeesRes.data) {
        const employeeMap = new Map();
        employeesRes.data.forEach((emp: { id: string; first_name: string; last_name: string }) => {
          employeeMap.set(emp.id, `${emp.first_name} ${emp.last_name}`);
        });
        setEmployees(employeeMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this salary record? This cannot be undone.')) return;
    const { error } = await supabase.from('salaries').delete().eq('id', id);
    if (!error) setSalaries((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalNetSalaries = salaries
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + parseFloat(s.net_salary as any), 0);

  const totalBaseSalaries = salaries.reduce(
    (sum, s) => sum + parseFloat(s.base_salary as any),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salary Management</h1>
          <p className="text-muted-foreground">Manage employee salaries and payroll</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Salary Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Base Salary</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBaseSalaries.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid (Net)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalNetSalaries.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaries.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">
                      {employees.get(salary.employee_id) || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      ${parseFloat(salary.base_salary as any).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ${parseFloat(salary.bonus as any).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ${parseFloat(salary.deductions as any).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${parseFloat(salary.net_salary as any).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(salary.salary_month), 'MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[salary.status]}>
                        {salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(salary.id)}
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

      {showAddDialog && (
        <AddSalaryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSalaryAdded={() => {
            setShowAddDialog(false);
            fetchSalariesAndEmployees();
          }}
        />
      )}
    </div>
  );
}
