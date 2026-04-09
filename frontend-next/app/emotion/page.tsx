"use client";
import { useState } from "react";

export default function EmotionPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    const res = await fetch("/api/emotion/checkin", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Mei 情緒檢測</h1>
      <textarea
        className="w-full p-3 text-black"
        rows={4}
        placeholder="輸入你現在的狀態..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={submit} className="mt-3 px-4 py-2 bg-pink-500">分析</button>

      {result && (
        <div className="mt-6">
          <p>情緒：{result.primaryEmotion}</p>
          <p>風險：{result.riskLevel} ({result.riskScore})</p>
          <p>建議：</p>
          <ul>
            {result.guidance.map((g: string, i: number) => <li key={i}>- {g}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
