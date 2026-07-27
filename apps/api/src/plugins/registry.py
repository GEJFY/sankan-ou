"""CoursePlugin レジストリ - プラグイン自動検出と管理"""

from src.plugins.base import CoursePlugin, SynergyDef
from src.plugins.boki1 import Boki1Plugin
from src.plugins.cfe import CFEPlugin
from src.plugins.cia import CIAPlugin
from src.plugins.cisa import CISAPlugin
from src.plugins.fp import FPPlugin
from src.plugins.riss import RISSPlugin
from src.plugins.uscpa import USCPAPlugin

# 全プラグインインスタンス
_PLUGINS: dict[str, CoursePlugin] = {}


def _register_defaults() -> None:
    """デフォルトプラグイン登録"""
    for plugin_cls in [CIAPlugin, CISAPlugin, CFEPlugin, USCPAPlugin, Boki1Plugin, FPPlugin, RISSPlugin]:
        plugin = plugin_cls()
        _PLUGINS[plugin.course_code] = plugin


def register_plugin(plugin: CoursePlugin) -> None:
    """カスタムプラグインを登録"""
    _PLUGINS[plugin.course_code] = plugin


def get_plugin(course_code: str) -> CoursePlugin | None:
    """コースコードからプラグイン取得"""
    if not _PLUGINS:
        _register_defaults()
    return _PLUGINS.get(course_code)


def get_all_plugins() -> dict[str, CoursePlugin]:
    """全プラグイン取得"""
    if not _PLUGINS:
        _register_defaults()
    return _PLUGINS.copy()


def get_all_synergy_areas() -> list[dict]:
    """全資格間のシナジー定義を統合して返す

    各プラグインが個別に定義する get_synergy_areas() は「自分視点」の重複表明であり、
    表記ゆれや登録順による欠落バグの温床だった。集約はカノニカルな単一情報源
    (src/plugins/synergy_map.py) から行う。
    """
    from src.plugins.synergy_map import get_canonical_synergy_areas

    return [
        {
            "area_name": area.area_name,
            "overlap_pct": area.overlap_pct,
            "courses": area.courses,
            "term_mappings": area.term_mappings,
            "topic_names": area.topic_names,
            "description": area.description,
        }
        for area in get_canonical_synergy_areas()
    ]
