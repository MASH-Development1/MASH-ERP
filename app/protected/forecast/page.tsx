'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Users,
  BarChart3,
} from 'lucide-react';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
}

interface MonthlyRow {
  month: string;
  income: number;
  expenses: number;
  salaries: number;
  net: number;
}

function toMonth(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(ym: string) {
  const [year, month] = ym.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

export default function ForecastPage() {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    totalSalaries: 0,
    netProfit: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchFinancialData();
    const interval = setInterval(fetchFinancialData, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchFinancialData = async () => {
    try {
      const [paymentsRes, expensesRes, salariesRes] = await Promise.all([
        supabase.from('payments').select('amount, status, payment_date, due_date'),
        supabase.from('expenses').select('amount, status, expense_date'),
        supabase.from('salaries').select('net_salary, salary_month'),
      ]);

      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];
      const salaries = salariesRes.data || [];

      // Income = payments marked as paid
      const totalIncome = payments
        .filter((p: { status: string }) => p.status === 'paid')
        .reduce((sum: number, p: { amount: string }) => sum + parseFloat(p.amount), 0);

      // Expenses = all except rejected (pending/approved/paid all count)
      const totalExpenses = expenses
        .filter((e: { status: string }) => e.status !== 'rejected')
        .reduce((sum: number, e: { amount: string }) => sum + parseFloat(e.amount), 0);

      // Payroll = all salary net amounts
      const totalSalaries = salaries.reduce(
        (sum: number, s: { net_salary: string }) => sum + parseFloat(s.net_salary || '0'),
        0
      );

      const netProfit = totalIncome - totalExpenses - totalSalaries;
      setSummary({ totalIncome, totalExpenses, totalSalaries, netProfit });

      // Monthly breakdown
      const monthMap: Record<string, MonthlyRow> = {};

      const ensureMonth = (m: string) => {
        if (!monthMap[m]) {
          monthMap[m] = { month: m, income: 0, expenses: 0, salaries: 0, net: 0 };
        }
      };

      payments
        .filter((p: { status: string }) => p.status === 'paid')
        .forEach((p: { amount: string; payment_date: string; due_date: string }) => {
          const m = toMonth(p.payment_date || p.due_date);
          ensureMonth(m);
          monthMap[m].income += parseFloat(p.amount);
        });

      expenses
        .filter((e: { status: string }) => e.status !== 'rejected')
        .forEach((e: { amount: string; expense_date: string }) => {
          const m = toMonth(e.expense_date);
          ensureMonth(m);
          monthMap[m].expenses += parseFloat(e.amount);
        });

      salaries.forEach((s: { net_salary: string; salary_month: string }) => {
        const m = toMonth(s.salary_month);
        ensureMonth(m);
        monthMap[m].salaries += parseFloat(s.net_salary || '0');
      });

      const rows = Object.values(monthMap)
        .map((r) => ({ ...r, net: r.income - r.expenses - r.salaries }))
        .sort((a, b) => b.month.localeCompare(a.month));

      // Update state without flashing loading UI repeatedly
      setMonthly(rows);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isProfit = summary.netProfit >= 0;
  const totalCosts = summary.totalExpenses + summary.totalSalaries;
  const marginPct =
    summary.totalIncome > 0
      ? ((summary.netProfit / summary.totalIncome) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Forecast</h1>
        <p className="text-muted-foreground">
          Full profit & loss overview across income, expenses, and payroll
        </p>
      </div>

      {/* P&L Banner */}
      <Card
        className={`border-2 ${
          isProfit
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : 'border-red-500 bg-red-50 dark:bg-red-950/20'
        }`}
      >
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            {isProfit ? (
              <TrendingUp className="w-12 h-12 text-green-500" />
            ) : (
              <TrendingDown className="w-12 h-12 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net {isProfit ? 'Profit' : 'Loss'}</p>
              <p className={`text-4xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? '+' : '-'}${Math.abs(summary.netProfit).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className={`text-2xl font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '' : '-'}{Math.abs(parseFloat(marginPct))}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Collected payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${summary.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All expenses (excl. rejected)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summary.totalSalaries.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total employee salaries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalCosts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Expenses + Payroll</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Bar — always shown if any costs exist */}
      {totalCosts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Breakdown vs Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Income bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Income</span>
                <span className="font-medium text-green-600">${summary.totalIncome.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            {/* Expenses bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Operational Expenses</span>
                <span className="font-medium text-orange-600">${summary.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: summary.totalIncome > 0
                      ? `${Math.min(100, (summary.totalExpenses / summary.totalIncome) * 100)}%`
                      : '100%',
                  }}
                />
              </div>
            </div>
            {/* Salaries bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Payroll</span>
                <span className="font-medium text-blue-600">${summary.totalSalaries.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: summary.totalIncome > 0
                      ? `${Math.min(100, (summary.totalSalaries / summary.totalIncome) * 100)}%`
                      : '100%',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown Table */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Month</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Income</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Expenses</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Payroll</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((row) => (
                    <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{formatMonth(row.month)}</td>
                      <td className="py-3 pr-4 text-right text-green-600">
                        {row.income > 0 ? `+$${row.income.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 pr-4 text-right text-orange-600">
                        {row.expenses > 0 ? `-$${row.expenses.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 pr-4 text-right text-blue-600">
                        {row.salaries > 0 ? `-$${row.salaries.toLocaleString()}` : '-'}
                      </td>
                      <td className={`py-3 text-right font-semibold ${row.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.net >= 0 ? '+' : '-'}${Math.abs(row.net).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="pt-3 pr-4">Total</td>
                    <td className="pt-3 pr-4 text-right text-green-600">
                      {summary.totalIncome > 0 ? `+$${summary.totalIncome.toLocaleString()}` : '-'}
                    </td>
                    <td className="pt-3 pr-4 text-right text-orange-600">
                      {summary.totalExpenses > 0 ? `-$${summary.totalExpenses.toLocaleString()}` : '-'}
                    </td>
                    <td className="pt-3 pr-4 text-right text-blue-600">
                      {summary.totalSalaries > 0 ? `-$${summary.totalSalaries.toLocaleString()}` : '-'}
                    </td>
                    <td className={`pt-3 text-right ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? '+' : '-'}${Math.abs(summary.netProfit).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {monthly.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-4" />
            <p>No financial data yet. Start recording income, expenses, and salaries.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
