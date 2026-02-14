/** 資格別カラー定義 */
export const COURSE_COLORS = {
  CIA: "#e94560",
  CISA: "#0891b2",
  CFE: "#7c3aed",
} as const;

/** API base URL */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";

/** FSRS rating labels */
export const RATING_LABELS = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
} as const;

/** Explanation levels */
export const EXPLANATION_LEVELS = [
  { level: 1, label: "小学生", description: "身近な例えで" },
  { level: 2, label: "中学生", description: "基本概念を丁寧に" },
  { level: 3, label: "高校生", description: "論理的に構造化" },
  { level: 4, label: "大学生", description: "専門用語を交えて" },
  { level: 5, label: "実務者", description: "実務経験ベースで" },
  { level: 6, label: "公認会計士", description: "専門家レベル" },
] as const;
