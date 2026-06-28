import { useEffect, useState } from "react";
import { getApiKey, saveApiKey, setLastBackupAt } from "../hooks/useSettings";
import { exportAll, importAll } from "../backup/export";
import { useNotify } from "../hooks/useNotify";
import { AppearanceSection } from "../components/AppearanceSection";

export default function SettingsPage() {
  const notify = useNotify();
  const [key, setKey] = useState("");
  useEffect(() => { (async () => setKey(await getApiKey()))(); }, []);
  const save = async () => { await saveApiKey(key); notify.success("已保存"); };
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-xl font-bold">设置</h1>
      </div>
      <AppearanceSection />
      <div className="card space-y-3">
        <div className="form-field">
          <label className="label">DeepSeek API Key</label>
          <input type="password" value={key} onChange={e => setKey(e.target.value)}
            className="input" placeholder="sk-..." />
        </div>
        <button onClick={save} className="btn-primary">保存</button>
        <p className="hint">Key 仅存在本机浏览器，不会上传。</p>
      </div>
      <div className="card space-y-3">
        <h2 className="section-title">数据备份</h2>
        <p className="text-xs text-orange-600">导出文件含学生信息，请妥善保管。</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            const blob = new Blob([await exportAll()], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `kehoufankui-backup-${Date.now()}.json`; a.click();
            await setLastBackupAt(Date.now());
            notify.success("已导出");
          }} className="btn-soft">导出全部数据</button>
          <label className="btn-soft cursor-pointer">
            导入数据
            <input type="file" accept="application/json" className="hidden" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              try {
                await importAll(await f.text());
                notify.success("导入完成，请刷新页面");
              } catch (err: any) { notify.error("导入失败：" + err.message); }
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}
