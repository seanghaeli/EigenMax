import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import type { Price } from "@shared/schema";

export default function PriceFeedPanel() {
  const { data: prices = [] } = useQuery<Price[]>({
    queryKey: ["/api/prices/ethereum"],
    refetchInterval: 60000, // Refetch every minute
  });

  const latestPrice = prices[0];
  const previousPrice = prices[1];
  const priceChange = latestPrice && previousPrice
    ? ((latestPrice.price - previousPrice.price) / previousPrice.price) * 100
    : 0;

  const chartData = [...prices].reverse().map(price => ({
    time: format(new Date(price.timestamp), 'HH:mm:ss'),
    price: price.price
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ETH Price Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold">
            ${latestPrice?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="time"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(time) => time.split(':')[1]}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "0.5rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}