export function RankChange({ change }: { change: number }) {
  if (change > 0) return <span className="text-green-500">↑ {change}</span>;
  if (change < 0) return <span className="text-red-500">↓ {Math.abs(change)}</span>;
  return <span className="text-gray-400">-</span>;
}
