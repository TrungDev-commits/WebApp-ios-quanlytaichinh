import { useState, useEffect, useCallback } from 'react';
import { Debt } from '../types';
import { api } from '../api/client';

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.debts.list();
      setDebts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  const addDebt = async (data: Omit<Debt, 'id'>) => {
    const newDebt = await api.debts.create(data);
    setDebts(prev => [...prev, newDebt]);
    return newDebt;
  };

  const deleteDebt = async (id: string) => {
    await api.debts.delete(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const payDebtInstallment = async (debtId: string, installmentIndex: number) => {
    const updated = await api.debts.payInstallment(debtId, installmentIndex);
    setDebts(prev => prev.map(d => d.id === debtId ? updated : d));
  };

  return { debts, loading, error, addDebt, deleteDebt, payDebtInstallment, refetch: fetchDebts };
}
