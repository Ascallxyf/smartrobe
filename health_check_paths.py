"""路径健康检查脚本
验证所有使用 pathlib 的关键目录与配置是否正确（不依赖 Flask/SQLAlchemy 安装）。
运行方式：python health_check_paths.py
"""
from backend.config.config import (
    BASE_DIR, FRONTEND_DIR, TEMPLATES_DIR, STATIC_DIR,
    UPLOADS_DIR, INSTANCE_DIR, Config
)
from pathlib import Path
import os
import sys

failures = []

def check_path(name: str, p: Path):
    exists = p.exists()
    print(f"[PATH] {name:12} -> {p} | exists={exists}")
    if not exists:
        failures.append(name)

# 基础目录检查
check_path("BASE_DIR", BASE_DIR)
check_path("FRONTEND", FRONTEND_DIR)
check_path("TEMPLATES", TEMPLATES_DIR)
check_path("STATIC", STATIC_DIR)
check_path("UPLOADS", UPLOADS_DIR)
check_path("INSTANCE", INSTANCE_DIR)

# 还原配置的关键值（无需创建 Flask app）
env_db_url = os.environ.get('DATABASE_URL')
default_sqlite = (INSTANCE_DIR / 'wardrobe.db').resolve()
sqlite_uri = env_db_url or f"sqlite:///{default_sqlite.as_posix()}"
upload_folder = Config.UPLOAD_FOLDER

print("\n[CONFIG] SQLALCHEMY_DATABASE_URI:", sqlite_uri)
print("[CONFIG] UPLOAD_FOLDER         :", upload_folder)

# 验证上传目录与 instance 目录确保存在（init_app 已在 create_app 调用后可用）
print("\n[VERIFY] Creating missing directories if any...")
for d in [Path(upload_folder), INSTANCE_DIR]:
    d.mkdir(parents=True, exist_ok=True)
    print(f"[MKDIR] ensured: {d} (exists={d.exists()})")

# 判断数据库文件（无需强制存在）
if sqlite_uri.startswith('sqlite:///'):
    db_file = Path(sqlite_uri.replace('sqlite:///', ''))
    print(f"[DB] File path resolved: {db_file} | exists={db_file.exists()}")
else:
    print("[DB] Non-sqlite URI, skipped file existence check")

print("\n[RESULT] Failures:", failures if failures else "None - all required base paths exist")

if failures:
    print("❌ 路径缺失，请确认仓库结构或执行相关初始化。", file=sys.stderr)
    sys.exit(1)
else:
    print("✅ 路径健康检查通过。")
