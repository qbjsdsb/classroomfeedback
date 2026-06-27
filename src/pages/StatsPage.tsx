import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats, Stats } from "../hooks/useStats";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { (async () => setS(await getStats()))(); }, []);
  if (!s) return <Skeleton lines={4} />;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Token 消耗统计</h1>
      {s.total === 0 ? (
        <EmptyState title="暂无消耗数据" hint="生成反馈后这里会显示 Token 消耗" action={<Link to="/generate" className="btn-primary">去生成</Link>} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
