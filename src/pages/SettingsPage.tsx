import { useEffect, useState } from "react";
import { getApiKey, saveApiKey } from "../hooks/useSettings";

export default function SettingsPage() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { (async () => setKey(await getApiKey()))(); }, []);
  const save = async () => { await saveApiKey(key); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">设置</h1>
      <label className="block">
        <span className="text-sm text-gray-600">DeepSeek API Key</span>
        <input type="password" value={key} onChange={e => setKey(e.target.value)}
          className="block w-full mt-1 border rounded p-2" placeholder="sk-..." />
      </label>
      <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
      {saved && <p className="text-green-600 text-sm">已保存</p>}
      <p className="text-xs text-gray-500">Key 仅存在本机浏览器，不会上传。</p>
    </div>
  );
}
