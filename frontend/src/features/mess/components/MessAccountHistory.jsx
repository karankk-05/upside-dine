import { useMyBookings } from '../hooks/useMyBookings';

const MessAccountHistory = () => {
  const { data: bookings, isLoading } = useMyBookings();

  if (isLoading) {
    return (
      <div className="mess-loading">
        <div className="mess-loading-spinner" />
        <span className="mess-loading-text">Loading transactions...</span>
      </div>
    );
  }

  const transactions = (bookings || []).filter((b) => b.status === 'redeemed' || b.status === 'pending');

  if (transactions.length === 0) {
    return (
      <div className="mess-empty">
        <div className="mess-empty-icon">📄</div>
        <div>No transactions yet</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mess-section-title" style={{ marginBottom: 12 }}>Transaction History</div>
      {transactions.map((tx) => (
        <div key={tx.id} className="mess-transaction">
          <div className="mess-transaction-info">
            <div className="mess-transaction-name">{tx.menu_item?.item_name}</div>
            <div className="mess-transaction-date">
              {new Date(tx.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} · Qty: {tx.quantity}
            </div>
          </div>
          <div className="mess-transaction-amount">+₹{tx.total_price}</div>
        </div>
      ))}
    </div>
  );
};

export default MessAccountHistory;
