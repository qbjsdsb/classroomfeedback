import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { seedBuiltinProfiles } from "./db/seed";
import { db } from "./db/schema";
import { getLastBackupAt } from "./hooks/useSettings";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import SpecProfilePage from "./pages/SpecProfilePage";
import GeneratePage from "./pages/GeneratePage";
import BatchGeneratePage from "./pages/BatchGeneratePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import StudentDetailPage from "./pages/StudentDetailPage";

const NAV: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "首页", end: true },
  { to: "/students", label: "学生" },
  { to: "/spec", label: "规范档" },
  { to: "/generate", label: "生成反馈" },
  { to: "/batch", label: "批量生成" },
  { to: "/stats", label: "统计" },
  { to: "/settings", label: "设置" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { await seedBuiltinProfiles(); setReady(true); })(); }, []);
  useEffect(() => {
    (async () => {
      const students = await db.students.count();
      const feedbacks = await db.feedbacks.count();
      const last = await getLastBackupAt();
      const needRemind =
        (students >= 1 && last === 0) ||
        (feedbacks > 0 && feedbacks % 10 === 0) ||
        (last > 0 && Date.now() - last > 7 * 24 * 3600 * 1000);
      if (needRemind && !sessionStorage.getItem("reminded")) {
        sessionStorage.setItem("reminded", "1");
        alert("建议导出备份数据以防丢失（设置 → 导出）");
      }
    })();
  }, []);
  if (!ready) return <div className="p-8 text-gray-500">加载中…</div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-content mx-auto px-4 flex items-center gap-2 h-14">
          <NavLink to="/" className="flex items-center gap-2 mr-2 font-bold text-gray-800 shrink-0">
            <img src="/favicon.svg" alt="" className="w-7 h-7" />
            <span className="hidden sm:inline">课后反馈生成器</span>
          </NavLink>
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition ${
                    isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-content mx-auto p-4 sm:p-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/spec" element={<SpecProfilePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/batch" element={<BatchGeneratePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
