
import { useEffect, useState } from 'react';
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PriceChartProps {
  token: string;
}

export default function PriceChart({ token }: PriceChartProps) {
  const [priceData, setPriceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPrice = async () => {
      const response = await fetch(`/api/prices/${token}`);
      const price = await response.json();
      setPriceData(prev => [...prev, { time: new Date().toLocaleTimeString(), price }]);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [token]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={priceData.slice(-30)}>
        <XAxis dataKey="time" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "none",
            borderRadius: "0.5rem",
          }}
        />
        <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
