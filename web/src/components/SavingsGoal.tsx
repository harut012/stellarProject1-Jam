'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  contractConfigured,
  readSavingsState,
  buildContributeXDR,
  type SavingsState,
} from '@/lib/contract';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

export default function SavingsGoal({ publicKey }: { publicKey: string | null }) {
  const configured = contractConfigured();
  const [state, setState] = useState<SavingsState | null>(null);
  const [loading, setLoading] = useState(configured);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError('');
    try {
      setState(await readSavingsState());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read contract');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const contribute = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildContributeXDR(publicKey, Number(amount));
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) {
        throw new Error(
          typeof signed.error === 'string' ? signed.error : 'Signing was rejected',
        );
      }
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Contribution recorded on-chain!');
      setAmount('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Contribution failed');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="rounded-3xl border border-slate-800 border-dashed bg-slate-900/50 p-6 text-slate-100">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Savings Goal (Soroban)</h2>
        <p className="mt-2 text-sm text-slate-500">
          No contract deployed. Deploy the Rust contract to enable this panel.
        </p>
      </div>
    );
  }

  const pct =
    state && state.target > 0
      ? Math.min(100, Math.round((state.saved / state.target) * 100))
      : 0;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100">
      <h2 className="mb-4 text-sm font-medium text-slate-400 uppercase tracking-wider">
        Savings Goal (Soroban)
      </h2>

      {loading && <p className="text-sm text-slate-500">Reading contract state...</p>}

      {!loading && state && (
        <>
          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>Saved: <span className="text-white font-medium">{state.saved}</span></span>
            <span>Target: <span className="text-white font-medium">{state.target}</span></span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-slate-500">{pct}%</p>

          <div className="mt-4 flex gap-3">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button
              onClick={contribute}
              disabled={busy || !publicKey || !amount}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:active:scale-100 shadow-lg shadow-emerald-500/20"
            >
              {busy ? 'Working...' : 'Contribute'}
            </button>
          </div>
          {!publicKey && (
            <p className="mt-3 text-xs text-slate-500">
              Connect your wallet to contribute.
            </p>
          )}
        </>
      )}

      {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
