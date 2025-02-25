
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceFeedPanel() {
  const [prices, setPrices] = useState<{[key: string]: number}>({});
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    const tokens = ['ethereum', 'bitcoin', 'usdc'];
    
    const updatePrices = async () => {
      const newPrices: {[key: string]: number} = {};
      for (const token of tokens) {
        const response = await fetch(`/api/prices/${token}`);
        const price = await response.json();
        newPrices[token] = price;
      }
      setPrices(newPrices);
      setPriceHistory(prev => [...prev, { 
        time: new Date().toLocaleTimeString(),
        ...newPrices
      }].slice(-30));
    };

    updatePrices();
    const interval = setInterval(updatePrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Price Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.entries(prices).map(([token, price]) => (
            <div key={token} className="text-center">
              <div className="text-sm text-gray-400 uppercase">{token}</div>
              <div className="text-xl font-bold">${price.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={priceHistory}>
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "0.5rem",
              }}
            />
            {Object.keys(prices).map((token, index) => (
              <Line
                key={token}
                type="monotone"
                dataKey={token}
                stroke={['#3B82F6', '#10B981', '#6366F1'][index]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
