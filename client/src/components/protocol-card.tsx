import { Card, CardContent } from "@/components/ui/card";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { BiCoinStack } from "react-icons/bi";
import { Database, Wallet } from "lucide-react";

interface ProtocolCardProps {
  name: string;
  apy: number;
  tvl: number;
  healthScore: number;
  tvlChange24h: number;
  tvlChange7d: number;
}

const PROTOCOL_ICONS = {
  "AAVE": BsCurrencyBitcoin,
  "Compound": BiCoinStack,
  "Morpho": Database,
  "Moonwell": Wallet,
};

export default function ProtocolCard({ name, apy, tvl, healthScore = 50, tvlChange24h = 0, tvlChange7d = 0 }: ProtocolCardProps) {
  const Icon = PROTOCOL_ICONS[name as keyof typeof PROTOCOL_ICONS];

  return (
    <Card className="bg-neutral-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-primary" />
            <span className="font-semibold">{name}</span>
          </div>
          <div className="text-sm px-2 py-1 rounded bg-muted/50">
            Score: {(healthScore ?? 50).toFixed(0)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">APY</div>
            <div className="text-success-500">{(apy ?? 0).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">TVL</div>
            <div>${((tvl ?? 0) / 1000000).toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-muted-foreground">24h Change</div>
            <div className={(tvlChange24h ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
              {(tvlChange24h ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(tvlChange24h ?? 0).toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">7d Change</div>
            <div className={(tvlChange7d ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
              {(tvlChange7d ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(tvlChange7d ?? 0).toFixed(2)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}