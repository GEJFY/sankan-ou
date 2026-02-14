"use client";

import { EXPLANATION_LEVELS } from "@/lib/constants";

interface LevelSelectorProps {
  level: number;
  onChange: (level: number) => void;
}

export default function LevelSelector({ level, onChange }: LevelSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-800 rounded-xl mb-4">
      {EXPLANATION_LEVELS.map((l) => (
        <button
          key={l.level}
          onClick={() => onChange(l.level)}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            level === l.level
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
          title={l.description}
        >
          Lv{l.level} {l.label}
        </button>
      ))}
    </div>
  );
}
