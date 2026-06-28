import { Home, Users, BookOpen, Sparkles, Layers, BarChart3, Settings } from "lucide-react";
import { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "首页", icon: Home, end: true },
  { to: "/students", label: "学生", icon: Users },
  { to: "/spec", label: "规范档", icon: BookOpen },
  { to: "/generate", label: "生成", icon: Sparkles },
  { to: "/batch", label: "批量", icon: Layers },
  { to: "/stats", label: "统计", icon: BarChart3 },
  { to: "/settings", label: "设置", icon: Settings },
];
