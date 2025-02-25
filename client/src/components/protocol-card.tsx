import { Card, CardContent } from "@/components/ui/card";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { BiCoinStack } from "react-icons/bi";
import { Database, Wallet } from "lucide-react";

interface ProtocolCardProps {
  name: string;
  apy: number;
  tvl: number;
}

const PROTOCOL_ICONS = {
  "AAVE": BsCurrencyBitcoin,
  "Compound": BiCoinStack,
  "Morpho": Database,
  "Moonwell": Wallet,
};

export default function ProtocolCard({ name, apy, tvl }: ProtocolCardProps) {
  const Icon = PROTOCOL_ICONS[name as keyof typeof PROTOCOL_ICONS];

  return (
    <Card className="bg-neutral-800">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="w-6 h-6 text-primary" />
          <span className="font-semibold">{name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">APY</div>
            <div className="text-success-500">{apy}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">TVL</div>
            <div>${(tvl / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}