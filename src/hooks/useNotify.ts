import { useContext } from "react";
import { NotificationContext, NotifyApi } from "../components/NotificationProvider";

export function useNotify(): NotifyApi {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be used within NotificationProvider");
  return ctx;
}
