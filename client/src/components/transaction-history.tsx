import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";
import type { Transaction } from "@shared/schema";

const TYPE_ICONS = {
  deposit: <ArrowUpCircle className="w-4 h-4 text-success-500" />,
  withdraw: <ArrowDownCircle className="w-4 h-4 text-destructive" />,
  rebalance: <RefreshCw className="w-4 h-4 text-primary" />,
};

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="flex items-center gap-2">
              {TYPE_ICONS[tx.type as keyof typeof TYPE_ICONS]}
              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
            </TableCell>
            <TableCell>${tx.amount.toLocaleString()}</TableCell>
            <TableCell>{format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
