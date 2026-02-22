"use client";

import { Info } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  tooltip?: string;
}

export default function PageHeader({ title, description, tooltip }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        {tooltip && (
          <span className="tooltip-trigger">
            <Info size={16} className="text-zinc-600 cursor-help" />
            <span className="tooltip-content">{tooltip}</span>
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}
