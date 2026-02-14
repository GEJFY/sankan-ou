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
        3資格シナジーマップ
      </h3>

      {/* ベン図風の表示 */}
      <div className="flex justify-center py-2">
        <div className="relative w-64 h-40">
          {/* CIA circle */}
          <div
            className="absolute w-28 h-28 rounded-full opacity-20 left-4 top-0"
            style={{ backgroundColor: courseColors["CIA"] }}
          />
          <div className="absolute left-10 top-3 text-xs font-bold" style={{ color: courseColors["CIA"] }}>
            CIA
          </div>
          {/* CISA circle */}
          <div
            className="absolute w-28 h-28 rounded-full opacity-20 right-4 top-0"
            style={{ backgroundColor: courseColors["CISA"] }}
          />
          <div className="absolute right-10 top-3 text-xs font-bold" style={{ color: courseColors["CISA"] }}>
            CISA
          </div>
          {/* CFE circle */}
          <div
            className="absolute w-28 h-28 rounded-full opacity-20 left-1/2 -translate-x-1/2 top-10"
            style={{ backgroundColor: courseColors["CFE"] }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-2 text-xs font-bold"
            style={{ color: courseColors["CFE"] }}
          >
            CFE
          </div>
          {/* Center overlap */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-lg font-bold text-white">
              {Math.round(data.avg_overlap_pct)}%
            </div>
            <div className="text-[10px] text-gray-400">平均重複</div>
          </div>
        </div>
      </div>

      {/* シナジー領域リスト */}
      <div className="space-y-1.5">
        {data.synergy_areas.slice(0, 6).map((area, i) => (
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
