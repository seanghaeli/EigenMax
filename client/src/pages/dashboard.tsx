import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import ProtocolCard from "@/components/protocol-card";
import YieldChart from "@/components/yield-chart";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Protocol, InsertProtocol, Vault } from "@shared/schema";
import { insertProtocolSchema } from "@shared/schema";
import PriceFeedPanel from "@/components/price-feed-panel"; // Added import

export default function Dashboard() {
  const { toast } = useToast();
  const form = useForm<InsertProtocol>({
    resolver: zodResolver(insertProtocolSchema),
    defaultValues: {
      name: "",
      apy: 0,
      tvl: 0,
      active: true,
    },
  });

  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ["/api/protocols"],
  });

  const { data: vaults } = useQuery<Vault[]>({
    queryKey: ["/api/vaults"],
  });

  const addProtocol = useMutation({
    mutationFn: async (data: InsertProtocol) => {
      await apiRequest("POST", "/api/protocols", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({
        title: "Protocol added",
        description: "The protocol has been successfully added.",
      });
    },
  });

  const toggleProtocol = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/protocols/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
    },
  });

  const optimizeVault = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/vaults/${id}/optimize`);
      return response;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vaults/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vaults/${id}/transactions`] });

      if (data.vault) {
        const changes = {
          oldProtocol: data.vault.protocol,
          newApy: data.vault.apy,
          amount: data.vault.balance,
        };

        Dialog.show({
          title: "Portfolio Changes",
          content: (
            <div className="space-y-4">
              <p>The following changes were made to your portfolio:</p>
              <ul className="list-disc pl-4">
                <li>Moved {changes.amount.toLocaleString()} USD to {changes.oldProtocol}</li>
                <li>New APY: {changes.newApy}%</li>
              </ul>
            </div>
          )
        });
      } else {
        toast({
          title: "No changes needed",
          description: "Your vault is already optimized for best yields.",
        });
      }
    },
  });

  function onSubmit(data: InsertProtocol) {
    addProtocol.mutate(data);
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Yield Optimization Dashboard</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Protocol</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Protocol</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APY (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tvl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TVL ($)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Add Protocol</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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
                <div className="mt-2 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs ${vault.autoMode ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {vault.autoMode ? 'Auto' : 'Manual'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      optimizeVault.mutate(vault.id);
                    }}
                  >
                    Re-evaluate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <PriceFeedPanel />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Protocol Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {protocols.map((protocol) => (
              <div key={protocol.id} className="relative">
                <ProtocolCard
                  name={protocol.name}
                  apy={protocol.apy}
                  tvl={protocol.tvl}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => toggleProtocol.mutate(protocol.id)}
                >
                  {protocol.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ))}
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