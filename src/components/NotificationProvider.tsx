import { createContext, useCallback, useRef, useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info";
export interface ToastItem { id: string; type: ToastType; message: string; duration: number; }

export interface NotifyApi {
  success(message: string): string;
  error(message: string): string;
  info(message: string, opts?: { duration?: number }): string;
  dismiss(id?: string): void;
  confirm(title: string, message?: string): Promise<boolean>;
}

export const NotificationContext = createContext<NotifyApi | null>(null);

const MAX_TOASTS = 4;
const DURATION: Record<ToastType, number> = { success: 3000, error: 5000, info: 3000 };

const ICON: Record<ToastType, string> = { success: "✓", error: "✕", info: "ⓘ" };
const BORDER: Record<ToastType, string> = {
  success: "border-l-4 border-green-500",
  error: "border-l-4 border-red-500",
  info: "border-l-4 border-blue-500",
};
const ICON_COLOR: Record<ToastType, string> = {
  success: "text-green-600", error: "text-red-600", info: "text-blue-600",
};

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); }, []);
  return (
    <div className={`bg-white shadow-md rounded-md px-3 py-2 flex items-center gap-2 min-w-[200px] max-w-sm transition-all duration-150 ${BORDER[item.type]} ${show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
      <span className={ICON_COLOR[item.type]}>{ICON[item.type]}</span>
      <span className="flex-1 text-sm text-gray-800">{item.message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearTimer = useCallback((id: string) => {
    const t = timers.current[id];
    if (t) { clearTimeout(t); delete timers.current[id]; }
  }, []);

  const dismiss = useCallback((id?: string) => {
    setToasts(prev => {
      if (id) {
        clearTimer(id);
        return prev.filter(t => t.id !== id);
      }
      prev.forEach(t => clearTimer(t.id));
      return [];
    });
  }, [clearTimer]);

  const push = useCallback((type: ToastType, message: string, duration: number): string => {
    const id = String(++idRef.current);
    setToasts(prev => {
      const next = [...prev, { id, type, message, duration }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const confirm = useCallback((_title: string, _message?: string): Promise<boolean> => {
    // Task 2 实现
    return Promise.resolve(false);
  }, []);

  const api: NotifyApi = {
    success: (m) => push("success", m, DURATION.success),
    error: (m) => push("error", m, DURATION.error),
    info: (m, opts) => push("info", m, opts?.duration ?? DURATION.info),
    dismiss,
    confirm,
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(t => (
            <ToastView key={t.id} item={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
}
