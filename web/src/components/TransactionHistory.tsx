'use client';
import { useState, useEffect } from 'react';
import { HORIZON_URL } from '@/lib/stellar';
import { ArrowDownRight, ArrowUpRight, ExternalLink } from 'lucide-react';

type PaymentRecord = {
  id: string;
  type: string;
  created_at: string;
  asset_type: string;
  asset_code?: string;
  amount?: string;
  starting_balance?: string;
  from?: string;
  to?: string;
  funder?: string;
  account?: string;
  transaction_hash: string;
};

export default function TransactionHistory({ publicKey, refreshKey = 0 }: { publicKey: string, refreshKey?: number }) {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}/payments?order=desc&limit=10`);
        if (!res.ok) {
          if (res.status === 404) return []; // Account not funded on ledger yet
          throw new Error('Failed to fetch transactions');
        }
        const data = await res.json();
        return data._embedded?.records || [];
      } catch (err) {
        throw err;
      }
    };

    fetchHistory()
      .then(data => {
        if (active) setRecords(data);
      })
      .catch(e => {
        if (active) setError(e instanceof Error ? e.message : 'Error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [publicKey, refreshKey]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl text-slate-100">
      <h2 className="mb-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Recent Transactions</h2>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-3/4 rounded bg-slate-800" />
          <div className="h-4 w-1/2 rounded bg-slate-800" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">No transactions found.</p>
      ) : (
        <div className="space-y-4">
          {records.map(record => {
            const isNative = record.asset_type === 'native';
            const asset = isNative ? 'XLM' : record.asset_code || 'Unknown';
            const isReceive = record.to === publicKey || record.account === publicKey;
            const amt = record.amount || record.starting_balance || '0';
            const date = new Date(record.created_at).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            // Format type and addresses
            let typeLabel = record.type === 'create_account' ? 'Account Created' : 'Payment';
            let addressLabel = '';
            
            if (isReceive) {
              const sender = record.from || record.funder;
              if (sender) addressLabel = `From: ${sender.substring(0,4)}...${sender.substring(sender.length-4)}`;
            } else {
              const receiver = record.to;
              if (receiver) addressLabel = `To: ${receiver.substring(0,4)}...${receiver.substring(receiver.length-4)}`;
            }

            return (
              <div key={record.id} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isReceive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {isReceive ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200 flex items-center gap-2">
                      {typeLabel}
                      <a href={`https://stellar.expert/explorer/testnet/tx/${record.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {date} {addressLabel && <span className="ml-1 text-slate-400">· {addressLabel}</span>}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${isReceive ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {isReceive ? '+' : '-'}{parseFloat(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} {asset}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
