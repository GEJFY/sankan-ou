"""プラグインシステムのユニットテスト"""

import pytest

from src.plugins.base import CoursePlugin, SynergyDef, TopicDef
from src.plugins.registry import get_all_plugins, get_all_synergy_areas, get_plugin


@pytest.mark.unit
def test_all_plugins_registered():
    """7資格プラグインが全て登録されている"""
    plugins = get_all_plugins()
    assert "CIA" in plugins
    assert "CISA" in plugins
    assert "CFE" in plugins
    assert "USCPA" in plugins
    assert "BOKI1" in plugins
    assert "FP" in plugins
    assert "RISS" in plugins
    assert len(plugins) == 7


@pytest.mark.unit
def test_get_plugin_by_code():
    """コースコードでプラグイン取得"""
    cia = get_plugin("CIA")
    assert cia is not None
    assert cia.course_code == "CIA"

    uscpa = get_plugin("USCPA")
    assert uscpa is not None
    assert uscpa.course_code == "USCPA"


@pytest.mark.unit
def test_get_plugin_unknown():
    """存在しないコードはNone"""
    assert get_plugin("UNKNOWN") is None


@pytest.mark.unit
def test_plugin_has_syllabus():
    """全プラグインがシラバスを持つ"""
    for code, plugin in get_all_plugins().items():
        syllabus = plugin.get_syllabus()
        assert len(syllabus) > 0, f"{code} has empty syllabus"
        for topic in syllabus:
            assert isinstance(topic, TopicDef)
            assert topic.name
            assert topic.weight_pct > 0


@pytest.mark.unit
def test_plugin_has_synergy_areas():
    """全プラグインがシナジー領域を持つ"""
    for code, plugin in get_all_plugins().items():
        areas = plugin.get_synergy_areas()
        assert len(areas) > 0, f"{code} has no synergy areas"
        for area in areas:
            assert isinstance(area, SynergyDef)
            assert area.area_name
            assert 0 < area.overlap_pct <= 100


@pytest.mark.unit
def test_plugin_exam_config():
    """全プラグインが試験設定を持つ"""
    for code, plugin in get_all_plugins().items():
        config = plugin.exam_config
        assert config.total_questions > 0
        assert config.duration_minutes >= 0  # CFEは時間制限なし(0)
        assert 0 < config.passing_score <= 1
        assert len(config.sections) > 0


@pytest.mark.unit
def test_uscpa_plugin_details():
    """USCPAプラグインの具体的な設定"""
    uscpa = get_plugin("USCPA")
    assert uscpa.course_name == "U.S. CPA（米国公認会計士）"
    assert uscpa.color == "#059669"
    assert uscpa.exam_config.total_questions == 276
    assert uscpa.exam_config.passing_score == 0.75
    assert len(uscpa.exam_config.sections) == 4

    syllabus = uscpa.get_syllabus()
    codes = [t.name for t in syllabus]
    assert any("AUD" in c for c in codes)
    assert any("FAR" in c for c in codes)
    assert any("REG" in c for c in codes)
    assert any("BAR" in c for c in codes)


@pytest.mark.unit
def test_boki1_plugin_details():
    """簿記1級プラグインの具体的な設定"""
    boki = get_plugin("BOKI1")
    assert boki.course_name == "日商簿記検定1級"
    assert boki.color == "#d97706"
    assert boki.exam_config.total_questions == 100
    assert boki.exam_config.passing_score == 0.70
    assert len(boki.exam_config.sections) == 4

    syllabus = boki.get_syllabus()
    names = [t.name for t in syllabus]
    assert "商業簿記" in names
    assert "会計学" in names
    assert "工業簿記" in names
    assert "原価計算" in names


@pytest.mark.unit
def test_fp_plugin_details():
    """FPプラグインの具体的な設定"""
    fp = get_plugin("FP")
    assert fp.course_name == "FP技能士（ファイナンシャル・プランニング）"
    assert fp.color == "#2563eb"
    assert fp.exam_config.total_questions == 70
    assert fp.exam_config.passing_score == 0.60
    assert len(fp.exam_config.sections) == 2

    syllabus = fp.get_syllabus()
    assert len(syllabus) == 6  # 6分野


@pytest.mark.unit
def test_riss_plugin_details():
    """情報処理安全確保支援士プラグインの具体的な設定"""
    riss = get_plugin("RISS")
    assert riss.course_name == "情報処理安全確保支援士"
    assert riss.color == "#dc2626"
    assert riss.exam_config.total_questions == 95
    assert riss.exam_config.passing_score == 0.60
    assert len(riss.exam_config.sections) == 4

    syllabus = riss.get_syllabus()
    names = [t.name for t in syllabus]
    assert any("セキュリティ" in n for n in names)


@pytest.mark.unit
def test_synergy_areas_aggregation():
    """全シナジー領域の集約"""
    areas = get_all_synergy_areas()
    assert len(areas) > 0
    # 重複率降順ソート確認
    for i in range(len(areas) - 1):
        assert areas[i]["overlap_pct"] >= areas[i + 1]["overlap_pct"]


@pytest.mark.unit
def test_synergy_area_has_courses():
    """シナジー領域に関連コースがある"""
    areas = get_all_synergy_areas()
    for area in areas:
        assert len(area["courses"]) >= 2
        assert area["area_name"]
        assert area["term_mappings"]
