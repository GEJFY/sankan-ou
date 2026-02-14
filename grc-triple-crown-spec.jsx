import { useState } from "react";

const SECTIONS = [
  { id: "overview", title: "全体概要", icon: "🎯" },
  { id: "synergy", title: "3資格シナジー", icon: "🔗" },
  { id: "exams", title: "試験詳細マップ", icon: "📋" },
  { id: "science", title: "脳科学エンジン", icon: "🧠" },
  { id: "ai", title: "AI機能設計", icon: "🤖" },
  { id: "ui", title: "UI/UX設計", icon: "📱" },
  { id: "tech", title: "技術設計", icon: "⚙️" },
  { id: "enterprise", title: "エンタープライズ基盤", icon: "🏢" },
  { id: "devops", title: "DevOps/SRE", icon: "🔄" },
  { id: "security", title: "セキュリティ設計", icon: "🔐" },
  { id: "media", title: "音声/スライド学習", icon: "🎙️" },
  { id: "platform", title: "汎用プラットフォーム", icon: "🧩" },
  { id: "cost", title: "コスト/法務", icon: "💰" },
  { id: "schedule", title: "スケジュール(AI動的)", icon: "📅" },
];

const COLORS = {
  cia: "#e94560",
  cisa: "#0891b2",
  cfe: "#7c3aed",
  shared: "#059669",
  dark: "#1a1a2e",
  navy: "#0f3460",
};

// ─── Shared Components ───

function Badge({ text, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: color + "18",
        color: color,
        padding: "2px 10px",
        borderRadius: "20px",
        fontSize: "0.7rem",
        fontWeight: 700,
        border: `1px solid ${color}40`,
      }}
    >
      {text}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        padding: "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: "1.6rem",
        fontWeight: 800,
        color: COLORS.dark,
        marginBottom: "1.5rem",
        borderBottom: `3px solid ${COLORS.cia}`,
        paddingBottom: "0.75rem",
      }}
    >
      {children}
    </h2>
  );
}

// ─── Section: Overview ───

