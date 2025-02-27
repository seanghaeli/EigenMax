import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Wallet, Layers } from "lucide-react";
import type { Protocol, Vault } from "@shared/schema";
import { RestakingStrategyDialog } from "./restaking-strategy-dialog";

interface TokenPosition {
  token: string;
  protocol: string;
  balance: number;
  apy: number;
  projectedAnnualYield: number;
}

export default function WalletSummary() {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [inputAddress, setInputAddress] = useState('');
  const [showRestakingDialog, setShowRestakingDialog] = useState(false);

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
              {changes.map((change, index) => (
                <div key={index} className="text-sm border-l-2 border-primary pl-2 mt-1">
                  <p>
                    <span className="font-medium">{change.vault.token}</span>: Moved from{" "}
                    <span className="text-muted-foreground">{change.vault.protocol}</span> for better APY
                  </p>
                  <p className="text-xs text-muted-foreground">
                    APY: {change.vault.apy}% (↑ from previous)
                    <br />
                    Gas Cost: ${change.analysis.gasCost.toFixed(2)}
                    <br />
                    Annual Benefit: ${change.analysis.netBenefit.toFixed(2)}
                  </p>
                  {change.analysis.protocolDetails && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Security Score: {change.analysis.protocolDetails.securityScore}/100
                      <br />
                      Risk Level: {change.analysis.protocolDetails.riskCategory}
                      <br />
                      Node Count: {change.analysis.protocolDetails.nodeCount}
                      <br />
                      Uptime: {change.analysis.protocolDetails.avgUptimePercent}%
                    </p>
                  )}
                </div>
              ))}
              <p className="text-sm font-medium pt-2 border-t border-border">
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

  const optimizeRestake = useMutation({
    mutationFn: async (strategy: string) => {
      const results = await Promise.all(
        vaults
          .filter(vault => ["wstETH", "rETH", "cbETH"].includes(vault.token))
          .map(vault =>
            apiRequest("POST", `/api/vaults/${vault.id}/optimize-restake`, {
              strategy
            })
              .then(res => res.json())
          )
      );
      return results;
    },
    onSuccess: (results) => {
      const changes = results.filter(result => result.vault);
      if (changes.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/vaults"] });
        vaults.forEach(vault => {
          queryClient.invalidateQueries({ queryKey: [`/api/vaults/${vault.id}/transactions`] });
        });

        toast({
          title: "Restaking Optimized",
          description: (
            <div className="space-y-2">
              <p>{changes.length} LST positions rebalanced across AVS protocols</p>
              {changes.map((change, index) => (
                <div key={index} className="text-sm border-l-2 border-primary pl-2 mt-1">
                  <p>
                    <span className="font-medium">{change.vault.token}</span>: Restaked in{" "}
                    <span className="text-muted-foreground">{change.vault.protocol}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    New APY: {change.vault.apy}%
                    <br />
                    Gas Cost: ${change.analysis.gasCost.toFixed(2)}
                    <br />
                    Annual Benefit: ${change.analysis.netBenefit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Security Score: {change.analysis.protocolDetails.securityScore}/100
                    <br />
                    Risk Level: {change.analysis.protocolDetails.riskCategory}
                    <br />
                    Slashing Risk: {(change.analysis.protocolDetails.slashingRisk * 100).toFixed(2)}%
                    <br />
                    Nodes: {change.analysis.protocolDetails.nodeCount}
                    <br />
                    Uptime: {change.analysis.protocolDetails.avgUptimePercent}%
                  </p>
                </div>
              ))}
            </div>
          ),
        });
      } else {
        toast({
          title: "No Restaking Changes Needed",
          description: "Your LST positions are optimally allocated across AVS protocols.",
        });
      }
    },
  });

  const connectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAddress.startsWith('0x') || inputAddress.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum wallet address.",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/wallet/positions", {
        address: inputAddress
      });
      const data = await response.json();

      if (data) {
        setAddress(inputAddress);
        toast({
          title: "Wallet Connected",
          description: "Successfully loaded wallet positions.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to load wallet positions. Please try again.",
      });
    }
  };

  const loadMockPortfolio = () => {
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    setAddress(mockAddress);
    toast({
      title: "Demo Portfolio Loaded",
      description: "Successfully loaded a mock portfolio for demonstration.",
    });
  };

  if (!address) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Enter your wallet address to view your portfolio</p>
          <form onSubmit={connectWallet} className="flex gap-2 w-full max-w-md">
            <Input 
              placeholder="0x..." 
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              View Portfolio
            </Button>
          </form>
          <div className="mt-4">
            <Button variant="outline" onClick={loadMockPortfolio}>
              Mock Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasLSTTokens = positions.some(pos => 
    ["wstETH", "rETH", "cbETH"].includes(pos.token)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Portfolio Summary</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <Button
            onClick={() => evaluateAll.mutate()}
            disabled={evaluateAll.isPending}
          >
            Re-evaluate All
          </Button>
          {hasLSTTokens && (
            <Button
              onClick={() => setShowRestakingDialog(true)}
              disabled={optimizeRestake.isPending}
              variant="secondary"
            >
              <Layers className="w-4 h-4 mr-2" />
              Optimize Re-stake
            </Button>
          )}
        </div>
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
      <RestakingStrategyDialog
        open={showRestakingDialog}
        onOpenChange={setShowRestakingDialog}
        protocols={protocols}
        onConfirm={(strategy) => optimizeRestake.mutate(strategy)}
      />
    </Card>
  );
}