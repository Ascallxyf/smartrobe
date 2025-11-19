# 智能穿搭推荐平台

面向论文《基于个体特征的智能衣橱系统设计与实现》与《基于多模态知识图谱的服装推荐算法》，本项目采用 **Django + 前后端分离** 实现智能衣橱管理、SegFormer 颜色分析与推荐逻辑。

## 项目结构

```
智能穿搭推荐平台/
├── frontend/                      # 纯静态前端（HTML/CSS/JS）
│   └── static/
│       ├── index.html             # 单页应用入口
│       ├── styles.css             # 样式设计（优衣库风格）
│       └── main.js                # 与后端 JSON API 交互
├── smartwardrobe/                 # Django 工程根目录
│   ├── manage.py
│   ├── api/                       # JSON API（认证、衣橱、推荐）
│   ├── accounts/                  # 自定义用户与资料
│   ├── recommendations/           # 推荐会话与结果模型
│   ├── stylex/                    # SegFormer 皮肤/服饰分析服务
│   ├── wardrobe/                  # 衣橱数据模型
│   └── smartwardrobe/             # settings/urls
├── requirements.txt               # Python 依赖
├── docker-compose.yml / Dockerfile# 部署脚手架
└── CHANGELOG.txt
```

> 早期 Flask 版本相关文件已清理，如需查看历史实现可参考版本库的旧提交。

## 快速开始

```powershell
# 1. 激活虚拟环境
.\.venv\Scripts\Activate.ps1

# 2. 安装依赖
pip install -r requirements.txt

# 3. 迁移数据库
cd smartwardrobe
..\.venv\Scripts\python.exe manage.py migrate

# 4. 创建超级用户（可选）
..\.venv\Scripts\python.exe manage.py createsuperuser

# 5. 启动开发服务器
..\.venv\Scripts\python.exe manage.py runserver
```

前端静态资源可直接通过 Django `STATICFILES_DIRS` 提供（访问 `http://127.0.0.1:8000/static/index.html`）或部署到任意静态托管服务。

## JSON API 一览

所有接口返回统一结构：

```json
{
  "success": true,
  "code": "OK",
  "data": { ... }
}
```

错误时：

```json
{
  "success": false,
  "code": "AUTH_REQUIRED",
  "message": "请先登录后再访问"
}
```

| 模块 | 方法 | 路径 | 说明 |
| ---- | ---- | ---- | ---- |
| 认证 | POST | `/api/auth/login` | 用户登录（`{username, password}`）|
| 认证 | POST | `/api/auth/logout` | 注销当前会话 |
| 用户 | GET  | `/api/user` | 获取当前登录用户信息（未登录返回 `user: null`） |
| 衣橱 | GET  | `/api/wardrobe` | 读取当前用户衣橱列表 |
| 衣橱 | POST | `/api/wardrobe` | 新增单品（需提供 `name`,`category` 等字段）|
| 衣橱 | PUT/PATCH | `/api/wardrobe/<id>` | 更新单品属性 |
| 衣橱 | DELETE | `/api/wardrobe/<id>` | 删除单品 |
| 推荐 | POST | `/api/recommendations` | 生成推荐会话并返回评分结果 |

> 非 GET 请求均已在后端关闭 CSRF 校验，便于前端使用 fetch 发起 JSON 请求。如需生产部署，请接入 CSRF Token 或改用 Token/JWT 鉴权。

## 前端体验

- 顶部导航 + Hero Banner，风格参考优衣库：强调留白、干净排版、柔和配色。
- 登录按钮触发弹窗，调用 `/api/auth/login` 完成会话登录。
- 「生成推荐」按钮在登录后启用，展示色彩/体型/年龄评分条。
- 衣橱模块提供统计与主色展示，灵感模块依据肤色季型与体型提供建议。

## 后续迭代建议

1. **多模态知识图谱**：落地论文中的实体关系、知识推理与图嵌入算法。
2. **反馈闭环**：记录用户喜欢/跳过操作，对推荐结果做在线优化。
3. **API 鉴权加强**：为生产环境加入 CSRF/Token 防护与速率限制。
4. **前端工程化**：接入 Vite/Webpack，拆分组件并编写端到端测试。

欢迎根据论文需求继续扩展模块，或在 `CHANGELOG.txt` 记录后续演进。
