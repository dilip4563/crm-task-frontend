'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Navbar from '@/components/shared/Navbar';
import EmployeeModal from '@/components/admin/EmployeeModal';
import { Plus, Search, RotateCcw, Trash2, Edit2, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const STATUS_CHIP: Record<string, string> = {
  true: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  false: 'bg-red-50 text-red-600 border border-red-200',
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => adminApi.getEmployees({ search }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createEmployee(d),
    onSuccess: () => { toast.success('Employee created!'); qc.invalidateQueries({ queryKey: ['employees'] }); setModalOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateEmployee(id, data),
    onSuccess: () => { toast.success('Employee updated!'); qc.invalidateQueries({ queryKey: ['employees'] }); setModalOpen(false); setEditEmp(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => adminApi.resetPassword(id),
    onSuccess: (r) => toast.success(`Temp password: ${r.data.tempPassword}`),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => adminApi.updateEmployee(id, { isActive }),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries({ queryKey: ['employees'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const employees = data?.employees || [];

  return (
    <div>
      <Navbar title="Employees" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 w-64" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => { setEditEmp(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Employee
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1C3F] text-white">
              <tr>
                {['Employee', 'Username', 'Department', 'Tasks', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No employees found</td></tr>
              ) : employees.map((emp: any, i: number) => (
                <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0F1C3F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{emp.firstName} {emp.lastName}</p>
                        <p className="text-gray-400 text-xs">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{emp.username}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-x-1">
                      <span className="text-gray-500">{emp._count?.assignedTasks ?? 0} total</span>
                      <span className="text-emerald-600 font-semibold">· {emp.completedTasks ?? 0} done</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[String(emp.isActive)]}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditEmp(emp); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => toggleActive.mutate({ id: emp.id, isActive: !emp.isActive })} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title={emp.isActive ? 'Deactivate' : 'Activate'}>
                        {emp.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button onClick={() => { if (confirm('Reset password?')) resetPassword.mutate(emp.id); }} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reset Password">
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeModal open={modalOpen} employee={editEmp} onClose={() => { setModalOpen(false); setEditEmp(null); }}
        onSubmit={d => editEmp ? updateMutation.mutate({ id: editEmp.id, data: d }) : createMutation.mutate(d)}
        isLoading={createMutation.isPending || updateMutation.isPending} />
    </div>
  );
}
