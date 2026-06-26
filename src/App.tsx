import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { seedBuiltinProfiles } from "./db/seed";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import SpecProfilePage from "./pages/SpecProfilePage";
import GeneratePage from "./pages/GeneratePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { await seedBuiltinProfiles(); setReady(true); })(); }, []);
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
          <Route path="/spec" element={<SpecProfilePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
