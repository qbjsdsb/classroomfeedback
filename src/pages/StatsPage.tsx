import { useEffect, useState } from "react";
import { getStats, Stats } from "../hooks/useStats";

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { (async () => setS(await getStats()))(); }, []);
  if (!s) return <div>加载中…</div>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Token 消耗统计</h1>
      <p>总消耗：<b>{s.total}</b> tokens</p>
      <div>
        <h2 className="font-semibold">按类型</h2>
        <ul className="text-sm">
          <li>纠错：{s.byType.correct}</li>
          <li>生成：{s.byType.generate}</li>
          <li>学习：{s.byType.learn}</li>
        </ul>
      </div>
      <div>
        <h2 className="font-semibold">按日期</h2>
        {Object.keys(s.byDay).length === 0 ? (
          <p className="text-sm text-gray-500">暂无数据</p>
        ) : (
          <ul className="text-sm">{Object.entries(s.byDay).map(([d, t]) => <li key={d}>{d}：{t}</li>)}</ul>
        )}
      </div>
    </div>
  );
}
