import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

export default function MyBarChart({ data }: { data: { _id: string; totalRevenue: number; totalGross: number }[] }) {
  return <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid stroke="var(--ot-line)" vertical={false} />
      <XAxis dataKey="_id" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--ot-muted)' }} />
      <YAxis width={60} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--ot-muted)' }} tickFormatter={(value: number) => Intl.NumberFormat('en', { notation: 'compact' }).format(value)} />
      <Tooltip contentStyle={{ background: 'var(--ot-paper)', border: '1px solid var(--ot-line)', borderRadius: 6, color: 'var(--ot-ink)', fontSize: 12 }} cursor={{ fill: 'var(--ot-bg)' }} />
      <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
      <Bar name="Revenue" dataKey="totalRevenue" fill="var(--ot-accent)" maxBarSize={24} radius={[3, 3, 0, 0]} />
      <Bar name="Gross" dataKey="totalGross" fill="var(--ot-muted)" maxBarSize={24} radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>;
}
