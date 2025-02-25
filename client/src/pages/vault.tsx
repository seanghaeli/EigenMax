import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import TransactionHistory from "@/components/transaction-history";
import type { Vault, Transaction } from "@shared/schema";

export default function VaultPage() {
  const { id } = useParams();
  
  const { data: vault } = useQuery<Vault>({
    queryKey: [`/api/vaults/${id}`],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: [`/api/vaults/${id}/transactions`],
  });

  if (!vault) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">{vault.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${vault.balance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success-500">{vault.apy}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Switch checked={vault.autoMode} />
              <span>{vault.autoMode ? 'Enabled' : 'Disabled'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={transactions || []} />
        </CardContent>
      </Card>
    </div>
  );
}
