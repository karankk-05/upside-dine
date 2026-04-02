import { Wallet, Receipt } from 'lucide-react';
import { useMessAccount } from '../hooks/useMessAccount';

const MessAccountCard = () => {
  const { data: account, isLoading, isError } = useMessAccount();

  if (isLoading) {
    return (
      <div className="mess-account-card">
        <div className="mess-loading-spinner" style={{ margin: '10px auto' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mess-account-card">
        <div className="mess-account-label">Mess Tab</div>
        <div style={{ color: 'var(--st-text-dim)', fontSize: 13 }}>Unable to load tab</div>
      </div>
    );
  }

  // If the backend balance drops negative to track debt, convert it to a positive "Due Amount"
  const rawBalance = parseFloat(account.balance);
  const dueAmount = rawBalance < 0 ? Math.abs(rawBalance) : (rawBalance === 0 ? 0 : -rawBalance);

  return (
    <div className="mess-account-card" id="mess-account-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="mess-feature-icon" style={{ width: 40, height: 40, background: 'rgba(214, 52, 52, 0.15)' }}>
          <Receipt size={20} color="var(--st-accent)" />
        </div>
        <div className="mess-account-label" style={{ marginBottom: 0 }}>Accumulated Tab</div>
      </div>
      <div className="mess-account-balance" style={{ color: dueAmount > 0 ? 'var(--st-accent)' : '#fff' }}>
        ₹{dueAmount.toLocaleString('en-IN')} Due
      </div>
      <div className="mess-account-updated">
        To be billed at month-end · Last sync: {new Date(account.last_updated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
      </div>
    </div>
  );
};

export default MessAccountCard;
