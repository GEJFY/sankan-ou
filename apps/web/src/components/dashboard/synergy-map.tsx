"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface SynergyArea {
  area_name: string;
  overlap_pct: number;
  courses: string[];
  term_mappings: Record<string, string>;
}

interface SynergyOverview {
  courses: {
    code: string;
    name: string;
    color: string;
    icon: string;
    exam_questions: number;
    passing_score: number;
  }[];
  synergy_areas: SynergyArea[];
  avg_overlap_pct: number;
}

export default function SynergyMap() {
  const [data, setData] = useState<SynergyOverview | null>(null);
  const [selectedArea, setSelectedArea] = useState<SynergyArea | null>(null);

  useEffect(() => {
    apiFetch<SynergyOverview>("/synergy/overview").then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const courseColors: Record<string, string> = {};
  data.courses.forEach((c) => {
    courseColors[c.code] = c.color;
  });

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">
        シナジーマップ
      </h3>

      {/* 資格コース概要 */}
      <div className="flex justify-center py-2">
        <div className="flex flex-wrap justify-center gap-3">
          {data.courses.map((c) => (
            <div key={c.code} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs font-semibold" style={{ color: c.color }}>
                {c.code}
              </span>
              <span className="text-lg">{c.icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 中央統計 */}
      <div className="text-center py-1">
        <div className="text-2xl font-bold text-white">
          {Math.round(data.avg_overlap_pct)}%
        </div>
        <div className="text-[10px] text-gray-400">{data.courses.length}資格 平均重複率</div>
      </div>

      {/* シナジー領域リスト */}
      <div className="space-y-1.5">
        {data.synergy_areas.slice(0, 8).map((area, i) => (
          <button
            key={i}
            onClick={() =>
              setSelectedArea(selectedArea?.area_name === area.area_name ? null : area)
            }
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              selectedArea?.area_name === area.area_name
                ? "bg-gray-700 border border-gray-600"
                : "bg-gray-800 hover:bg-gray-750"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{area.area_name}</span>
                <div className="flex gap-0.5">
                  {area.courses.map((code) => (
                    <span
                      key={code}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: courseColors[code] || "#666" }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-gray-400 font-mono">
                {area.overlap_pct}%
              </span>
            </div>

            {/* 展開詳細 */}
            {selectedArea?.area_name === area.area_name && (
              <div className="mt-2 space-y-1 border-t border-gray-700 pt-2">
                {Object.entries(area.term_mappings).map(([code, desc]) => (
                  <div key={code} className="flex gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: courseColors[code] || "#666" }}
                    >
                      {code}
                    </span>
                    <span className="text-gray-400">{desc}</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
