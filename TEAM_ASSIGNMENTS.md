# 六人协作分工与可接入的 Python 库

本分工严格基于当前前后端分离架构与前端调用习惯（frontend/static/js/main.js）。每位成员负责一个可独立开发与集成的 Python 子库（backend/libs/ 下），并对若干 API 端点的实现质量与性能负责。

目录：
- 成员1：AuthX（认证登录）
- 成员2：ProfileX（用户画像）
- 成员3：WardrobeX（衣橱与图片处理）
- 成员4：StyleX（风格/颜色分析）
- 成员5：RecomX（穿搭推荐引擎）
- 成员6：ApiX（接口契约与统一响应）
- 统一里程碑与联调说明
- 验收标准与测试建议

依赖基线：请先安装 requirements.txt（Flask, SQLAlchemy, Flask-* 系列、numpy/pandas/sklearn/tensorflow/opencv/Pillow 等）。如需新增三方依赖，请先在 PR 中评审通过后补充到 requirements.txt。

---

## 成员1：AuthX（backend/libs/authx）
职责：
- 统一封装注册/登录/鉴权流程，供 `backend/api/auth.py` 使用。
- 与 Flask-Login/会话机制集成，可预留 JWT 扩展点。

输出库与API：
- register_user(username, email, password) -> dict
- authenticate(username_or_email, password) -> dict
- get_current_user() -> dict | None
- require_auth(view) -> wrapped view（装饰器）

涉及端点：
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

主要依赖：Flask-Login, Werkzeug（密码哈希）；可选 bcrypt/passlib（如需更强散列）。

验收要点：
- 密码安全存储；错误凭据返回 401。
- 与 `current_user` 无缝协作；装饰器保护敏感端点。

---

## 成员2：ProfileX（backend/libs/profilex）
职责：
- 用户画像数据的读取、校验、更新；
- 将画像转为推荐可用的数值向量（compute_style_vector）。

输出库与API：
- get_profile(user_id) -> dict
- update_profile(user_id, data) -> dict
- compute_style_vector(profile_dict) -> list[float]

涉及端点：
- GET  /api/user/profile
- PUT  /api/user/profile

主要依赖：标准库 dataclasses/typing；numpy（向量化）。

验收要点：
- 与数据库模型一致；字段校验健壮；
- 向量维度固定并有注释，异常输入报 400。

---

## 成员3：WardrobeX（backend/libs/wardrobex）
职责：
- 衣橱条目 CRUD 的业务封装；
- 图片上传与基础处理（缩略图、主色提取）。

输出库与API：
- add_item(user_id, data) -> dict
- update_item(item_id, data) -> dict
- delete_item(item_id) -> None
- list_items(user_id) -> list[dict]
- process_upload(file_path) -> {image_url, colors, mime, width, height}
- image_utils：extract_color_palette(image_path, k=5)，generate_thumbnail(image_path, max_size=512)

涉及端点：
- GET/POST /api/wardrobe/items
- PUT/DELETE /api/wardrobe/items/{id}

主要依赖：Pillow、opencv-python、numpy（颜色聚类/缩略图）。

验收要点：
- 图片处理稳定、失败可恢复；
- CRUD 覆盖前端字段（name/category/color/season/image_url）。

---

## 成员4：StyleX（backend/libs/stylex）
职责：
- 基于图片的风格与颜色分析；
- 对外提供 analyze_style（返回标签、调色板）。

输出库与API：
- analyze_style(image_url=None, image_path=None) -> {tags, palette}
- extract_tags(image_path) -> list[str]

涉及端点：
- POST /api/recommend/style

主要依赖：opencv-python、numpy、scikit-learn（聚类/特征）。

验收要点：
- 对不存在/损坏图片容错；
- palette 输出与 WardrobeX 一致的 RGB 格式；
- 性能满足 1s 内完成单张分析（CPU 基线）。

---

## 成员5：RecomX（backend/libs/recomx）
职责：
- 穿搭推荐策略（规则 + 简易机器学习骨架）；
- 保存/读取推荐历史。

输出库与API：
- recommend_outfit(user_id, context) -> {items: [...], rationale: str}
- save_history(user_id, recommendation) -> dict
- load_history(user_id, limit=20) -> list[dict]

涉及端点：
- POST /api/recommend/outfit
- GET  /api/recommend/history

主要依赖：numpy、pandas、scikit-learn；可选 tensorflow（深度学习尝试）。

验收要点：
- 输入上下文兼容前端（occasion/weather/location）；
- items 结构与衣橱条目一致；
- 有可读的 rationale（推荐解释）。

---

## 成员6：ApiX（backend/libs/apix）
职责：
- 统一的请求/响应契约与轻量校验；
- 常用响应封装 success()/error()；
- Schema 映射到前端字段，保证一致性。

输出库与API：
- schemas.py：WardrobeItemSchema、ProfileSchema、RecommendationContextSchema 及 validate_*()
- responses.py：success(data, message='ok', status=200)、error(message, status=400, details=None)

涉及端点：
- 全部 API（作为统一封装被其他库/蓝图使用）。

主要依赖：标准库 dataclasses；如后续需要可切换到 pydantic/marshmallow。

验收要点：
- 前后端字段命名一致；
- 无外部重依赖，易于替换。

---

## 统一里程碑与联调说明
- M1（第1周）：完成六个库的最小可用骨架（当前已在 backend/libs/ 下生成 stubs），并以假数据打通各自的 API 端点。
- M2（第2周）：接数据库/图片处理/基础算法，完成单元测试（各模块≥3个用例，含异常路径）。
- M3（第3周）：联调打通前端三大管理器（WardrobeManager/RecommendationService/UserProfileManager），完成端到端演示。
- M4（第4周）：性能与体验优化（接口耗时、错误提示、边界条件等），准备部署（Docker）。

联调清单：
- 统一返回形态：{ status, message, data, code }
- 统一错误码：400 参数错误，401 鉴权失败，404 资源不存在，500 系统异常。
- 前端 main.js 的三个管理器已固定端点：
  - /api/wardrobe/items（GET/POST/PUT/DELETE）
  - /api/recommend/outfit（POST）、/api/recommend/style（POST）、/api/recommend/history（GET）
  - /api/user/profile（GET/PUT）

---

## 验收标准与测试建议
- 契约通过：所有端点返回上述统一响应结构，并与前端字段匹配。
- 健壮性：关键函数对空值/异常输入给出明确错误信息；
- 性能：单请求 95 分位 < 300ms（不含重算法/图片大文件时）；
- 可维护性：核心函数含 docstring 与类型标注；
- 测试：
  - Happy path：常见用户流程；
  - 边界：空列表、超长字符串、异常图片、未登录访问等；
  - 回归：历史推荐的保存/读取一致性。

> 说明：当前仅创建了库的占位实现（NotImplementedError），不影响现有代码运行；当你逐步替换 `backend/api/*.py` 内部逻辑为上述库调用时，请保证小步提交可回滚。