import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Protocol, Vault } from "@shared/schema";

interface TokenPosition {
  token: string;
  protocol: string;
  balance: number;
  apy: number;
  projectedAnnualYield: number;
}

export default function WalletSummary() {
  const { toast } = useToast();

  const { data: vaults = [] } = useQuery<Vault[]>({
    queryKey: ["/api/vaults"],
  });

  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ["/api/protocols"],
  });

  const positions = vaults.map(vault => ({
    token: vault.token,
    protocol: vault.protocol,
    balance: vault.balance,
    apy: vault.apy,
    projectedAnnualYield: vault.balance * (vault.apy / 100)
  }));

  const totalBalance = positions.reduce((sum, pos) => sum + pos.balance, 0);
  const totalProjectedYield = positions.reduce((sum, pos) => sum + pos.projectedAnnualYield, 0);

  const evaluateAll = useMutation({
    mutationFn: async () => {
      const results = await Promise.all(
        vaults.map(vault => 
          apiRequest("POST", `/api/vaults/${vault.id}/optimize`)
            .then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: (results) => {
      const changes = results.filter(result => result.vault);
      if (changes.length > 0) {
        // Refresh all related data
        queryClient.invalidateQueries({ queryKey: ["/api/vaults"] });
        vaults.forEach(vault => {
          queryClient.invalidateQueries({ queryKey: [`/api/vaults/${vault.id}/transactions`] });
        });

        const totalBenefit = changes.reduce((sum, change) => sum + change.analysis.netBenefit, 0);
        
        toast({
          title: "Portfolio Rebalanced",
          description: (
            <div className="space-y-2">
              <p>{changes.length} positions optimized</p>
              <p className="text-sm text-muted-foreground">
                Total Annual Benefit: ${totalBenefit.toLocaleString()}
              </p>
            </div>
          ),
        });
      } else {
        toast({
          title: "No Changes Needed",
          description: "Your portfolio is already optimized for current market conditions.",
        });
      }
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Portfolio Summary</CardTitle>
        <Button 
          onClick={() => evaluateAll.mutate()}
          disabled={evaluateAll.isPending}
        >
          Re-evaluate All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">${totalBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projected Annual Yield</p>
              <p className="text-2xl font-bold text-success-500">${totalProjectedYield.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {positions.map((position, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t">
                <div>
                  <p className="font-medium">{position.token}</p>
                  <p className="text-sm text-muted-foreground">{position.protocol}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${position.balance.toLocaleString()}</p>
                  <p className="text-sm text-success-500">{position.apy}% APY</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
