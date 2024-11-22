import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllTransactions } from '../../api';
import { toast } from 'react-toastify';

const Transactions = () => {
  const { data, error, isLoading } = useQuery(['transactions'], getAllTransactions);

  // Error handling with toast notifications
  if (error) {
    toast.error(error.message || "Error fetching transactions");
  }

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Transactions</h1>
      {data && data.length > 0 ? (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border-b">Transaction ID</th>
              <th className="border-b">Amount</th>
              <th className="border-b">Type</th>
              <th className="border-b">Timestamp</th>
              <th className="border-b">Status</th>
              <th className="border-b">User</th>
            </tr>
          </thead>
          <tbody>
            {data.map((transaction) => (
              <tr key={transaction._id}>
                <td className="border-b">{transaction._id}</td>
                <td className="border-b">₦{transaction.amount.toFixed(2)}</td>
                <td className="border-b">{transaction.type}</td>
                <td className="border-b">{new Date(transaction.timestamp).toLocaleString()}</td>
                <td className="border-b">{transaction.status}</td>
                <td className="border-b">{transaction.user.username} ({transaction.user.email})</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );
};

export default Transactions;