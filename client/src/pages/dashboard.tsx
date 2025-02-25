import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ProtocolCard from "@/components/protocol-card";
import YieldChart from "@/components/yield-chart";
import type { Vault } from "@shared/schema";

export default function Dashboard() {
  const { data: vaults, isLoading } = useQuery<Vault[]>({
    queryKey: ["/api/vaults"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">Yield Optimization Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {vaults?.map((vault) => (
          <Link key={vault.id} href={`/vault/${vault.id}`}>
            <Card className="hover:bg-neutral-800 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{vault.name}</span>
                  <span className="text-success-500">{vault.apy}% APY</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{vault.protocol}</span>
                  <span className="text-xl">${vault.balance.toLocaleString()}</span>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${vault.autoMode ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {vault.autoMode ? 'Auto' : 'Manual'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Protocol Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ProtocolCard name="AAVE" apy={4.5} tvl={10000000} />
            <ProtocolCard name="Compound" apy={3.8} tvl={8500000} />
            <ProtocolCard name="Morpho" apy={4.2} tvl={7000000} />
            <ProtocolCard name="Moonwell" apy={3.5} tvl={5000000} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yield Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <YieldChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
