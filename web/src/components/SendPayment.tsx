'use client';
import { useState } from 'react';
import {
  buildPaymentXDR,
  submitSignedXDR,
  pollTransaction,
  type AssetCode,
} from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

type Status =
  | 'idle'
  | 'building'
  | 'signing'
  | 'submitting'
  | 'polling'
  | 'success'
  | 'error';

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Send',
  building: 'Building transaction…',
  signing: 'Waiting for Freighter…',
  submitting: 'Submitting…',
  polling: 'Confirming on-chain…',
  success: 'Send',
  error: 'Send',
};

export default function SendPayment({
  publicKey,
  onSent,
}: {
  publicKey: string;
  onSent: () => void;
}) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState<AssetCode>('XLM');
  const [status, setStatus] = useState<Status>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const busy = ['building', 'signing', 'submitting', 'polling'].includes(status);

  const handleSend = async () => {
    setStatus('building');
    setErrorMsg('');
    setTxHash('');
    try {
      const xdr = await buildPaymentXDR(publicKey, destination.trim(), amount, asset);

      setStatus('signing');
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

      setStatus('submitting');
      const hash = await submitSignedXDR(signed.signedTxXdr);
      setTxHash(hash);

      setStatus('polling');
      await pollTransaction(hash);
      setStatus('success');
      onSent();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Payment failed');
      setStatus('error');
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100">
      <h2 className="mb-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Send Payment</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wide">Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value as AssetCode)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          >
            <option value="XLM">XLM</option>
            <option value="USDC">USDC (needs a trustline)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wide">
            Destination Address
          </label>
          <input
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={busy || !destination || !amount}
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:active:scale-100 shadow-lg shadow-emerald-500/20"
        >
          {STATUS_LABEL[status]}
        </button>
      </div>

      {status === 'success' && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500 p-1.5 rounded-full">
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <p className="font-semibold text-emerald-400 text-base">Payment Sent!</p>
          </div>
          
          <div className="space-y-3 mb-5 text-sm">
            <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
              <span className="text-slate-400">Amount</span>
              <span className="text-slate-200 font-medium">{amount} {asset}</span>
            </div>
            <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
              <span className="text-slate-400">Sent To</span>
              <span className="text-slate-200 font-mono text-xs">{destination.substring(0,6)}...{destination.substring(destination.length-6)}</span>
            </div>
            <div className="pt-1">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View full receipt on Stellar Expert
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            </div>
          </div>
          
          <button
            onClick={() => {
              setStatus('idle');
              setAmount('');
              setDestination('');
            }}
            className="w-full rounded-xl border border-emerald-500/50 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
          >
            Send Another Payment
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
