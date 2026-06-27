import { Link } from "react-router-dom";

const STEPS: { n: number; title: string; desc: string; to: string; cta: string }[] = [
  { n: 1, title: "填入 API Key", desc: "在设置页填入你的 DeepSeek API Key，仅存在本机浏览器，不上传。", to: "/settings", cta: "去设置" },
  { n: 2, title: "添加学生", desc: "录入学生姓名、年级、性格、薄弱点、家长关注点，可设常用科目自动匹配规范档。", to: "/students", cta: "去添加" },
  { n: 3, title: "选/学规范档", desc: "选一套内置风格，或上传历史反馈让 AI 学习你机构的写法。", to: "/spec", cta: "去规范档" },
  { n: 4, title: "生成反馈", desc: "录音或手动输入本节课内容，AI 按规范档生成个性化反馈，可编辑后保存。", to: "/generate", cta: "去生成" },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0">
        <h1 className="text-2xl font-bold">课后反馈生成器</h1>
        <p className="mt-2 text-blue-50 text-sm leading-relaxed">
          录音或手动输入课程内容，AI 学习你的历史反馈风格，一键生成符合机构规范的个性化课后反馈。
          数据全部存于本机浏览器，安全可控。
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">快速开始</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STEPS.map(s => (
            <div key={s.n} className="card card-hover">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  <Link to={s.to} className="inline-block mt-2 text-sm text-blue-600 hover:underline">
                    {s.cta} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          <b>提示：</b>数据存在本机浏览器的 IndexedDB 中，清除浏览器数据会导致丢失，请定期在「设置 → 导出」备份。
        </p>
      </div>
    </div>
  );
}
