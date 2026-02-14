"""CoursePlugin system for extensible course support"""

from src.plugins.base import CoursePlugin, ExamConfig, LevelConfig, SynergyDef, TopicDef
from src.plugins.registry import get_all_plugins, get_all_synergy_areas, get_plugin, register_plugin

__all__ = [
    "CoursePlugin",
    "ExamConfig",
    "LevelConfig",
    "SynergyDef",
    "TopicDef",
    "get_plugin",
    "get_all_plugins",
    "get_all_synergy_areas",
    "register_plugin",
]
