import { createContext, useCallback, useRef, useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { clsx } from "clsx";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

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

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info };
const TOAST_ICON_COLOR: Record<ToastType, string> = {
  success: "text-emerald-500", error: "text-red-500", info: "text-primary",
};

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); }, []);
  const Icon = TOAST_ICON[item.type];
  return (
    <div className={clsx(
      "bg-surface border border-border shadow-card-hover rounded-md px-3 py-2 flex items-center gap-2 min-w-[200px] max-w-sm transition-all duration-150",
      show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <Icon className={clsx("w-4 h-4 flex-shrink-0", TOAST_ICON_COLOR[item.type])} />
      <span className="flex-1 text-sm text-text">{item.message}</span>
      <button onClick={onClose} className="text-text-muted hover:text-text"><X className="w-3.5 h-3.5" /></button>
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

  const [modal, setModal] = useState<{ title: string; message?: string; resolve: (ok: boolean) => void } | null>(null);

  const confirm = useCallback((title: string, message?: string): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      setModal({ title, message, resolve });
    });
  }, []);

  const closeModal = useCallback((ok: boolean) => {
    setModal(prev => {
      prev?.resolve(ok);
      return null;
    });
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
      <Dialog open={modal !== null} onClose={() => closeModal(false)} className="relative z-50">
        <div className="modal-overlay fixed inset-0 bg-black/40" onClick={() => closeModal(false)} />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-surface border border-border rounded-lg shadow-card-hover max-w-sm w-full p-5 space-y-3">
            <DialogTitle className="font-bold text-text">{modal?.title}</DialogTitle>
            {modal?.message && <p className="text-sm text-text-muted">{modal.message}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => closeModal(false)} className="btn-soft">取消</button>
              <button onClick={() => closeModal(true)} className="btn-primary">确认</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
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
