import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { Sun, Moon, Menu, X } from "lucide-react";
import { seedBuiltinProfiles } from "./db/seed";
import { db } from "./db/schema";
import { getLastBackupAt } from "./hooks/useSettings";
import { NotificationProvider } from "./components/NotificationProvider";
import { useNotify } from "./hooks/useNotify";
import { Skeleton } from "./components/Skeleton";
import { useTheme } from "./hooks/useTheme";
import { NAV_ITEMS } from "./data/nav";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import SpecProfilePage from "./pages/SpecProfilePage";
import GeneratePage from "./pages/GeneratePage";
import BatchGeneratePage from "./pages/BatchGeneratePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import StudentDetailPage from "./pages/StudentDetailPage";

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
  const { resolvedMode, toggleMode } = useTheme();
  const Icon = resolvedMode === "dark" ? Sun : Moon;
  return (
    <button onClick={toggleMode} className="btn-ghost p-2 shrink-0" aria-label="切换明暗">
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { (async () => { await seedBuiltinProfiles(); setReady(true); })(); }, []);
  return (
    <NotificationProvider>
      {!ready ? (
        <div className="p-4"><Skeleton lines={2} /></div>
      ) : (
        <div className="min-h-screen bg-bg">
          <BackupReminder />
          <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-14 flex items-center justify-between gap-4">
                <NavLink to="/" className="flex items-center gap-2 font-bold text-text shrink-0">
                  <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-7 h-7" />
                  <span className="hidden sm:inline">ClassFlow · 课后反馈</span>
                </NavLink>
                <nav className="hidden sm:flex items-center gap-1">
                  {NAV_ITEMS.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        clsx("nav-link whitespace-nowrap", isActive ? "nav-link-active" : "nav-link-inactive")
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="sm:hidden btn-ghost p-2"
                    aria-label="菜单"
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {mobileOpen && (
                <nav className="sm:hidden pb-3 flex flex-col gap-1">
                  {NAV_ITEMS.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx("nav-link", isActive ? "nav-link-active" : "nav-link-inactive")
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
