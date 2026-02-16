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
    """全資格間のシナジー定義を統合して返す"""
    if not _PLUGINS:
        _register_defaults()

    seen: set[str] = set()
    result: list[dict] = []

    for code, plugin in _PLUGINS.items():
        for syn in plugin.get_synergy_areas():
            # 重複排除 (area_nameで)
            if syn.area_name not in seen:
                seen.add(syn.area_name)
                result.append(
                    {
                        "area_name": syn.area_name,
                        "overlap_pct": syn.overlap_pct,
                        "courses": [code] + syn.related_courses,
                        "term_mappings": syn.term_mappings,
                    }
                )

    # 重複率の高い順にソート
    result.sort(key=lambda x: x["overlap_pct"], reverse=True)
    return result
