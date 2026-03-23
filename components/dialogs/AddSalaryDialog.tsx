'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalaryAdded: () => void;
}

export function AddSalaryDialog({ open, onOpenChange, onSalaryAdded }: AddSalaryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    base_salary: '',
    bonus: '0',
    deductions: '0',
    salary_month: '',
    payment_date: '',
    status: 'pending',
  });

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('users').select('id, full_name');
    if (data) setEmployees(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const base = parseFloat(formData.base_salary) || 0;
      const bonus = parseFloat(formData.bonus) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const net_salary = base + bonus - deductions;

      const { error } = await supabase.from('salaries').insert([{
        employee_id: formData.employee_id,
        base_salary: base,
        bonus,
        deductions,
        net_salary,
        salary_month: formData.salary_month,
        payment_date: formData.payment_date || null,
        status: formData.status,
      }]);

      if (error) throw error;
      
      setFormData({
        employee_id: '',
        base_salary: '',
        bonus: '0',
        deductions: '0',
        salary_month: '',
        payment_date: '',
        status: 'pending',
      });
      onSalaryAdded();
    } catch (error) {
      console.error('Error adding salary:', error);
      alert('Failed to add salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Salary Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              required
              value={formData.employee_id}
              onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_salary">Base Salary ($)</Label>
              <Input
                id="base_salary"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus ($)</Label>
              <Input
                id="bonus"
                type="number"
                min="0"
                step="0.01"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions ($)</Label>
              <Input
                id="deductions"
                type="number"
                min="0"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_month">Salary Month</Label>
              <Input
                id="salary_month"
                type="date"
                required
                value={formData.salary_month}
                onChange={(e) => setFormData({ ...formData, salary_month: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Salary'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
