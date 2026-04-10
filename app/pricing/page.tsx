export default function Pricing(){
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">💰 Pricing</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">Free</div>
        <div className="p-4 border rounded">Pro</div>
        <div className="p-4 border rounded">Enterprise</div>
      </div>
    </div>
  );
}
