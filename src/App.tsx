import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { seedBuiltinProfiles } from "./db/seed";
import { db } from "./db/schema";
import { getLastBackupAt } from "./hooks/useSettings";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import SpecProfilePage from "./pages/SpecProfilePage";
import GeneratePage from "./pages/GeneratePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import StudentDetailPage from "./pages/StudentDetailPage";

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
  if (!ready) return <div className="p-8">加载中…</div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex gap-3 p-4 bg-white border-b">
        <NavLink to="/" end className={({ isActive }) => isActive ? "font-bold" : ""}>首页</NavLink>
        <NavLink to="/students" className={({ isActive }) => isActive ? "font-bold" : ""}>学生</NavLink>
        <NavLink to="/spec" className={({ isActive }) => isActive ? "font-bold" : ""}>规范档</NavLink>
        <NavLink to="/generate" className={({ isActive }) => isActive ? "font-bold" : ""}>生成反馈</NavLink>
        <NavLink to="/stats" className={({ isActive }) => isActive ? "font-bold" : ""}>统计</NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "font-bold" : ""}>设置</NavLink>
      </nav>
      <main className="max-w-3xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/spec" element={<SpecProfilePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
