import { useEffect, useState } from "react";
import { getStats, Stats } from "../hooks/useStats";

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { (async () => setS(await getStats()))(); }, []);
  if (!s) return <div className="text-gray-500">加载中…</div>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Token 消耗统计</h1>
      <p className="text-lg">总消耗：<b className="text-blue-700">{s.total}</b> tokens</p>
      <div className="card">
        <h2 className="font-semibold">按类型</h2>
        <ul className="text-sm">
          {Object.entries(s.byType).map(([k, v]) => <li key={k} className="py-0.5">{k}：{v}</li>)}
        </ul>
      </div>
      <div className="card">
        <h2 className="font-semibold">按日期</h2>
        {Object.keys(s.byDay).length === 0 ? (
          <p className="text-sm text-gray-500">暂无数据</p>
        ) : (
          <ul className="text-sm">{Object.entries(s.byDay).map(([d, t]) => <li key={d} className="py-0.5">{d}：{t}</li>)}</ul>
        )}
      </div>
    </div>
  );
}
