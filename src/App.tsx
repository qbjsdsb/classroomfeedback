import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { Sun, Moon, BookOpen, Users, FileText, Sparkles, Layers, BarChart3, Settings } from "lucide-react";
import { seedBuiltinProfiles } from "./db/seed";
import { db } from "./db/schema";
import { getLastBackupAt } from "./hooks/useSettings";
import { NotificationProvider } from "./components/NotificationProvider";
import { useNotify } from "./hooks/useNotify";
import { Skeleton } from "./components/Skeleton";
import { useTheme } from "./hooks/useTheme";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import SpecProfilePage from "./pages/SpecProfilePage";
import GeneratePage from "./pages/GeneratePage";
import BatchGeneratePage from "./pages/BatchGeneratePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import StudentDetailPage from "./pages/StudentDetailPage";

const NAV: { to: string; label: string; icon: typeof BookOpen; end?: boolean }[] = [
  { to: "/", label: "首页", icon: BookOpen, end: true },
  { to: "/students", label: "学生", icon: Users },
  { to: "/spec", label: "规范档", icon: FileText },
  { to: "/generate", label: "生成反馈", icon: Sparkles },
  { to: "/batch", label: "批量生成", icon: Layers },
  { to: "/stats", label: "统计", icon: BarChart3 },
  { to: "/settings", label: "设置", icon: Settings },
];

function BackupReminder() {
  const notify = useNotify();
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
        notify.info("建议导出备份数据以防丢失（设置 → 导出）");
      }
    })();
  }, [notify]);
  return null;
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button onClick={toggle} className="btn-ghost p-2 shrink-0" aria-label="切换主题">
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { await seedBuiltinProfiles(); setReady(true); })(); }, []);
  return (
    <NotificationProvider>
      {!ready ? (
        <div className="p-4"><Skeleton lines={2} /></div>
      ) : (
        <div className="min-h-screen bg-bg">
          <BackupReminder />
          <nav className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-border">
            <div className="max-w-content mx-auto px-4 flex items-center gap-2 h-14">
              <NavLink to="/" className="flex items-center gap-2 mr-2 font-bold text-text shrink-0">
                <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
                <span className="hidden sm:inline">课后反馈生成器</span>
              </NavLink>
              <div className="flex items-center gap-1 overflow-x-auto flex-1">
                {NAV.map(n => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) =>
                      clsx("nav-link whitespace-nowrap", isActive ? "nav-link-active" : "nav-link-inactive")
                    }
                  >
                    <n.icon className="w-4 h-4" />
                    <span>{n.label}</span>
                  </NavLink>
                ))}
              </div>
              <ThemeToggle />
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
      )}
    </NotificationProvider>
  );
}
