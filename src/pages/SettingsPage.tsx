import { useEffect, useState } from "react";
import { getApiKey, saveApiKey, setLastBackupAt } from "../hooks/useSettings";
import { exportAll, importAll } from "../backup/export";

export default function SettingsPage() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { (async () => setKey(await getApiKey()))(); }, []);
  const save = async () => { await saveApiKey(key); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">设置</h1>
      <label className="block">
        <span className="label">DeepSeek API Key</span>
        <input type="password" value={key} onChange={e => setKey(e.target.value)}
          className="input mt-1" placeholder="sk-..." />
      </label>
      <button onClick={save} className="btn-primary">保存</button>
      {saved && <p className="text-green-600 text-sm">已保存</p>}
      <p className="hint">Key 仅存在本机浏览器，不会上传。</p>
      <div className="border-t pt-3 space-y-2">
        <h2 className="font-semibold">数据备份</h2>
        <p className="text-xs text-orange-600">导出文件含学生信息，请妥善保管。</p>
        <div className="flex gap-2">
          <button onClick={async () => {
            const blob = new Blob([await exportAll()], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `kehoufankui-backup-${Date.now()}.json`; a.click();
            await setLastBackupAt(Date.now());
          }} className="btn-soft">导出全部数据</button>
          <label className="btn-soft cursor-pointer">
            导入数据
            <input type="file" accept="application/json" className="hidden" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              await importAll(await f.text()); alert("导入完成，请刷新页面");
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}
