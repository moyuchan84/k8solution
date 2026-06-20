import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const TEMPLATES = [
  {
    id: "spring-postgres",
    emoji: "☕",
    name: "Spring Boot + PostgreSQL",
    desc: "REST API 서버 + 관계형 DB",
    tags: ["App(M)", "DB", "Secret", "NetworkPolicy"],
    stack: "java",
  },
  {
    id: "nodejs-redis",
    emoji: "🟢",
    name: "Node.js + Redis",
    desc: "고속 API + 캐시 레이어",
    tags: ["App(S)", "Cache", "NetworkPolicy"],
    stack: "nodejs",
  },
  {
    id: "python-worker",
    emoji: "🐍",
    name: "Python Worker",
    desc: "배치/비동기 작업 처리",
    tags: ["App(S)", "CronJob"],
    stack: "python",
  },
  {
    id: "go-microservice",
    emoji: "🐹",
    name: "Go Microservice",
    desc: "경량 gRPC/HTTP 서비스",
    tags: ["App(S)", "Prometheus"],
    stack: "go",
  },
  {
    id: "fullstack",
    emoji: "🌐",
    name: "Full-Stack",
    desc: "API 서버 + 프론트엔드 분리 배포",
    tags: ["2 Services", "Ingress Split"],
    stack: "other",
  },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#191f28]">템플릿 갤러리</h1>
        <p className="text-[14px] text-[#8b95a1] mt-1">
          검증된 스택 조합으로 빠르게 시작하세요
        </p>
      </div>

      {/* 검색 */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="템플릿 검색..."
          className="w-64 h-10 px-3 rounded-[10px] border border-[#e5e8eb] text-[14px] text-[#333d4b] placeholder:text-[#b0b8c1] outline-none focus:border-[#3182f6]"
        />
        <select className="h-10 px-3 rounded-[10px] border border-[#e5e8eb] text-[14px] text-[#4e5968] outline-none focus:border-[#3182f6] bg-white cursor-pointer">
          <option>전체 스택</option>
          <option>Java</option>
          <option>Node.js</option>
          <option>Python</option>
          <option>Go</option>
        </select>
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <Card
            key={t.id}
            className="hover:shadow-elevated transition-shadow duration-150 flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{t.emoji}</span>
              <div>
                <p className="text-[15px] font-bold text-[#191f28]">{t.name}</p>
                <p className="text-[13px] text-[#8b95a1] mt-0.5">{t.desc}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {t.tags.map((tag) => (
                <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>
              ))}
            </div>

            <div className="mt-auto">
              <Link href={`/projects/new?template=${t.id}&stack=${t.stack}`}>
                <Button variant="secondary" size="md" fullWidth>
                  사용하기
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