function OverviewSection() {
  const exams = [
    {
      name: "CIA",
      full: "公認内部監査人",
      org: "IIA",
      color: COLORS.cia,
      format: "3パート｜125+100+100問",
      time: "150+120+120分",
      pass: "600/750点",
      studyWeeks: "3-4週間",
      advantage: "CPA知識で40-50%カバー",
    },
    {
      name: "CISA",
      full: "公認情報システム監査人",
      org: "ISACA",
      color: COLORS.cisa,
      format: "5ドメイン｜150問",
      time: "240分",
      pass: "450/800点",
      studyWeeks: "3-4週間",
      advantage: "IBM経験+CPA監査知識で50-60%カバー",
    },
    {
      name: "CFE",
      full: "公認不正検査士",
      org: "ACFE",
      color: COLORS.cfe,
      format: "4セクション｜各100問",
      time: "各120分",
      pass: "各75%正答",
      studyWeeks: "3-4週間",
      advantage: "CPA会計+J-SOX不正リスク経験で45-55%カバー",
    },
  ];

  return (
    <div>
      <SectionTitle>GRC Triple Crown — 3資格同時合格アプリ</SectionTitle>

      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.navy} 100%)`,
          borderRadius: "16px",
          padding: "2rem",
          color: "#fff",
          marginBottom: "2rem",
        }}
      >
        <h3
          style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: COLORS.cia }}
        >
          プロダクトビジョン
        </h3>
        <p style={{ lineHeight: 1.8, fontSize: "0.95rem", opacity: 0.95 }}>
          CPA（公認会計士）× ITエンジニア経験を持つプロフェッショナルが、
          <strong style={{ color: COLORS.cia }}>CIA</strong>・
          <strong style={{ color: COLORS.cisa }}>CISA</strong>・
          <strong style={{ color: COLORS.cfe }}>CFE</strong>の3資格を
          <strong style={{ color: "#fbbf24" }}>4〜8週間で同時合格</strong>
          するためのAI駆動型統合学習プラットフォーム。3資格間の知識重複（約40%）を
          AIが自動検出し、一度の学習で複数資格の範囲をカバーする
          「シナジー学習」を実現。最新のFSRS v6アルゴリズムとLLMを統合し、
          従来の累計800〜1,200時間を
          <strong style={{ color: "#fbbf24" }}>200〜350時間に圧縮</strong>する。
          個人の既習レベルに応じてAIがスケジュールを動的に最適化。
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        {exams.map((e) => (
          <div
            key={e.name}
            style={{
              borderRadius: "14px",
              overflow: "hidden",
              border: `2px solid ${e.color}30`,
              background: "#fff",
            }}
          >
            <div
              style={{
                background: e.color,
                color: "#fff",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{e.name}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.85 }}>{e.full}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: "2px" }}>{e.org}</div>
            </div>
            <div style={{ padding: "1rem" }}>
              {[
                ["形式", e.format],
                ["時間", e.time],
                ["合格基準", e.pass],
                ["想定期間", e.studyWeeks],
                ["CPA+IT優位性", e.advantage],
              ].map(([k, v], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.35rem 0",
                    borderBottom: i < 4 ? "1px solid #f3f4f6" : "none",
                    fontSize: "0.78rem",
                  }}
                >
                  <span style={{ color: "#9ca3af", fontWeight: 600 }}>{k}</span>
                  <span style={{ color: COLORS.dark, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card style={{ background: "#fffbeb", border: "1px solid #fbbf24" }}>
        <h4 style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.75rem" }}>
          💡 CPA × ITエンジニアの圧倒的アドバンテージ
        </h4>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#92400e" }}>
          CPA保有で財務会計・監査・内部統制・不正リスク評価の知識ベースがあり、
          IBM出身のITエンジニア経験でIT統制・情報セキュリティ・システム監査の実務理解がある。
          さらにEY AI Labでの製品開発・PwCでのGRCアドバイザリ経験が加わることで、
          3資格すべてにおいて「実務感覚」が既に備わっている。
          このプロファイルは3資格同時短期合格の最適候補者。
        </p>
      </Card>
    </div>
  );
}

// ─── Section: Synergy ───

function SynergySection() {
  const overlaps = [
    {
      topic: "内部統制 / COSO フレームワーク",
      certs: ["CIA", "CISA", "CFE"],
      coverage: 92,
      note: "CIA Part1&3 + CISA Domain2 + CFE Prevention。CPAで完全既習。1回の学習で3資格対応。",
    },
    {
      topic: "リスクマネジメント / ERM",
      certs: ["CIA", "CISA", "CFE"],
      coverage: 88,
      note: "CIA Part1 + CISA Domain2 + CFE Prevention。リスク評価手法は共通、各資格の視点差分だけ学習。",
    },
    {
      topic: "ガバナンス / コーポレートガバナンス",
      certs: ["CIA", "CISA", "CFE"],
      coverage: 85,
      note: "CIA Part1 + CISA Domain2 + CFE Prevention。Three Lines Model / COBIT / 取締役会責任が交差。",
    },
    {
      topic: "監査プロセス・手法",
      certs: ["CIA", "CISA"],
      coverage: 82,
      note: "CIA Part2 + CISA Domain1。監査計画→実施→報告の流れは共通。IS監査固有手法が差分。",
    },
    {
      topic: "不正 / Fraud リスク",
      certs: ["CIA", "CFE"],
      coverage: 80,
      note: "CIA Part1 Section D + CFE全セクション。CIA は検出観点、CFEは調査・防止まで深掘り。",
    },
    {
      topic: "IT統制・情報セキュリティ",
      certs: ["CIA", "CISA"],
      coverage: 78,
      note: "CIA Part3 Section B + CISA Domain4&5。CISAが深い。ITエンジニア経験が最大活用される領域。",
    },
    {
      topic: "法規制・コンプライアンス",
      certs: ["CISA", "CFE"],
      coverage: 65,
      note: "CISA Domain2 + CFE Law。IT関連法規と不正関連法の差分学習が必要。",
    },
    {
      topic: "財務会計・取引分析",
      certs: ["CFE"],
      coverage: 95,
      note: "CFE Financial Transactions。CPA知識で95%カバー。仕訳不正パターンの追加学習のみ。",
    },
    {
      topic: "データ分析・CAAT",
      certs: ["CIA", "CISA"],
      coverage: 75,
      note: "CIA Part2&3 + CISA Domain1。データ分析ツール・手法はPwCでの日常業務。",
    },
    {
      topic: "事業継続・災害復旧",
      certs: ["CISA"],
      coverage: 70,
      note: "CISA Domain4。BCP/DRP特化。ITエンジニア経験で基礎はカバー済み。",
    },
  ];

  return (
    <div>
      <SectionTitle>3資格シナジーマップ — 重複知識の一括学習</SectionTitle>

      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.navy})`,
          borderRadius: "16px",
          padding: "2rem",
          color: "#fff",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ fontWeight: 700, color: "#fbbf24", marginBottom: "1rem", fontSize: "1.1rem" }}>
          📊 知識重複率の分析結果
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { pair: "CIA ∩ CISA", pct: "35-40%", desc: "監査プロセス、ガバナンス、IT統制" },
            { pair: "CIA ∩ CFE", pct: "25-30%", desc: "不正リスク、内部統制、ガバナンス" },
            { pair: "CISA ∩ CFE", pct: "15-20%", desc: "法規制、リスク管理、コンプライアンス" },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fbbf24" }}>{item.pct}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, marginTop: "0.25rem" }}>{item.pair}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.25rem" }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1.25rem", fontSize: "0.88rem", opacity: 0.9, textAlign: "center" }}>
          🎯 3資格の純粋な独自領域は全体の約<strong style={{ color: "#fbbf24" }}>40%</strong>
          → 共通知識を1回で学習し、差分のみ追加学習することで学習量を<strong style={{ color: "#fbbf24" }}>60%削減</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {overlaps.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.85rem 1rem",
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ minWidth: "44px", textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: COLORS.shared }}>{item.coverage}%</div>
              <div style={{ fontSize: "0.55rem", color: "#9ca3af" }}>既習率</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: COLORS.dark }}>{item.topic}</span>
                {item.certs.map((c) => (
                  <Badge key={c} text={c} color={c === "CIA" ? COLORS.cia : c === "CISA" ? COLORS.cisa : COLORS.cfe} />
                ))}
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.5, margin: 0 }}>{item.note}</p>
            </div>
            <div style={{ minWidth: "80px" }}>
              <div
                style={{
                  height: "6px",
                  background: "#e5e7eb",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${item.coverage}%`,
                    height: "100%",
                    background: item.coverage >= 85 ? COLORS.shared : item.coverage >= 70 ? "#fbbf24" : COLORS.cia,
                    borderRadius: "3px",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Exams ───

function ExamsSection() {
  const [activeExam, setActiveExam] = useState("cia");

  const examsData = {
    cia: {
      name: "CIA",
      color: COLORS.cia,
      parts: [
        {
          name: "Part 1: Internal Audit Fundamentals（内部監査の基本）",
          spec: "125問 / 150分 ｜ 合格: 600/750",
          sections: [
            { name: "A. 内部監査の目的と権限", weight: "35-45%", cpa: "中", it: "低" },
            { name: "B. 倫理と職業専門性", weight: "20-30%", cpa: "高", it: "低" },
            { name: "C. ガバナンスとリスクマネジメント", weight: "15-25%", cpa: "高", it: "中" },
            { name: "D. 不正リスク", weight: "10-15%", cpa: "高", it: "低" },
          ],
        },
        {
          name: "Part 2: Practice of Internal Auditing（内部監査の実務）",
          spec: "100問 / 120分 ｜ 合格: 600/750",
          sections: [
            { name: "A. 監査計画", weight: "30-40%", cpa: "中", it: "低" },
            { name: "B. 監査業務の実施", weight: "30-40%", cpa: "中", it: "中" },
            { name: "C. 監査結果と改善", weight: "25-35%", cpa: "低", it: "低" },
          ],
        },
        {
          name: "Part 3: Business Knowledge for IA（ビジネス知識）",
          spec: "100問 / 120分 ｜ 合格: 600/750",
          sections: [
            { name: "A. 一般的なビジネスプロセス", weight: "35-45%", cpa: "高", it: "中" },
            { name: "B. 情報テクノロジー", weight: "25-35%", cpa: "低", it: "高" },
            { name: "C. 財務管理", weight: "15-25%", cpa: "高", it: "低" },
            { name: "D. 組織行動", weight: "5-10%", cpa: "低", it: "低" },
          ],
        },
      ],
    },
    cisa: {
      name: "CISA",
      color: COLORS.cisa,
      parts: [
        {
          name: "全体: 5ドメイン統合試験",
          spec: "150問 / 240分 ｜ 合格: 450/800",
          sections: [
            { name: "D1. 情報システム監査プロセス", weight: "21%", cpa: "中", it: "高" },
            { name: "D2. ITのガバナンスとマネジメント", weight: "17%", cpa: "中", it: "高" },
            { name: "D3. IS取得・開発・実装", weight: "12%", cpa: "低", it: "高" },
            { name: "D4. IS運用とビジネスレジリエンス", weight: "23%", cpa: "低", it: "高" },
            { name: "D5. 情報資産の保護", weight: "27%", cpa: "低", it: "高" },
          ],
        },
      ],
    },
    cfe: {
      name: "CFE",
      color: COLORS.cfe,
      parts: [
        {
          name: "全体: 4セクション独立試験",
          spec: "各100問×4 / 各120分 ｜ 合格: 各75%",
          sections: [
            { name: "S1. 財務取引と不正スキーム", weight: "25%", cpa: "高", it: "低" },
            { name: "S2. 法律（Law）", weight: "25%", cpa: "低", it: "低" },
            { name: "S3. 調査（Investigation）", weight: "25%", cpa: "低", it: "中" },
            { name: "S4. 不正防止と抑止", weight: "25%", cpa: "中", it: "低" },
          ],
        },
      ],
    },
  };

  const exam = examsData[activeExam];

  const coverBadge = (level, type) => {
    const label = type === "cpa" ? "CPA" : "IT";
    const colors = {
      高: { bg: "#dcfce7", color: "#166534" },
      中: { bg: "#fef9c3", color: "#854d0e" },
      低: { bg: "#fee2e2", color: "#991b1b" },
    };
    const c = colors[level];
    return (
      <span style={{ display: "inline-block", background: c.bg, color: c.color, padding: "1px 8px", borderRadius: "12px", fontSize: "0.65rem", fontWeight: 700 }}>
        {label}:{level}
      </span>
    );
  };

  return (
    <div>
      <SectionTitle>試験詳細マップ（2025年新シラバス対応）</SectionTitle>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {Object.entries(examsData).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setActiveExam(key)}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: activeExam === key ? `2px solid ${val.color}` : "2px solid #e5e7eb",
              borderRadius: "10px",
              background: activeExam === key ? val.color : "#fff",
              color: activeExam === key ? "#fff" : "#6b7280",
              fontWeight: 800,
              fontSize: "1.1rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {val.name}
          </button>
        ))}
      </div>

      {exam.parts.map((part, pi) => (
        <Card key={pi} style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: exam.color }}>{part.name}</h3>
          </div>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "1rem", background: "#f9fafb", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
            {part.spec}
          </div>
          {part.sections.map((sec, si) => (
            <div key={si} style={{ padding: "0.75rem 0", borderBottom: si < part.sections.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: COLORS.dark }}>{sec.name}</span>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600 }}>{sec.weight}</span>
                  {coverBadge(sec.cpa, "cpa")}
                  {coverBadge(sec.it, "it")}
                </div>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ─── Section: Science ───

function ScienceSection() {
  return (
    <div>
      <SectionTitle>脳科学・認知科学エンジン</SectionTitle>

      <Card style={{ background: "#f0f9ff", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cisa, marginBottom: "1rem" }}>
          🔬 FSRS v6 — 3資格統合スケジューリング
        </h3>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#374151", marginBottom: "1rem" }}>
          3資格の全学習カードを単一のFSRSエンジンで管理。資格間の共通カード（例: COSO内部統制）は
          1枚のカードで3資格分の学習効果を発揮。Difficulty（難易度）・Stability（記憶安定性）・
          Retrievability（想起確率）の3変数DSRモデルにより、1,500〜2,000枚のカードを
          最適なタイミングで復習スケジューリング。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { label: "Phase 1（Week 1-2）", ret: "0.82", note: "新規カード大量投入期。復習回数を抑え、広範囲カバー優先" },
            { label: "Phase 2（Week 2-3）", ret: "0.88", note: "弱点集中期。高頻度復習で定着率を引き上げ" },
            { label: "Phase 3（Week 3-4）", ret: "0.93", note: "試験直前期。高保持率で全範囲の記憶を確保" },
          ].map((p, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontWeight: 800, color: COLORS.cisa, fontSize: "0.9rem" }}>{p.label}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.dark, margin: "0.5rem 0" }}>
                R = {p.ret}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5 }}>{p.note}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {[
          {
            title: "クロス資格インターリーブ",
            desc: "CIA→CISA→CFEの問題を混ぜて出題。「内部統制の有効性評価」というテーマで、CIA視点の問題→CISA視点の問題→CFE視点の問題と連続出題し、同一概念の多面的理解を促進。研究によりブロック学習より15-20%高い定着率。",
            icon: "🔀",
          },
          {
            title: "概念ブリッジング",
            desc: "3資格で異なる用語で同じ概念を指す場合（例: CIAの'アシュアランス'= CISAの'保証'= CFEの'内部統制評価'）、AIが自動的に対応表を生成し、1つの理解で3つの試験に対応できるメンタルモデルを構築。",
            icon: "🌉",
          },
          {
            title: "精緻化質問（Elaborative Interrogation）",
            desc: "不正解時に「なぜこの答えが正しいと思ったのか？」「CPA試験ではこう答えるが、CIA試験ではなぜ違うのか？」とAIが深掘り。自己説明効果（Chi et al., 1989）により単純な正誤フィードバックの2倍の記憶定着。",
            icon: "❓",
          },
          {
            title: "認知負荷管理",
            desc: "3資格同時学習の認知負荷を管理。1セッション内では同一テーマの複数資格問題をクラスタリングし、文脈スイッチコストを最小化。疲労検知（正答率・回答時間の低下）で自動的にセッション切替を提案。",
            icon: "⚖️",
          },
          {
            title: "睡眠統合×3資格サイクル",
            desc: "就寝前30分の復習で「今日メインで学んだ資格」の重要カードを集中復習。翌朝は「昨日のサブ資格」のテスト。13-27回の睡眠サイクルを最大限活用し、Day N夜に学んだ内容をDay N+1朝に検索練習で強化。",
            icon: "🌙",
          },
          {
            title: "望ましい困難の段階制御",
            desc: "各資格・セクション別に正答率60-80%のZone of Proximal Developmentを維持。簡単すぎる問題はスキップ、難しすぎる問題はAI解説後に易化版を再出題。3資格それぞれで最適な困難度を独立管理。",
            icon: "🎚️",
          },
          {
            title: "アクティブリコール強化",
            desc: "Karpicke (2011) のテスト効果研究に基づき、選択肢なし自由記述→選択肢あり→正誤判定の3段階出題。読む時間を減らしテストする時間を増やす比率を最適化（Roediger & Butler, 2011）。単純な再読の3倍の長期記憶定着効果。",
            icon: "🧠",
          },
          {
            title: "デュアルコーディング",
            desc: "Paivio (1986) の二重符号化理論に基づき、概念を文字＋図解＋音声の3チャネルで同時符号化。COSOフレームワークなら「テキスト解説→フローチャートスライド→音声要約」の三重学習。単一チャネルの1.5〜2倍の記憶定着率。",
            icon: "👁️",
          },
          {
            title: "メタ認知トレーニング",
            desc: "Dunlosky (2013) の研究に基づき、回答前に「自信度」を予測→答え合わせ→キャリブレーション分析。過信（自信度>正答率）と過小評価（自信度<正答率）を検出し、「知ってると思い込んでいる」危険領域を可視化。",
            icon: "🪞",
          },
          {
            title: "ポモドーロ＋休憩最適化",
            desc: "25分集中→5分休憩の自動タイマー。4セット後は15〜30分の長休憩。休憩中はマインドワンダリングを誘導し、デフォルトモードネットワーク（DMN）による無意識の記憶統合を促進。学習効率の持続と燃え尽き防止。",
            icon: "⏱️",
          },
          {
            title: "身体化認知 × 手書き入力",
            desc: "Barsalou (2008) の身体化認知理論に基づき、監査プロセスフロー等はジェスチャー/手書き入力で学習。手書きはタイピングより記憶定着率が高い（Mueller & Oppenheimer, 2014）。スマホ手書きモードで図解・フロー作成も対応。",
            icon: "✍️",
          },
          {
            title: "間隔伸長検索練習",
            desc: "Landauer & Bjork (1978) の研究に基づき、同一セッション内でも間隔を置いて再出題。新規学習カードを5問後→15問後→30問後に再テスト。FSRSの日単位スケジューリングを補完するセッション内マイクロスペーシング。",
            icon: "📐",
          },
        ].map((item, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.3rem" }}>{item.icon}</span>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: COLORS.dark }}>{item.title}</h4>
            </div>
            <p style={{ fontSize: "0.8rem", lineHeight: 1.7, color: "#555", margin: 0 }}>{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Section: AI ───

function AISection() {
  return (
    <div>
      <SectionTitle>AI機能設計（LLM統合）</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
        {[
          {
            icon: "🎓",
            title: "マルチ資格AI Tutor + レベル別解説",
            color: COLORS.cia,
            features: [
              "解説レベル6段階切替: Lv1小学生(たとえ話)→Lv2中学生(身近な例)→Lv3高校生(図解)→Lv4大学生(学術根拠)→Lv5社会人(実務ケース)→Lv6CPA/専門家(差分のみ)",
              "デフォルトLv6（CPA既習前提）、理解不足時に長押し→レベル下げで再説明",
              "AIが正答率から自動レベル調整（セクション単位で最適レベルを記憶）",
              "CPA→CIA / CPA→CISA / CPA→CFE の知識ブリッジ解説を自動提供",
              "3資格間の「紛らわしい違い」（用語・基準・アプローチの差異）を比較表で整理",
              "ソクラテス式対話で不正解の根本原因を掘り下げ、表面的暗記を防止",
            ],
          },
          {
            icon: "📝",
            title: "統合問題生成エンジン",
            color: COLORS.cisa,
            features: [
              "3資格のシラバス全セクションに対応した問題をLLMが無限生成",
              "シナジー問題: 1問で複数資格の知識を横断的にテスト",
              "IIA/ISACA/ACFEの公式出題スタイルを学習したプロンプト設計",
              "難易度3段階（基礎→応用→本番）+ 資格別の合格ライン予測",
            ],
          },
          {
            icon: "🗺️",
            title: "統合知識グラフ",
            color: COLORS.cfe,
            features: [
              "3資格の全トピックを統合したナレッジグラフ（約500ノード）",
              "共通ノードは1つに統合し、資格固有のエッジで差分を可視化",
              "CPA既習ノード自動検出 + ITエンジニア既習ノード自動検出",
              "「あと何ノードマスターすれば合格圏」をリアルタイム表示",
            ],
          },
          {
            icon: "🔮",
            title: "合格確率予測エンジン",
            color: COLORS.shared,
            features: [
              "各資格のパート/セクション別に現時点の推定スコアをリアルタイム算出",
              "「あと○時間の学習で合格確率△%→□%」の学習投資対効果を提示",
              "3資格の受験順序最適化提案（シナジー効果を最大化する受験順）",
              "弱点トピックの優先順位付け（3資格横断でROIが最も高い学習領域を特定）",
            ],
          },
          {
            icon: "💬",
            title: "RAG強化型Q&A",
            color: COLORS.dark,
            features: [
              "IIA Global Standards / ISACA COBIT・ITIL / ACFE Fraud Examiners ManualをRAGソースとして搭載",
              "「CISAのDomain5で出るISO27001の要点は？」のような横断質問に対応",
              "日本の実務（J-SOX、金融検査マニュアル、個人情報保護法）との比較解説",
              "質問から類似既出問題を検索し、関連する練習問題を推薦",
            ],
          },
          {
            icon: "📊",
            title: "学習分析ダッシュボード",
            color: COLORS.navy,
            features: [
              "3資格×各セクションのマスタリー率をヒートマップで一覧表示",
              "学習時間配分の最適化提案（「CISAのD5にあと2h配分すべき」等）",
              "忘却予測: 「3日後にCIA Part1のSection Aの記憶が危険水準に低下」",
              "メタ認知分析: 自信度と正答率の乖離から過信/過小評価を検出",
            ],
          },
        ].map((item, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: item.color }}>{item.title}</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {item.features.map((f, j) => (
                <li key={j} style={{ fontSize: "0.78rem", lineHeight: 1.7, color: "#555", marginBottom: "0.3rem" }}>{f}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.navy})`, borderRadius: "12px", padding: "1.5rem", color: "#fff" }}>
        <h4 style={{ fontWeight: 700, marginBottom: "1rem", color: "#fbbf24" }}>LLM技術仕様</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.82rem" }}>
          {[
            ["モデル構成", "Sonnet 4.5（問題生成・解説） + Haiku 4.5（チャット・即応）"],
            ["RAGソース", "IIA Standards / COBIT / ITIL / ISO27001 / COSO / Fraud Examiners Manual / 日本法規"],
            ["カード総数", "共通カード約600枚 + CIA固有400枚 + CISA固有500枚 + CFE固有400枚 ≈ 1,900枚"],
            ["問題生成速度", "< 2秒/問 + 解説生成 < 3秒 + 比較表生成 < 5秒"],
            ["品質保証", "LLM-as-Judge方式で正答検証 + 専門家レビュー済みコアカード"],
            ["多言語", "日本語メイン + 原文英語の切替表示（用語の正確性確保）"],
          ].map(([k, v], i) => (
            <div key={i} style={{ lineHeight: 1.7 }}>
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>{k}: </span>
              <span style={{ opacity: 0.9 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: UI ───

function UISection() {
  return (
    <div>
      <SectionTitle>UI/UX設計 — マルチ資格対応</SectionTitle>

      <Card style={{ marginBottom: "1.5rem", background: "#f8fafc" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1rem" }}>
          📱 メイン画面構成（スマートフォン最適化 + PWA）
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { n: "① 統合ダッシュボード", d: "3資格の進捗リング、今日のタスク、合格確率、残り日数。資格別タブ切替。「今日の最適学習」ワンタップ起動" },
            { n: "② 学習セッション", d: "資格カラー（赤/青/紫）で識別。25問/セッション。スワイプ操作。正解→AI解説→自信度評価→FSRS更新" },
            { n: "③ シナジーモード", d: "共通テーマで3資格横断出題。「ガバナンス特訓」等のテーマ別学習。概念の多面的理解を促進" },
            { n: "④ 統合知識マップ", d: "3色ノードの統合グラフ。習熟度色分け。タップで詳細+関連問題。ピンチ/パンでナビゲーション" },
            { n: "⑤ AI Tutorチャット", d: "学習中に即アクセス。「これCISAではどう出る？」等の横断質問対応。音声入力OK" },
            { n: "⑥ 模擬試験", d: "各資格の本番形式フルシミュレーション。タイマー付き。終了後にAI詳細分析レポート" },
            { n: "⑦ 復習キュー", d: "FSRS判定の「今日復習すべきカード」。資格別/統合のフィルタ。残り枚数+推定時間" },
            { n: "⑧ 受験戦略パネル", d: "3資格の受験順序提案、各試験のスコア予測、時間配分戦略、試験日カウントダウン" },
            { n: "⑨ 弱点ヒートマップ", d: "3資格×全セクションのマトリクス。赤い領域をタップすると集中トレーニング開始" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "8px", padding: "0.85rem", border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.dark, marginBottom: "0.3rem" }}>{s.n}</div>
              <p style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Card>
          <h4 style={{ fontWeight: 700, color: COLORS.navy, marginBottom: "0.75rem", fontSize: "0.95rem" }}>🎮 ゲーミフィケーション</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem" }}>
            {[
              "🏆 Triple Crown トラッカー（3資格合格バッジ収集）",
              "🔥 資格別＋統合の連続学習ストリーク",
              "💎 シナジー学習ボーナス（共通カードで3資格XP獲得）",
              "📈 3資格合格確率のリアルタイムレース表示",
              "⚡ スピード正答ボーナス + パーフェクトセッション称号",
              "🗓️ デイリーミッション（3資格バランス学習の達成報酬）",
            ].map((g, i) => (
              <div key={i} style={{ padding: "0.4rem 0.6rem", background: "#f9fafb", borderRadius: "6px" }}>{g}</div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 style={{ fontWeight: 700, color: COLORS.navy, marginBottom: "0.75rem", fontSize: "0.95rem" }}>⚡ UX原則</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem" }}>
            {[
              ["ワンタップ学習開始", "AIが最適な資格・セクションを選択して即セッション開始"],
              ["マイクロセッション", "5分の隙間で5問。通勤電車でCISA→昼休みにCIA→夜にCFE"],
              ["スマートオフライン", "今日〜3日分のカード＋音声を優先プリキャッシュ。Wi-Fi時にフル同期。飛行機内でも学習可能"],
              ["資格別カラーコーディング", "CIA=赤、CISA=青、CFE=紫。瞬時に今の学習対象を認識"],
              ["進捗の常時可視化", "各資格の合格までの残り距離を常に表示"],
            ].map(([t, d], i) => (
              <div key={i}>
                <span style={{ fontWeight: 700, color: COLORS.dark }}>{t}: </span>
                <span style={{ color: "#555" }}>{d}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section: Tech ───

function TechSection() {
  return (
    <div>
      <SectionTitle>技術アーキテクチャ</SectionTitle>

      {/* MVP vs Scale 比較 */}
      <Card style={{ background: "#fffbeb", border: "1px solid #fbbf24", marginBottom: "1.5rem" }}>
        <h4 style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.5rem" }}>MVP → Scale 段階的アーキテクチャ方針</h4>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "#92400e", margin: 0 }}>
          初期はPostgreSQL（+pgvector）1本で全データ管理。専用ベクトルDB・知識グラフDBは
          ユーザー数・データ量の増加に応じて段階的に分離する。下図はMVP構成。
          エンタープライズ基盤セクションにScale構成を記載。
        </p>
      </Card>

      <div style={{ background: COLORS.dark, borderRadius: "16px", padding: "1.5rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "2rem", overflow: "auto" }}>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`┌─────────────────────────────────────────────────────────────────┐
│                 クライアント層（MVP: Web優先）                     │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Next.js 15 (Web) │  │ PWA + Service Worker                │  │
│  │ App Router + SSR  │  │ オフライン FSRS(WASM) + カードキャッシュ│  │
│  └────────┬─────────┘  └──────────────┬──────────────────────┘  │
│           └───────────────────────────┘                          │
│                         ▼                                        │
│               REST API + WebSocket (SSE for streaming)           │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              バックエンド層 (FastAPI + LangGraph)                  │
│                                                                  │
│  ┌─────────────┐  ┌───────────────┐  ┌───────────────────────┐  │
│  │ FSRS Engine │  │ LLM Orch.     │  │ Synergy Engine       │  │
│  │ (Rust/WASM) │  │ (LangGraph)   │  │ (Cross-Cert Mapper)  │  │
│  │ 統合SRS管理  │  │ 問題生成/解説  │  │ 知識グラフ(SQL CTE)   │  │
│  └─────────────┘  └───────────────┘  └───────────────────────┘  │
│  ┌─────────────┐  ┌───────────────┐  ┌───────────────────────┐  │
│  │ RAG Pipeline│  │ Score Predict │  │ Quality Validator    │  │
│  │ (pgvector)  │  │ (XGBoost)     │  │ (LLM-as-Judge)      │  │
│  │ 3資格文書検索│  │ 合格確率予測   │  │ 問題品質検証          │  │
│  └─────────────┘  └───────────────┘  └───────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              データ層（MVP: PostgreSQL 統合）                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PostgreSQL 16 + pgvector                                  │   │
│  │ ・ユーザー/学習履歴/FSRS状態  (リレーショナル)              │   │
│  │ ・RAGベクトル検索             (pgvector HNSW index)       │   │
│  │ ・知識グラフ                  (再帰CTE + JSONB)           │   │
│  │ ・セッションキャッシュ         (UNLOGGED TABLE or in-memory)│   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────────────────────────────┐     │
│  │ S3 / R2      │  │ Scale時追加:                          │     │
│  │ 音声/スライド │  │ → Redis (キャッシュ/Celery broker)    │     │
│  │ 静的アセット  │  │ → 専用ベクトルDB (Qdrant/Pinecone)   │     │
│  └──────────────┘  │ → React Native (モバイルアプリ)       │     │
│                     └──────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘`}</pre>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { title: "フロントエンド", items: [
            "React Native + Expo（iOS/Android統合）",
            "Next.js 15 App Router（Web版 SSR + ISR）",
            "PWA: オフラインFSRS計算（WASM）+ Service Worker",
            "資格別テーマシステム（動的カラー切替）",
            "Storybook: UIコンポーネントカタログ",
            "Vitest + React Testing Library + Playwright (E2E)",
          ]},
          { title: "バックエンド", items: [
            "FastAPI (Python 3.12) + Pydantic v2 (型安全)",
            "LangGraph: マルチエージェントLLMオーケストレーション",
            "fsrs-rs (Rust) → WASM for クライアントサイド",
            "Celery + Redis: 非同期問題プリ生成",
            "Alembic: DBマイグレーション管理",
            "pytest + TestContainers: テスト自動化",
          ]},
          { title: "AI / ML", items: [
            "Claude API (Sonnet 4.5 + Haiku 4.5) via AWS Bedrock",
            "Multi-RAG: pgvector + 3資格×基準文書別パイプライン",
            "D3.js / Cytoscape: 統合知識グラフ可視化（500+ノード）",
            "XGBoost on SageMaker: 合格スコア予測モデル",
            "Prompt管理: バージョン管理 + A/Bテスト基盤",
            "LLM-as-Judge: 生成品質の自動評価パイプライン",
          ]},
          { title: "インフラ・運用", items: [
            "AWS ECS Fargate (本番) + Docker Compose (開発)",
            "Terraform: IaCによる全リソース管理",
            "GitHub Actions: CI/CD + Semantic Release",
            "Datadog APM + CloudWatch + Sentry",
            "ArgoCD: GitOpsデプロイ",
            "→ 詳細は「エンタープライズ基盤」「DevOps/SRE」セクション参照",
          ]},
        ].map((cat, i) => (
          <Card key={i} style={{ background: "#f8fafc" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{cat.title}</h4>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {cat.items.map((item, j) => (
                <li key={j} style={{ fontSize: "0.78rem", color: "#555", lineHeight: 1.7, marginBottom: "0.2rem" }}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* API設計 */}
      <Card style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1rem" }}>API設計原則</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "REST API設計", items: ["OpenAPI 3.1 仕様書駆動開発", "バージョニング: /api/v1/ パスベース", "ページネーション: Cursor-based", "レスポンス: JSON:API or 統一エンベロープ形式"] },
            { title: "リアルタイム通信", items: ["WebSocket: 学習セッション中の即時フィードバック", "Server-Sent Events: 進捗通知・AI生成ストリーミング", "Heartbeat: 接続状態監視 + 自動再接続", "オフライン→オンライン同期キュー (CRDT)"] },
            { title: "API品質", items: ["Rate Limiting: ユーザー別 + エンドポイント別", "リトライ: 指数バックオフ + ジッター", "Circuit Breaker: LLM API障害時のフォールバック", "API Gateway: Kong or AWS API Gateway"] },
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f0f4ff", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* テスト戦略 */}
      <Card>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1rem" }}>テスト戦略（テストピラミッド）</h3>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`                    ▲
                   / \\        E2E Tests (Playwright)
                  / 5% \\       ユーザーシナリオ: 学習フロー全体
                 /───────\\
                /         \\   Integration Tests (TestContainers)
               /   15%     \\   API + DB + Redis + LLM Mock
              /─────────────\\
             /               \\ Unit Tests (pytest + Vitest)
            /      80%        \\ ビジネスロジック: FSRS計算, 問題生成, スコア予測
           /───────────────────\\

  カバレッジ目標: 全体≥80% / 新規コード≥90% / FSRS Engine=100%
  実行速度: Unit<5min / Integration<10min / E2E<15min`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "テスト自動化", items: ["pre-commit: lint + type-check + 関連ユニットテスト", "PR: 全テストスイート並列実行 (GitHub Actions)", "Nightly: E2E + パフォーマンステスト + セキュリティスキャン", "Visual Regression: Chromatic (Storybook連携)"] },
            { title: "品質メトリクス", items: ["Codecov: カバレッジレポート + PR差分表示", "SonarQube: コード品質・技術的負債の可視化", "Lighthouse CI: Web Vitals (LCP/FID/CLS) の自動計測", "k6: 負荷テスト (目標: 1000 concurrent users)"] },
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Enterprise ───

function EnterpriseSection() {
  return (
    <div>
      <SectionTitle>エンタープライズ基盤設計</SectionTitle>

      {/* Git戦略 */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🌿</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.navy }}>Git ブランチ戦略 — GitFlow + Trunk-Based Hybrid</h3>
        </div>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`┌─────────────────────────────────────────────────────────────┐
│  Git Branch Strategy (GitFlow + Trunk-Based Hybrid)         │
│                                                             │
│  main ─────●─────────●─────────●──────── (本番リリース)      │
│            ↑         ↑         ↑                            │
│  release/  ──●──●────┘    ──●──┘  (リリース候補・QA)         │
│             ↑  ↑            ↑                               │
│  develop ●──●──●──●──●──●──●──●──●──── (統合ブランチ)        │
│          ↑  ↑     ↑     ↑     ↑                             │
│  feature/ feat/   feat/  feat/  feat/                       │
│          fsrs-v6  ai-    slide  enterprise                  │
│                   tutor  gen    auth                        │
│                                                             │
│  hotfix/ ─────────────────●──→ main (緊急修正)               │
│                                                             │
│  命名規則:                                                   │
│  feature/<ticket-id>-<short-desc>  例: feature/GRC-123-fsrs │
│  bugfix/<ticket-id>-<short-desc>   例: bugfix/GRC-456-score │
│  release/v<major>.<minor>.<patch>  例: release/v1.2.0       │
│  hotfix/v<major>.<minor>.<patch>   例: hotfix/v1.2.1        │
└─────────────────────────────────────────────────────────────┘`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "ブランチ保護ルール", items: ["main/develop への直接push禁止", "PR必須 + 最低1名レビュー承認", "CI全パス必須（テスト・リント・型チェック）", "Squash merge推奨（クリーンな履歴）"] },
            { title: "コミット規約", items: ["Conventional Commits準拠 (feat/fix/docs/refactor/test/ci)", "コミットメッセージにチケットID必須: feat(fsrs): GRC-123 add v6 engine", "pre-commit hook: commitlint + lint-staged", "Semantic Release による自動バージョニング"] },
            { title: "コードレビュー基準", items: ["CODEOWNERS で領域別レビュアー自動アサイン", "レビューチェックリスト: セキュリティ/パフォーマンス/テスト", "AI Code Review (Claude) による自動事前レビュー", "レビュー応答SLA: 24時間以内"] },
            { title: "モノレポ構成", items: ["Turborepo or Nx によるモノレポ管理", "packages/: shared-types, ui-components, fsrs-engine", "apps/: web(Next.js), mobile(RN), api(FastAPI)", "affected コマンドで変更範囲のみビルド・テスト"] },
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.dark, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Docker / コンテナ */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🐳</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cisa }}>Docker コンテナ設計</h3>
        </div>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`# docker-compose.yml — 開発環境
services:
  ┌─────────────────────────────────────────────────────────┐
  │ api         │ FastAPI + LangGraph                       │
  │             │ Python 3.12-slim / マルチステージビルド      │
  │             │ Port: 8000  │ Health: /api/v1/health       │
  ├─────────────┼───────────────────────────────────────────┤
  │ web         │ Next.js 15 (SSR + Static)                 │
  │             │ node:22-alpine / standalone output         │
  │             │ Port: 3000  │ Health: /api/health          │
  ├─────────────┼───────────────────────────────────────────┤
  │ worker      │ Celery Worker (問題プリ生成/RAG indexing)   │
  │             │ Same image as api / concurrency=4          │
  ├─────────────┼───────────────────────────────────────────┤
  │ db          │ PostgreSQL 16 + pgvector                  │
  │             │ Port: 5432  │ Volume: pgdata              │
  ├─────────────┼───────────────────────────────────────────┤
  │ redis       │ Redis 7 (キャッシュ + Celery broker)       │
  │             │ Port: 6379  │ maxmemory: 512mb            │
  ├─────────────┼───────────────────────────────────────────┤
  │ meilisearch │ Meilisearch (全文検索 / カード検索)         │
  │             │ Port: 7700  │ Volume: meili_data           │
  └─────────────┴───────────────────────────────────────────┘

# Dockerfile ベストプラクティス
- マルチステージビルド（ビルド層 → 実行層の分離）
- non-root ユーザー実行（セキュリティ）
- .dockerignore で不要ファイル除外
- レイヤーキャッシュ最適化（依存→コードの順）
- HEALTHCHECK 命令でコンテナ自己診断
- イメージサイズ: API < 200MB, Web < 150MB`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "開発環境 (dev)", items: ["docker compose up で1コマンド起動", "ホットリロード（bind mount）", "シードデータ自動投入", "VS Code Dev Containers対応"] },
            { title: "ステージング (stg)", items: ["本番同等のコンテナ構成", "E2Eテスト自動実行", "パフォーマンステスト実施", "本番DBのサニタイズドコピー"] },
            { title: "本番 (prod)", items: ["イメージタグ: git SHA + semantic ver", "Distroless / Alpine ベース", "Read-only filesystem", "リソース制限 (CPU/Memory limits)"] },
          ].map((env, i) => (
            <div key={i} style={{ background: "#f0f9ff", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.cisa, marginBottom: "0.5rem" }}>{env.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {env.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* クラウドアーキテクチャ */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>☁️</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cfe }}>クラウドアーキテクチャ — AWS Primary / GCP Secondary</h3>
        </div>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`┌─────────────────────────────────────────────────────────────────────┐
│                        AWS クラウドアーキテクチャ                      │
│                                                                     │
│  ┌──── Internet ────┐                                               │
│  │  CloudFront CDN  │ ← 静的アセット + Next.js ISR キャッシュ          │
│  │  + WAF + Shield  │ ← DDoS防御 + Bot対策 + Rate Limiting          │
│  └────────┬─────────┘                                               │
│           ▼                                                          │
│  ┌──── ALB ─────────────────────────────────────────────────┐       │
│  │  Application Load Balancer                                │       │
│  │  Path-based routing: /api/* → API, /* → Web              │       │
│  │  SSL/TLS終端 + ヘルスチェック                               │       │
│  └────┬──────────────┬──────────────────────────────────────┘       │
│       ▼              ▼                                               │
│  ┌─── ECS Fargate ──────────────────────────────────────────┐       │
│  │                                                           │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │       │
│  │  │ API Svc  │  │ Web Svc  │  │ Worker   │  │ Scheduler│ │       │
│  │  │ FastAPI  │  │ Next.js  │  │ Celery   │  │ Beat     │ │       │
│  │  │ 2-8 task │  │ 2-4 task │  │ 2-6 task │  │ 1 task   │ │       │
│  │  │ CPU:1024 │  │ CPU:512  │  │ CPU:1024 │  │ CPU:256  │ │       │
│  │  │ Mem:2048 │  │ Mem:1024 │  │ Mem:2048 │  │ Mem:512  │ │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │       │
│  │  Auto Scaling: CPU>70% or RequestCount based              │       │
│  └───────────────────────────────────────────────────────────┘       │
│                                                                      │
│  ┌──── データ層 ────────────────────────────────────────────┐        │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │        │
│  │  │ RDS Aurora │  │ElastiCache │  │ S3                 │ │        │
│  │  │ PostgreSQL │  │ Redis 7    │  │ 音声/スライド/      │ │        │
│  │  │ + pgvector │  │ Cluster    │  │ バックアップ        │ │        │
│  │  │ Multi-AZ   │  │ Multi-AZ   │  │ + CloudFront配信   │ │        │
│  │  │ r6g.large  │  │ r7g.medium │  │ Lifecycle Policy   │ │        │
│  │  └────────────┘  └────────────┘  └────────────────────┘ │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌──── AI/ML層 ────────────────────────────────────────────┐        │
│  │  Claude API (Anthropic)  ← Bedrock or Direct API         │        │
│  │  SageMaker Endpoint      ← XGBoost スコア予測モデル       │        │
│  │  Bedrock Knowledge Base  ← RAG ソース管理                 │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ┌──── 運用層 ─────────────────────────────────────────────┐        │
│  │  CloudWatch  │ X-Ray  │ Secrets Manager │ Parameter Store│        │
│  │  ECR         │ KMS    │ IAM + SCP       │ Config         │        │
│  └──────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "IaC (Infrastructure as Code)", items: [
              "Terraform: AWS/GCPリソースの宣言的管理",
              "tfstate: S3 + DynamoDB でリモートステート管理",
              "環境別ワークスペース: dev / stg / prod",
              "Terraform Cloud or Atlantis でPR連動プラン",
              "モジュール化: networking / ecs / rds / monitoring",
              "ドリフト検知: 定期的な terraform plan 自動実行",
            ]},
            { title: "環境管理", items: [
              "dev: 開発者ごとの検証環境 (コスト最小)",
              "stg: 本番ミラー (週次で本番DBサニタイズド同期)",
              "prod: Multi-AZ + Auto Scaling (高可用性)",
              "feature環境: PRごとに自動プロビジョニング→マージで自動削除",
              "環境変数: AWS Secrets Manager + Parameter Store",
              "設定値の環境差分はTerraform tfvarsで管理",
            ]},
            { title: "コスト最適化", items: [
              "Fargate Spot: Worker/Schedulerで最大70%削減",
              "Aurora Serverless v2: 低トラフィック時に自動スケールダウン",
              "S3 Intelligent-Tiering: 音声/スライドの自動階層化",
              "Reserved Instances: 本番のベースライン分",
              "Claude API: Prompt Caching + Haiku優先ルーティング",
              "月次コスト予算アラート: AWS Budgets + Slack通知",
            ]},
            { title: "マルチリージョン / DR", items: [
              "Primary: ap-northeast-1 (東京)",
              "Secondary: ap-northeast-3 (大阪) — Warm Standby",
              "RDS: クロスリージョンリードレプリカ",
              "S3: クロスリージョンレプリケーション",
              "Route 53: ヘルスチェック＋フェイルオーバールーティング",
              "RTO: 15分 / RPO: 5分 (本番環境)",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#faf5ff", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.cfe, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* データベース設計 */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🗄️</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.shared }}>データベース運用設計</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "マイグレーション", items: ["Alembic (Python): スキーマバージョン管理", "CI/CDでマイグレーション自動実行", "ロールバック手順を全マイグレーションに必須化", "Blue/Green DBマイグレーション（無停止）"] },
            { title: "バックアップ / リカバリ", items: ["Aurora: 自動バックアップ (35日保持)", "PITR (Point-in-Time Recovery) 有効化", "日次: 論理バックアップをS3にエクスポート", "月次: DR環境でのリストア訓練"] },
            { title: "パフォーマンス", items: ["pgvector: HNSW or IVFFlat インデックス", "pg_stat_statements でスロークエリ監視", "Read Replica: 分析クエリの分離", "Connection Pooling: PgBouncer"] },
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f0fdf4", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.shared, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: DevOps ───

function DevOpsSection() {
  return (
    <div>
      <SectionTitle>DevOps / SRE 設計</SectionTitle>

      {/* CI/CD パイプライン */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🔄</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cia }}>CI/CD パイプライン — GitHub Actions</h3>
        </div>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`┌─────────────────────────────────────────────────────────────────────┐
│  CI/CD Pipeline — GitHub Actions + ArgoCD                           │
│                                                                     │
│  ── PR作成 / Push ──────────────────────────────────────────────    │
│  │                                                                  │
│  ▼  [CI] Pull Request Checks (並列実行 ~5min)                       │
│  ├── 🔍 Lint & Format     (Ruff + Black + ESLint + Prettier)       │
│  ├── 🔒 Security Scan     (Trivy + Bandit + npm audit)             │
│  ├── 📝 Type Check        (mypy + TypeScript tsc)                  │
│  ├── 🧪 Unit Tests        (pytest + Vitest)  — 並列実行            │
│  ├── 🧪 Integration Tests (pytest + TestContainers)                │
│  ├── 📊 Coverage Report   (Codecov — ≥80% 必須)                    │
│  ├── 🤖 AI Code Review    (Claude — セキュリティ+品質)              │
│  └── 📦 Build Check       (Docker build — イメージ構築確認)         │
│  │                                                                  │
│  ▼  [Gate] 全チェック通過 + レビュー承認                              │
│  │                                                                  │
│  ▼  [CD] develop マージ時                                            │
│  ├── 📦 Docker Build & Push to ECR (マルチアーキ: amd64 + arm64)    │
│  ├── 🗄️ DB Migration (Alembic — dry-run → apply)                   │
│  ├── 🚀 Deploy to Staging (ArgoCD — GitOps)                        │
│  ├── 🧪 E2E Tests on Staging (Playwright)                          │
│  └── 📊 Performance Test (k6 — レイテンシ/スループット)               │
│  │                                                                  │
│  ▼  [CD] release/* → main マージ時                                   │
│  ├── 🏷️ Semantic Version Tag (自動)                                 │
│  ├── 📦 Production Image Build (tagged)                             │
│  ├── 🚀 Canary Deploy (10% → 50% → 100%)                           │
│  ├── 📊 Canary Metrics Check (エラー率 < 0.1%, p99 < 500ms)        │
│  ├── ✅ Full Rollout or 🔙 Auto Rollback                            │
│  └── 📋 Release Notes自動生成 (Conventional Commits → Changelog)    │
│                                                                     │
│  ── Hotfix ──────────────────────────────────────────────────────   │
│  hotfix/* → main 直接マージ（CI必須、レビュー1名、即座にdeploy）      │
└─────────────────────────────────────────────────────────────────────┘`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "CI 品質ゲート", items: [
              "テストカバレッジ: ≥80% (新規コードは≥90%)",
              "セキュリティ: Critical/High 脆弱性ゼロ",
              "コード品質: Ruff/ESLint 違反ゼロ",
              "型安全性: mypy strict / tsc strict",
              "ビルドサイズ: Docker image < 200MB",
              "依存関係: ライセンス互換性チェック (FOSSA)",
            ]},
            { title: "デプロイ戦略", items: [
              "Staging: 即時デプロイ (develop マージ時)",
              "Production: Canary → Progressive Rollout",
              "ロールバック: 1コマンドで前バージョンに戻る",
              "Feature Flags: LaunchDarkly or Unleash",
              "DB互換: Forward-only migration (N-1互換)",
              "ゼロダウンタイム: Rolling Update + Health Check",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#fef2f2", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.cia, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* モニタリング / 可観測性 */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>📡</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cisa }}>モニタリング / 可観測性 (Observability)</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { title: "Metrics (メトリクス)", color: COLORS.cia, items: [
              "Datadog or Prometheus + Grafana",
              "アプリケーションメトリクス: リクエスト数/レイテンシ/エラー率",
              "ビジネスメトリクス: DAU/学習セッション数/カード学習数",
              "AI メトリクス: LLM応答時間/トークン使用量/生成品質",
              "インフラメトリクス: CPU/Memory/Disk/Network",
              "カスタムダッシュボード: RED (Rate/Error/Duration) + USE",
            ]},
            { title: "Logs (ログ)", color: COLORS.cisa, items: [
              "構造化ログ: JSON形式 (structlog / pino)",
              "集約: CloudWatch Logs → OpenSearch or Datadog",
              "ログレベル: 環境別制御 (dev=DEBUG, prod=INFO)",
              "相関ID: リクエストID でトレースとログを紐付け",
              "機密データマスキング: PII自動検出・除去",
              "保持期間: Hot 30日 / Warm 90日 / Archive 1年",
            ]},
            { title: "Traces (トレース)", color: COLORS.cfe, items: [
              "OpenTelemetry SDK → AWS X-Ray or Datadog APM",
              "分散トレーシング: API → Worker → DB → LLM API",
              "LLMトレース: プロンプト/レスポンス/トークン数",
              "DB クエリトレース: スロークエリ自動検出",
              "サンプリング: 本番10%, エラー時100%",
              "Service Map: マイクロサービス間の依存関係可視化",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${cat.color}30`, borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: cat.color, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.72rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* SLI/SLO/SLA */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🎯</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.shared }}>SLI / SLO / SLA 定義</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["サービス", "SLI (指標)", "SLO (目標)", "SLA (契約)", "エラーバジェット"].map((h) => (
                  <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 700, color: COLORS.dark, borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["API全体", "成功率 (2xx/total)", "99.9%", "99.5%", "月43.2分"],
                ["API レイテンシ", "p99 応答時間", "< 500ms", "< 1000ms", "—"],
                ["LLM 問題生成", "生成成功率", "99.5%", "99.0%", "月4.3h"],
                ["LLM 応答時間", "p95 応答時間", "< 3秒", "< 5秒", "—"],
                ["Web フロント", "LCP (Largest Contentful Paint)", "< 2.5秒", "< 4秒", "—"],
                ["データ同期", "オフライン→オンライン同期成功率", "99.9%", "99.5%", "—"],
                ["FSRS計算", "スケジュール計算正確性", "99.99%", "99.9%", "—"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "0.5rem 0.75rem", color: j === 0 ? COLORS.dark : "#555", fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* アラート / インシデント対応 */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🚨</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cia }}>アラート / インシデント対応</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "アラート階層", items: [
              "P1 Critical: サービス全停止 → PagerDuty即時コール + 自動ロールバック",
              "P2 High: 主要機能障害 → Slack通知 + 15分以内対応",
              "P3 Medium: パフォーマンス劣化 → Slack通知 + 営業時間内対応",
              "P4 Low: 非機能的問題 → チケット自動起票 + 次スプリント対応",
              "ノイズ低減: アラート疲労防止のためのグルーピング + ディノイズ",
            ]},
            { title: "インシデント管理", items: [
              "Runbook: 全P1/P2シナリオの対応手順書整備",
              "Incident Commander制: オンコールローテーション",
              "ポストモーテム: 全P1/P2で blame-free 振り返り必須",
              "Chaos Engineering: 月次のGameDay (障害注入訓練)",
              "Status Page: Statuspage.io でユーザー向け障害通知",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#fef2f2", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.cia, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Security ───

function SecuritySection() {
  return (
    <div>
      <SectionTitle>セキュリティ設計 — エンタープライズグレード</SectionTitle>

      {/* 認証・認可 */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🔑</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.navy }}>認証・認可アーキテクチャ</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { title: "認証 (AuthN)", items: [
              "NextAuth.js v5 + OAuth 2.0 / OIDC",
              "ソーシャルログイン: Google / GitHub / Apple",
              "エンタープライズSSO: SAML 2.0 / Azure AD",
              "MFA: TOTP (Google Authenticator) + WebAuthn / Passkey",
              "JWT: Access Token (15min) + Refresh Token (7day, HttpOnly Cookie)",
              "Rate Limiting: ログイン試行 5回/15分 + CAPTCHA",
            ]},
            { title: "認可 (AuthZ)", items: [
              "RBAC (Role-Based Access Control) + ABAC (Attribute-Based)",
              "ロール: Free / Premium / Enterprise / Admin",
              "API: Middleware でルートごとの権限チェック",
              "マルチテナント: Organization単位のデータ分離",
              "Row-Level Security (RLS): PostgreSQL ポリシー",
              "API Key管理: 外部連携用 (ハッシュ保存 + スコープ制限)",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f0f4ff", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* データ保護 */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🛡️</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cisa }}>データ保護 / 暗号化</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "通信暗号化", items: ["TLS 1.3 必須 (TLS 1.2以下拒否)", "内部通信: mTLS (サービス間)", "Certificate: ACM (自動更新)", "HSTS + CSP + Security Headers"] },
            { title: "保管時暗号化", items: ["RDS: AWS KMS によるAES-256暗号化", "S3: SSE-KMS (カスタマー管理キー)", "Redis: 暗号化 at-rest + in-transit", "バックアップ: 暗号化必須"] },
            { title: "個人情報保護", items: ["個人情報保護法 / GDPR準拠設計", "データ最小化: 学習に必要な情報のみ", "匿名化 / 仮名化処理パイプライン", "退会時: 完全削除 (Right to Erasure)"] },
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f0f9ff", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.cisa, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* アプリケーションセキュリティ */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🔒</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cfe }}>アプリケーションセキュリティ</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "OWASP Top 10 対策", items: [
              "A01 Broken Access Control → RBAC + RLS + API Gateway認可",
              "A02 Cryptographic Failures → KMS管理暗号化 + TLS 1.3",
              "A03 Injection → SQLAlchemy ORM + パラメータバインド + CSP",
              "A05 Security Misconfiguration → IaCによる一貫した設定管理",
              "A07 XSS → React自動エスケープ + CSP + DOMPurify",
              "A09 Logging Failures → 構造化ログ + 監査ログ + SIEM連携",
            ]},
            { title: "セキュリティテスト / スキャン", items: [
              "SAST: Bandit (Python) + ESLint Security (JS) — CI必須",
              "SCA: Dependabot + Trivy (コンテナ脆弱性スキャン)",
              "DAST: OWASP ZAP — ステージングで定期実行",
              "Secret Detection: Gitleaks + pre-commit hook",
              "Penetration Test: 年2回の外部診断 (リリース前必須)",
              "Bug Bounty: HackerOne プログラム (成熟後)",
            ]},
            { title: "AI固有のセキュリティ", items: [
              "Prompt Injection対策: 入力サニタイズ + Output Validation",
              "LLM出力検証: 不適切コンテンツフィルタリング",
              "RAGソースの改ざん検知: ハッシュ検証",
              "API Key管理: Secrets Manager + ローテーション",
              "トークン使用量監視: 異常検知 + 上限設定",
              "データ漏洩防止: LLMに個人情報を送信しない設計",
            ]},
            { title: "コンプライアンス / 監査", items: [
              "監査ログ: 全API操作の不変ログ (CloudWatch Logs + S3)",
              "アクセスログ: Who/What/When/Where の完全記録",
              "変更管理: 全インフラ変更のPR + 承認記録",
              "SOC 2 Type II 準拠を見据えた設計",
              "定期的なセキュリティレビュー (四半期)",
              "インシデント対応計画: 72時間以内の通知体制",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#faf5ff", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.cfe, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* ネットワークセキュリティ */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🌐</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.dark }}>ネットワーク / インフラセキュリティ</h3>
        </div>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`┌────────────────────────────────────────────────────────────────┐
│  AWS VPC ネットワーク設計                                        │
│                                                                │
│  VPC: 10.0.0.0/16                                              │
│  ├── Public Subnet (10.0.1.0/24, 10.0.2.0/24)                 │
│  │   ├── ALB (Internet-facing)                                 │
│  │   └── NAT Gateway (Outbound only)                           │
│  ├── Private Subnet (10.0.10.0/24, 10.0.20.0/24)              │
│  │   ├── ECS Fargate Tasks (API/Web/Worker)                    │
│  │   └── No direct internet access                             │
│  ├── Data Subnet (10.0.100.0/24, 10.0.200.0/24)               │
│  │   ├── RDS Aurora (Multi-AZ)                                 │
│  │   ├── ElastiCache Redis                                     │
│  │   └── No internet access (VPC Endpoint for AWS services)    │
│  │                                                              │
│  Security Groups:                                               │
│  ├── sg-alb:     80/443 from 0.0.0.0/0 (CloudFront IPs only)  │
│  ├── sg-app:     8000/3000 from sg-alb only                    │
│  ├── sg-db:      5432 from sg-app only                         │
│  └── sg-redis:   6379 from sg-app only                         │
│                                                                │
│  VPC Endpoints: S3, ECR, CloudWatch, Secrets Manager, KMS      │
│  VPC Flow Logs: 全トラフィックの記録 → CloudWatch Logs           │
└────────────────────────────────────────────────────────────────┘`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "WAF / DDoS防御", items: ["AWS WAF: SQL Injection / XSS / Bad Bot ルール", "AWS Shield Advanced: L3/L4 DDoS防御", "Rate Limiting: IP単位 1000 req/min", "Geo-blocking: 必要に応じてリージョン制限"] },
            { title: "ゼロトラスト原則", items: ["IAM: 最小権限の原則 (Least Privilege)", "サービス間: mTLS + Service Mesh (必要時)", "VPC Endpoint: AWSサービスへのプライベート接続", "Session管理: 定期的なクレデンシャルローテーション"] },
            { title: "監査 / 記録", items: ["AWS CloudTrail: 全API操作の記録", "VPC Flow Logs: ネットワーク通信の記録", "Config: リソース設定変更の追跡", "GuardDuty: 脅威検知 + 異常アクティビティ監視"] },
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.dark, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Media (P1-B 音声+スライド) ───

function MediaSection() {
  return (
    <div>
      <SectionTitle>音声 / スライド学習モード</SectionTitle>

      <Card style={{ background: "#fef2f2", border: "1px solid #e94560", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "#991b1b", margin: 0 }}>
          「文章を読むと眠くなる」問題を根本解決。AI音声＋自動生成スライドにより、
          テキスト学習に依存しないマルチモーダル学習チャネルを提供。
          脳科学のデュアルコーディング理論（Paivio, 1986）に基づき、
          視覚＋聴覚の同時符号化で記憶定着率を最大化。
        </p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {[
          {
            icon: "🎙️",
            title: "AI音声解説エンジン",
            color: COLORS.cia,
            features: [
              "TTS: Google Cloud TTS / ElevenLabs（自然な日本語音声）",
              "速度調整: 0.5x〜3.0x（デフォルト1.5x〜1.75x — 速めの思考に対応）",
              "バックグラウンド再生: 通勤中にイヤホンで「ながら学習」",
              "テーマ別AI音声解説: 各カード/トピックの解説を自動生成",
              "ポッドキャスト形式: NotebookLM風の対話形式で概念を解説",
              "音声ブックマーク: 聴いてて気になった箇所をワンタップ保存",
            ],
          },
          {
            icon: "📊",
            title: "AIスライド自動生成",
            color: COLORS.cisa,
            features: [
              "Gemini / Claude活用: テーマ別に5〜10枚の高精度スライド自動生成",
              "1スライド＝1概念の原則: 情報過多を防止、認知負荷を最適化",
              "音声同期オートプレゼン: スライド＋音声の自動再生モード",
              "3資格比較スライド: 同一概念のCIA/CISA/CFE視点を1枚に整理",
              "図解・フローチャート優先: テキスト量を最小化し視覚的に表現",
              "スライドエクスポート: PDF/PPTX形式でオフライン閲覧可能",
            ],
          },
          {
            icon: "🎬",
            title: "統合学習モード",
            color: COLORS.cfe,
            features: [
              "講義モード: スライド＋音声＋字幕の同時再生（動画風体験）",
              "インタラクティブ停止: スライド再生中に理解度チェック問題を挿入",
              "レベル別再生: 解説レベル（小学生〜専門家）に応じた音声/スライド切替",
              "倍速学習: 1回目は1.5x → 復習は2.0x〜2.5xで効率化",
              "睡眠前モード: 低照度＋ゆっくり音声で就寝前復習に最適化",
              "理解度連動: 正答率が低いトピックは自動でスライド学習を推奨",
            ],
          },
          {
            icon: "🔧",
            title: "技術実装",
            color: COLORS.shared,
            features: [
              "音声生成: バッチプリ生成（Worker） + オンデマンド生成",
              "スライド生成: Gemini API → PPTX/HTML → プレビュー最適化",
              "キャッシュ: 生成済み音声/スライドをS3+CDN配信",
              "オフライン: Wi-Fi接続時に翌日分を自動プリフェッチ",
              "ストレージ: 音声 ~50KB/枚、スライド ~200KB/セット",
              "コスト: TTS $0.004/1000文字 — 全カード音声化で約$50〜100",
            ],
          },
        ].map((item, i) => (
          <Card key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: item.color }}>{item.title}</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {item.features.map((f, j) => (
                <li key={j} style={{ fontSize: "0.78rem", lineHeight: 1.7, color: "#555", marginBottom: "0.3rem" }}>{f}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Platform (P0-C プラグイン化設計) ───

function PlatformSection() {
  return (
    <div>
      <SectionTitle>汎用学習プラットフォーム設計 — 将来拡張</SectionTitle>

      <Card style={{ background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.navy})`, marginBottom: "1.5rem", color: "#fff" }}>
        <h3 style={{ fontWeight: 700, color: "#fbbf24", marginBottom: "1rem", fontSize: "1.1rem" }}>
          GRC Triple Crown → Universal Learning Platform
        </h3>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.8, opacity: 0.95 }}>
          GRC3資格にハードコードされた設計を排し、「資格/科目」をプラグイン化。
          カリキュラムをデータ駆動で追加可能にすることで、
          他の資格試験・大学受験・生涯学習まで同一プラットフォームで対応する。
          Deep Research / LLMで教材・過去問を解析し、カード＋スライド＋音声を自動生成して
          新コースを継続追加できるアーキテクチャ。
        </p>
      </Card>

      {/* プラグインアーキテクチャ */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1rem" }}>プラグインアーキテクチャ</h3>
        <div style={{ background: COLORS.dark, borderRadius: "12px", padding: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.9, color: "#e5e7eb", marginBottom: "1rem", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`┌─────────────────────────────────────────────────────────────────┐
│  Core Engine (資格/科目非依存)                                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │FSRS Engine│ │LLM Tutor  │ │Score      │ │Media Engine   │   │
│  │(汎用SRS)  │ │(汎用解説) │ │Predictor  │ │(音声/スライド)│   │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬────────┘   │
│        └─────────────┼─────────────┼───────────────┘            │
│                      ▼             ▼                             │
│              Plugin Interface (標準API)                           │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ CoursePlugin {                                             │   │
│  │   id, name, description, icon, color                      │   │
│  │   syllabus: Topic[]        // シラバス定義                  │   │
│  │   cards: Card[]            // 学習カード群                  │   │
│  │   questions: QuestionGen   // 問題生成ルール                │   │
│  │   ragSources: Document[]   // RAG参照文書                  │   │
│  │   examFormat: ExamConfig   // 試験形式(時間/問題数/合格基準) │   │
│  │   synergyMap?: SynergyDef  // 他コースとの知識重複マップ     │   │
│  │   levelExplanations: LevelConfig  // レベル別解説設定        │   │
│  │ }                                                          │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Course Plugins (データ駆動で追加)                                │
│                                                                  │
│  [GRC Bundle]          [資格試験]          [大学受験]             │
│  ┌─────┐┌─────┐┌────┐ ┌─────┐┌────┐┌────┐ ┌────┐┌────┐┌────┐  │
│  │ CIA ││CISA ││CFE │ │USCPA││簿記1││情報処│ │数学││物理││化学│  │
│  └─────┘└─────┘└────┘ └─────┘└────┘│理安全│ │IABC││    ││    │  │
│  ┌─────────────────┐               └────┘ └────┘└────┘└────┘  │
│  │ Synergy Layer   │  ┌─────┐┌────┐┌────┐ ┌────┐┌────┐┌────┐  │
│  │ (知識重複自動検出)│  │TOEIC││英検 ││FP  │ │英語││国語││社会│  │
│  └─────────────────┘  └─────┘└────┘└────┘ └────┘└────┘└────┘  │
└─────────────────────────────────────────────────────────────────┘`}</pre>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "コース追加フロー", items: [
              "1. Deep Research: LLMが公式シラバス/過去問を解析",
              "2. カード自動生成: トピック×概念のカードセットをLLMが作成",
              "3. 問題テンプレート: 出題形式・難易度設定をJSON定義",
              "4. RAGソース登録: 教科書/基準書のベクトル化",
              "5. シナジー検出: 既存コースとの知識重複をAIが自動マッピング",
              "6. レビュー/公開: 専門家レビュー後にプラグイン公開",
            ]},
            { title: "データモデル設計", items: [
              "courses テーブル: コース定義（多テナント対応）",
              "topics テーブル: 階層構造のシラバス（parent_id再帰）",
              "cards テーブル: course_id + topic_id で所属管理",
              "synergy_map テーブル: (course_a, topic_a) ↔ (course_b, topic_b)",
              "user_enrollments: ユーザー×コースの登録・進捗管理",
              "全テーブルに course_id カラム — 将来のマルチコース前提",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 拡張ロードマップ */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cfe, marginBottom: "1rem" }}>拡張ロードマップ</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { phase: "Phase 1: GRC特化", timeline: "v1.0 (MVP)", color: COLORS.cia, items: [
              "CIA + CISA + CFE の3資格",
              "シナジー学習エンジン",
              "FSRS v6 + LLM統合",
              "音声/スライド基本機能",
            ]},
            { phase: "Phase 2: 資格プラットフォーム", timeline: "v2.0 (+3-6ヶ月)", color: COLORS.cisa, items: [
              "USCPA / 簿記1級 / FP追加",
              "情報処理安全確保支援士",
              "コース間シナジー自動検出",
              "コース作成ツール（管理画面）",
            ]},
            { phase: "Phase 3: 総合学習基盤", timeline: "v3.0 (+6-12ヶ月)", color: COLORS.cfe, items: [
              "大学受験コース（東大理系カリキュラム）",
              "数学IA/IIB/III + 物理 + 化学 + 英語",
              "コミュニティ生成コースのマーケットプレイス",
              "企業向けカスタムコース作成API",
            ]},
          ].map((phase, i) => (
            <div key={i} style={{ border: `2px solid ${phase.color}30`, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ background: phase.color, color: "#fff", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{phase.phase}</div>
                <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>{phase.timeline}</div>
              </div>
              <ul style={{ margin: 0, padding: "0.75rem 0.75rem 0.75rem 1.5rem" }}>
                {phase.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.78rem", color: "#555", lineHeight: 1.8 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 東大理系カリキュラム */}
      <Card>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.dark, marginBottom: "1rem" }}>Phase 3 詳細: 東大理系合格カリキュラム（構想）</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { subject: "数学（IA/IIB/III）", cards: "~3,000枚", approach: "基礎定理→証明→応用問題の段階的カード構成。Deep Researchで東大過去問30年分を解析し頻出パターンを抽出。手書き入力で計算過程も学習対象に。" },
            { subject: "物理（力学/電磁気/熱/波動/原子）", cards: "~2,000枚", approach: "現象→法則→立式→解法のプロセスカード。シミュレーション動画をスライドに統合。数学との知識シナジー（微積分↔力学）を自動検出。" },
            { subject: "化学（理論/無機/有機）", cards: "~2,500枚", approach: "反応機構のフローチャートスライド自動生成。暗記事項はFSRSで最適復習。有機化学の構造式は図解カードで視覚的に学習。" },
            { subject: "英語（読解/英作文/リスニング）", cards: "~2,000枚", approach: "長文読解は音声解説で速読力強化。英作文はLLMが添削＋模範解答生成。リスニングはTTSで速度調整練習。TOEIC/英検とのシナジー。" },
          ].map((subj, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: COLORS.dark }}>{subj.subject}</h4>
                <Badge text={subj.cards} color={COLORS.navy} />
              </div>
              <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7, margin: 0 }}>{subj.approach}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Cost & Legal (P2-I コスト + P2-J 著作権) ───

function CostSection() {
  return (
    <div>
      <SectionTitle>コスト試算 / 法務・ライセンス</SectionTitle>

      {/* コスト試算 */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>💰</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.shared }}>月額コスト試算（ユーザー規模別）</h3>
        </div>
        <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["コスト項目", "個人利用 (1人)", "小規模 (100人)", "中規模 (1,000人)", "最適化戦略"].map((h) => (
                  <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontWeight: 700, color: COLORS.dark, borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Claude API (LLM)", "~$30/月", "~$800/月", "~$5,000/月", "Haiku優先 + Prompt Caching + バッチ処理"],
                ["AWS インフラ", "~$50/月", "~$300/月", "~$1,500/月", "Fargate Spot + Aurora Serverless v2"],
                ["TTS (音声生成)", "~$5/月", "~$100/月", "~$500/月", "プリ生成キャッシュ + CDN配信"],
                ["スライド生成 (Gemini)", "~$10/月", "~$200/月", "~$800/月", "テンプレート化 + キャッシュ"],
                ["S3 / CDN", "~$2/月", "~$30/月", "~$200/月", "Intelligent-Tiering + CloudFront"],
                ["モニタリング (Datadog等)", "無料枠", "~$100/月", "~$500/月", "Essential + カスタムメトリクス"],
                ["合計", "~$97/月", "~$1,530/月", "~$8,500/月", "—"],
                ["ユーザー単価", "$97", "$15.30", "$8.50", "スケールメリット大"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i >= 6 ? "#f0fdf4" : "transparent" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "0.5rem 0.75rem", color: j === 0 ? COLORS.dark : "#555", fontWeight: j === 0 || i >= 6 ? 700 : 400, fontSize: i >= 6 ? "0.82rem" : "0.78rem" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "コスト最適化戦略", items: [
              "LLM: Haiku 4.5をデフォルト、高品質生成のみSonnet 4.5",
              "Prompt Caching: 同一シラバス参照プロンプトのキャッシュ率80%+",
              "バッチ生成: 夜間バッチでカード/音声/スライドをプリ生成",
              "CDNキャッシュ: 生成済みコンテンツの再生成を回避",
              "スケール: Fargate Spot (Worker) + Reserved (API)",
            ]},
            { title: "収益モデル案", items: [
              "Freemium: 1資格/科目無料 + カード100枚/日制限",
              "Premium: 月額¥2,980 — 全資格/無制限/音声/スライド",
              "Enterprise: 月額¥9,800/人 — SSO/管理画面/カスタムコース",
              "B2B: 企業研修パッケージ — 従業員数×ボリュームディスカウント",
              "損益分岐: Premium 300人 or Enterprise 100人で月額黒字化",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: "#f0fdf4", borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.shared, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 著作権・ライセンス */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.3rem" }}>⚖️</span>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.cia }}>著作権・ライセンス・法的リスク管理</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[
            { title: "RAGソースの著作権対策", color: "#fef2f2", items: [
              "公式教材の直接取り込み禁止 — LLMの学習済み知識から生成",
              "IIA/ISACA/ACFEの公式模擬問題は公認リソースのみリンク",
              "法的文書・基準書: 公開情報（COSO/COBIT概要等）のみ参照",
              "問題生成: 出題パターンを参考にLLMが「類似問題」を新規生成",
              "引用表示: 出典明記 + Fair Use範囲内での短い引用に限定",
            ]},
            { title: "コンテンツ生成の品質保証", color: "#fffbeb", items: [
              "LLM生成問題の正答率検証: LLM-as-Judge + 人的レビュー",
              "ハルシネーション対策: RAG参照元の明示 + 確信度スコア表示",
              "免責事項: 「本アプリは学習支援ツールであり、合格を保証しない」",
              "誤情報報告機能: ユーザーからのフィードバックで継続改善",
              "定期監査: 四半期ごとにコンテンツ品質のサンプルレビュー",
            ]},
            { title: "利用規約・プライバシー", color: "#f0f4ff", items: [
              "利用規約: 学習目的限定、再配布禁止、AI生成コンテンツ明示",
              "プライバシーポリシー: 個人情報保護法 + GDPR準拠",
              "学習データ: 個人の学習履歴の第三者提供禁止",
              "匿名化統計: サービス改善のための集計データのみ利用",
              "データポータビリティ: 学習記録のエクスポート機能",
            ]},
            { title: "各試験団体との関係", color: "#faf5ff", items: [
              "IIA/ISACA/ACFE公認教材の販売ではないことを明記",
              "「CIA」「CISA」「CFE」は各団体の商標 — TM表示必須",
              "公式推薦ではないことの免責表示",
              "各団体の利用ガイドラインを遵守",
              "将来的に公式パートナーシップを検討（品質認定の取得）",
            ]},
          ].map((cat, i) => (
            <div key={i} style={{ background: cat.color, borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.dark, marginBottom: "0.5rem" }}>{cat.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Schedule ───

function ScheduleSection() {
  const weeks = [
    {
      title: "Week 1: 基礎構築 — 共通知識 + CIA集中",
      color: COLORS.cia,
      days: [
        { d: 1, t: "診断 & 計画策定", h: "5h", tasks: "3資格の統合診断テスト（各20問×3＝180問）実施。AIがCPA/IT知識との差分を分析し、28日間パーソナライズド計画を自動生成。共通知識カードセットの初回学習開始。" },
        { d: 2, t: "共通基盤: ガバナンス・内部統制", h: "5-6h", tasks: "COSO/Three Lines Model/COBIT統合学習。CIA Part1 + CISA Domain2 + CFE Preventionの共通範囲を一括カバー。100問のシナジー問題演習。" },
        { d: 3, t: "共通基盤: リスクマネジメント・倫理", h: "5-6h", tasks: "ERM/リスク評価の3資格統合学習。CIA倫理規程 + ISACA倫理規程の差分学習。Day1-2のFSRS復習。80問演習。" },
        { d: 4, t: "CIA集中: Part1 完了", h: "5-6h", tasks: "CIA Part1のIIA基準固有領域（監査マンデート、CAE責任）集中。不正リスク評価（CIA+CFE共通）。Part1ミニ模試50問。" },
        { d: 5, t: "CIA集中: Part2 監査実務", h: "5-6h", tasks: "CIA Part2全セクション。監査計画→実施→報告の流れ（CISA Domain1と部分共通）。アジャイル/リモート監査。80問演習。" },
        { d: 6, t: "CIA集中: Part3 + CISA橋渡し", h: "5-6h", tasks: "CIA Part3のIT・財務・組織行動。IT領域はCISA Domain3-5への橋渡し。Part3ミニ模試40問。全パート弱点分析。" },
        { d: 7, t: "CIA総復習 + Week1総括", h: "4-5h", tasks: "CIA全パート弱点集中。AIがWeek2計画を再最適化。FSRS全カード復習。軽めのCISA/CFEプレビュー学習。" },
      ],
    },
    {
      title: "Week 2: CISA集中 + 横断強化",
      color: COLORS.cisa,
      days: [
        { d: 8, t: "CISA: D1-D2 監査プロセス・ガバナンス", h: "5-6h", tasks: "Domain1（IS監査プロセス）21% — CIA Part2知識をIS監査に適用。Domain2（ITガバナンス）17% — CPA/CIA既習のガバナンスをIT文脈に展開。80問演習。" },
        { d: 9, t: "CISA: D3 IS取得・開発・実装", h: "5-6h", tasks: "Domain3（12%）— SDLC、プロジェクト管理、変更管理。IBMシステム開発経験が最大活用される領域。60問演習 + CIA復習。" },
        { d: 10, t: "CISA: D4-D5 運用・セキュリティ", h: "6h", tasks: "Domain4（23%）— IT運用、BCP/DRP。Domain5（27%）— 情報セキュリティ、サイバーセキュリティ。最重要2ドメインで配点50%。100問集中演習。" },
        { d: 11, t: "CISA深掘り + CIA×CISA横断", h: "5-6h", tasks: "CISA弱点ドメイン集中。CIA×CISAのクロス問題（IT統制、IS監査手法）60問。両資格の差分ポイント整理。" },
        { d: 12, t: "CFE集中: S1 財務取引・不正スキーム", h: "5-6h", tasks: "CFE Section1 — CPAの会計知識で大部分カバー。不正仕訳パターン、資産横領スキームの追加学習。80問演習。CIA/CISA復習。" },
        { d: 13, t: "CFE集中: S2 法律 + S3 調査", h: "5-6h", tasks: "Section2（法律）— 米国法中心。刑法・民法・証拠法の基礎。Section3（調査）— インタビュー技法、デジタルフォレンジック。80問演習。" },
        { d: 14, t: "CFE集中: S4 防止 + Week2総括", h: "5-6h", tasks: "Section4（不正防止・抑止）— CIA/CISA既習の内部統制をCFE視点で再整理。3資格横断弱点分析。Week3計画再最適化。" },
      ],
    },
    {
      title: "Week 3: CFE完了 + 全資格模試",
      color: COLORS.cfe,
      days: [
        { d: 15, t: "CFE弱点攻略 + 3資格シナジー復習", h: "5-6h", tasks: "CFE Law（最難関セクション）集中。3資格の共通弱点トピック横断学習。シナジー問題40問。" },
        { d: 16, t: "CIA フル模擬試験", h: "6h", tasks: "CIA Part1(125問150分) + Part2(100問120分)のフルシミュレーション。AI詳細分析。不正解の徹底復習。" },
        { d: 17, t: "CIA Part3模試 + CISA模試", h: "6h", tasks: "CIA Part3(100問120分) + CISA(150問240分)のフルシミュレーション。スコア分析。弱点カードのFSRS緊急復習。" },
        { d: 18, t: "CFE フル模擬試験", h: "6h", tasks: "CFE 4セクション(各100問120分)のフルシミュレーション。※1日2セクション。スコア分析。全資格の現在地確認。" },
        { d: 19, t: "全資格弱点集中攻略 Day 1", h: "5-6h", tasks: "3資格の模試結果から抽出した弱点トップ30トピック。AIが生成する「最重要カード100枚」を完全マスター。" },
        { d: 20, t: "全資格弱点集中攻略 Day 2", h: "5-6h", tasks: "残り弱点攻略。難問パターン特訓。時間配分練習。FSRS desired_retention を0.92に引き上げ。" },
        { d: 21, t: "Week3総括 + 受験戦略確定", h: "4-5h", tasks: "3資格の受験日程・順序を確定。全模試スコア≥合格ラインを確認。Week4のファイナル調整計画。" },
      ],
    },
    {
      title: "Week 4+: 最終仕上げ + 受験（AIが合格確率ベースで受験日提案）",
      color: COLORS.shared,
      days: [
        { d: 22, t: "全資格最終模試 + AI受験判定", h: "5-6h", tasks: "全資格のミニ模試実施。AIが合格確率を算出し「受験OK/延期推奨」を資格別に判定。合格確率≥85%の資格から受験予約。" },
        { d: 23, t: "弱点最終攻略 + 受験資格①準備", h: "4-5h", tasks: "最も合格確率の高い資格(通常CIA)の最終調整。弱点カードの完全マスター。翌日の受験に向けたウォームアップ。" },
        { d: 24, t: "受験①（合格確率最高の資格）", h: "2h+試験", tasks: "朝: ウォームアップ10問。受験後はAIが結果を分析し、次の受験資格の学習計画を再最適化。" },
        { d: 25, t: "受験②準備 + 弱点補強", h: "5h", tasks: "2番目に合格確率の高い資格の最終調整。前回受験の知識シナジーを活かした横断復習。" },
        { d: 26, t: "受験②（2番目の資格）", h: "2h+試験", tasks: "受験後、残り1資格の合格確率をAIが再評価。必要なら追加学習日を設定。" },
        { d: 27, t: "受験③準備（必要なら延長Week）", h: "5h", tasks: "最後の資格の集中復習。合格確率≥85%であれば翌日受験。未達の場合はWeek5に延長しAIが追加計画を生成。" },
        { d: 28, t: "受験③ or 延長学習", h: "2h+試験", tasks: "合格確率≥85%: 受験実施。未達: 弱点攻略を継続。CBT通年実施のため焦らず最適タイミングで受験。" },
      ],
    },
  ];

  return (
    <div>
      <SectionTitle>マスタースケジュール（4週間モデル + AI動的調整）</SectionTitle>

      <Card style={{ background: "#fffbeb", border: "1px solid #fbbf24", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.7, margin: 0 }}>
          ⚠️ <strong>1日4〜6時間（計約200〜350時間）</strong>の集中学習を想定。
          CBT試験は通年実施のため、受験日を柔軟に調整可能。
          合格確率が十分でない資格は後続週に延期する判断もAIが提案。
          <strong>4〜8週間</strong>の範囲でAIが個人の進捗に応じて動的に調整。
          以下は最速ケース（CPA+IT経験者）の4週間モデルプラン。
          CFE Law（米国法）等のゼロベース領域は追加週が必要な場合あり。
        </p>
      </Card>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              background: week.color,
              color: "#fff",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px 10px 0 0",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            {week.title}
          </div>
          <div style={{ border: `1px solid ${week.color}30`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
            {week.days.map((day, di) => (
              <div
                key={di}
                style={{
                  display: "flex",
                  borderBottom: di < week.days.length - 1 ? "1px solid #f3f4f6" : "none",
                  fontSize: "0.78rem",
                }}
              >
                <div
                  style={{
                    minWidth: "52px",
                    padding: "0.6rem 0",
                    textAlign: "center",
                    background: `${week.color}08`,
                    borderRight: `2px solid ${week.color}20`,
                  }}
                >
                  <div style={{ fontSize: "0.6rem", color: "#9ca3af" }}>DAY</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: week.color }}>{day.d}</div>
                  <div style={{ fontSize: "0.6rem", color: "#9ca3af" }}>{day.h}</div>
                </div>
                <div style={{ padding: "0.6rem 0.85rem", flex: 1 }}>
                  <div style={{ fontWeight: 700, color: COLORS.dark, marginBottom: "0.2rem" }}>{day.t}</div>
                  <div style={{ color: "#6b7280", lineHeight: 1.5 }}>{day.tasks}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Card style={{ background: "#f0fdf4", border: "1px solid #22c55e" }}>
        <h4 style={{ fontWeight: 700, color: "#166534", marginBottom: "0.5rem" }}>🎯 受験順序の根拠</h4>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "#166534", margin: 0 }}>
          <strong>CIA → CISA → CFE</strong> の順序を推奨。CIAで内部監査の基礎フレームワークを確立し、
          CISAでIT監査に特化展開。CFEは会計知識ベースが最も活きるため後半でも高効率で学習可能。
          また、CIAとCISAの知識シナジーが最大（35-40%重複）のため、連続受験が最適。
        </p>
      </Card>
    </div>
  );
}

// ─── Main App ───

export default function GRCTripleCrownSpec() {
  const [activeSection, setActiveSection] = useState("overview");

  const renderSection = () => {
    const map = {
      overview: OverviewSection,
      synergy: SynergySection,
      exams: ExamsSection,
      science: ScienceSection,
      ai: AISection,
      ui: UISection,
      tech: TechSection,
      enterprise: EnterpriseSection,
      devops: DevOpsSection,
      security: SecuritySection,
      media: MediaSection,
      platform: PlatformSection,
      cost: CostSection,
      schedule: ScheduleSection,
    };
    const Component = map[activeSection] || OverviewSection;
    return <Component />;
  };

  return (
    <div style={{ fontFamily: "'Noto Sans JP', 'Helvetica Neue', sans-serif", maxWidth: "1020px", margin: "0 auto", background: "#f9fafb", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.navy} 50%, #1e3a5f 100%)`, padding: "1.75rem 2rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {[
              { t: "CIA", c: COLORS.cia },
              { t: "CISA", c: COLORS.cisa },
              { t: "CFE", c: COLORS.cfe },
            ].map((b) => (
              <div key={b.t} style={{ background: b.c, color: "#fff", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 900 }}>{b.t}</div>
            ))}
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0, color: "#fff" }}>GRC Triple Crown</h1>
            <div style={{ fontSize: "0.72rem", opacity: 0.6, color: "#fff" }}>AI-Powered Universal Learning Platform — Spec v3.0</div>
          </div>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#fff", opacity: 0.8, lineHeight: 1.5 }}>
          CPA × ITエンジニアのための CIA・CISA・CFE 4〜8週間同時合格プログラム ｜ FSRS v6 × LLM × 認知科学 × シナジー学習 × 音声/スライド ｜ 将来: 資格/受験汎用基盤
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100 }}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            style={{
              padding: "0.7rem 0.85rem",
              border: "none",
              background: "transparent",
              borderBottom: activeSection === sec.id ? `3px solid ${COLORS.cia}` : "3px solid transparent",
              cursor: "pointer",
              fontSize: "0.72rem",
              fontWeight: activeSection === sec.id ? 700 : 500,
              color: activeSection === sec.id ? COLORS.cia : "#9ca3af",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            <span style={{ marginRight: "0.25rem" }}>{sec.icon}</span>{sec.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "1.75rem 2rem" }}>{renderSection()}</div>

      {/* Footer */}
      <div style={{ padding: "1.25rem 2rem", background: COLORS.dark, color: "#fff", fontSize: "0.7rem", opacity: 0.6, textAlign: "center" }}>
        GRC Triple Crown Spec v3.0 ｜ Feb 2026 ｜ CIA + CISA + CFE → Universal Learning Platform ｜ Enterprise-Ready
      </div>
    </div>
  );
}
