export function HeatBadge({ value }: { value: number }) {
  const getColor = () => {
    if (value > 80) return "text-red-500";
    if (value > 60) return "text-orange-400";
    if (value > 40) return "text-yellow-400";
    return "text-blue-400";
  };

  return <span className={`font-bold ${getColor()}`}>{value}</span>;
}
