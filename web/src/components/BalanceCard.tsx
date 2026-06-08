'use client';
import { useState, useEffect } from 'react';
import { fetchBalances, type Balances } from '@/lib/balances';

export default function BalanceCard({
  publicKey,
  refreshKey,
}: {
  publicKey: string;
  refreshKey: number;
}) {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchBalances(publicKey)
      .then((b) => active && setBalances(b))
      .catch(() => active && setBalances(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [publicKey, refreshKey]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 w-32 rounded-lg bg-slate-800" />
        <div className="h-4 w-24 rounded bg-slate-800" />
      </div>
    );
  }

  if (balances && !balances.funded) {
    return (
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200/90 leading-relaxed">
        Account not funded. Use the Friendbot utility below to initialize.
      </p>
    );
  }

  if (!balances) {
    return <p className="text-sm text-red-400 p-2 bg-red-500/10 rounded-lg">Failed to load balances. Please try refreshing.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          {balances.usdc || "0.00"}
        </span>
        <span className="text-lg font-medium text-emerald-400">USDC</span>
      </div>
      
      <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 inline-flex w-max px-3 py-1.5 rounded-lg border border-slate-700/50">
        <span className="text-sm font-medium">{balances.xlm}</span>
        <span className="text-xs uppercase tracking-wider font-semibold">XLM</span>
      </div>
    </div>
  );
}
