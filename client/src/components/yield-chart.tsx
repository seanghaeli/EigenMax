import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { date: "Jan", aave: 4.2, compound: 3.8, morpho: 4.0, moonwell: 3.5 },
  { date: "Feb", aave: 4.5, compound: 3.9, morpho: 4.2, moonwell: 3.6 },
  { date: "Mar", aave: 4.3, compound: 3.7, morpho: 4.1, moonwell: 3.4 },
  { date: "Apr", aave: 4.6, compound: 4.0, morpho: 4.3, moonwell: 3.7 },
];

export default function YieldChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <XAxis dataKey="date" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "none",
            borderRadius: "0.5rem",
          }}
        />
        <Line type="monotone" dataKey="aave" stroke="#3B82F6" strokeWidth={2} />
        <Line type="monotone" dataKey="compound" stroke="#10B981" strokeWidth={2} />
        <Line type="monotone" dataKey="morpho" stroke="#6366F1" strokeWidth={2} />
        <Line type="monotone" dataKey="moonwell" stroke="#F59E0B" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
