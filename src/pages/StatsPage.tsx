import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Zap, TrendingUp, Layers, Calendar } from "lucide-react";
import { getStats, Stats } from "../hooks/useStats";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { (async () => setS(await getStats()))(); }, []);
  if (!s) return <Skeleton lines={4} />;
  const max = Math.max(...s.recent7.map(d => d.tokens), 1);
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title text-xl font-bold">Token 消耗统计</h1>
      </div>

      {s.total === 0 ? (
        <EmptyState icon={BarChart3} title="暂无消耗数据" hint="生成反馈后这里会显示 Token 消耗" action={<Link to="/generate" className="btn-primary">去生成</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="总消耗" value={s.total} unit="tokens" icon={Zap} />
            <StatCard label="近 7 天" value={s.recent7.reduce((a, b) => a + b.tokens, 0)} unit="tokens" icon={TrendingUp} />
            <StatCard label="调用类型" value={Object.keys(s.byType).length} unit="类" icon={Layers} />
            <StatCard label="活跃天数" value={Object.keys(s.byDay).length} unit="天" icon={Calendar} />
          </div>

          <div className="card">
            <h2 className="section-title mb-4">近 7 天趋势</h2>
            <div className="flex items-end justify-between gap-2 h-32">
              {s.recent7.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-text-muted">{d.tokens}</div>
                  <div
                    className="w-full bg-primary rounded-t-md min-h-[4px] transition-all"
                    style={{ height: `${(d.tokens / max) * 100}%` }}
                    title={`${d.day}: ${d.tokens}`}
                  />
                  <div className="text-xs text-text-muted">{d.day.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">按调用类型</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(s.byType).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-2">
                  <span className="text-sm text-text">{k}</span>
                  <span className="text-sm font-semibold text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
