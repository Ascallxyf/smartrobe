# 智能穿搭推荐平台 - 衣橱上传与分类功能

## 新增功能

### 1. 服装分类系统
新增详细的服装分类，包括：

**上衣类 (tops)**
- T恤 (tshirt)
- 衬衫 (shirt)
- 女衬 (blouse)
- 针织衫 (sweater)
- 卫衣 (hoodie)

**外套类 (outerwear)**
- 大衣 (coat)
- 夹克 (jacket)
- 西装外套 (blazer)
- 开衫 (cardigan)
- 羽绒服 (down_jacket)

**下装类 (bottoms)**
- 牛仔裤 (jeans)
- 长裤 (pants)
- 短裤 (shorts)
- 半身裙 (skirt)

**连衣裙类 (dresses)**
- 连衣裙 (dress)
- 连体裤 (jumpsuit)

**其他 (others)**
- 鞋子 (shoes)
- 配饰 (accessory)

### 2. 图片上传与自动识别

#### API端点
`POST /api/wardrobe/upload`

**请求格式**: multipart/form-data
- `image`: 图片文件 (必需)
- `name`: 自定义名称 (可选，默认自动生成)
- `brand`: 品牌 (可选)
- `season`: 季节 (可选)

**响应示例**:
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "item": {
      "id": 1,
      "name": "T恤 #1",
      "category": "tshirt",
      "category_group": "tops",
      "main_color_hex": "#FF5733",
      "image_url": "/media/wardrobe/image.jpg",
      ...
    },
    "classification": {
      "category": "tshirt",
      "category_group": "tops"
    }
  }
}
```

### 3. 自动分类逻辑

系统通过以下方式识别服装类别：

1. **文件名关键词识别**: 
   - 如文件名包含"t恤"、"tshirt"等关键词，自动识别为T恤
   - 支持中文和英文关键词

2. **图像分析** (待扩展):
   - 可集成深度学习模型（ResNet、EfficientNet等）
   - 进行更精确的视觉分类

3. **色彩提取**:
   - 使用 KMeans 聚类提取主色调
   - 生成5色色板供推荐算法使用

### 4. 前端功能

#### 上传按钮
点击"+ 上传新衣服"按钮打开上传界面

#### 分类标签页
- 全部
- 上衣 (tops)
- 外套 (outerwear)
- 下装 (bottoms)
- 连衣裙 (dresses)
- 其他 (others)

#### 图片预览
上传前可预览图片，确认后自动：
1. 上传到服务器
2. 分析并分类
3. 提取色彩信息
4. 添加到对应分类

### 5. 使用流程

1. 登录账号
2. 进入"我的衣橱"模块
3. 点击"+ 上传新衣服"
4. 选择服装照片
5. 系统自动识别类别
6. 确认上传
7. 在对应分类标签下查看

### 6. 技术实现

**后端服务** (`wardrobe/services.py`):
- `classify_garment_by_keywords()`: 关键词识别
- `analyze_garment_image()`: 图像分析
- `get_suggested_name()`: 自动命名

**API视图** (`api/views.py`):
- `upload_wardrobe_item()`: 处理上传请求
- 自动提取色彩并保存

**数据模型** (`wardrobe/models.py`):
- 扩展 `WardrobeItem.Category`
- 新增 `category_group` 字段用于分组

## 数据库迁移

已自动生成迁移文件:
- `accounts/migrations/0003_alter_user_body_shape.py`
- `wardrobe/migrations/0002_wardrobeitem_category_group_and_more.py`

运行 `python manage.py migrate` 应用更新

## 前端集成 (待完成)

需要在 `frontend/static/main.js` 中添加:

```javascript
// 1. 上传功能
async function uploadGarment(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/wardrobe/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  return await response.json();
}

// 2. 分类展示
function renderWardrobeByCategory(items, category = 'all') {
  const filtered = category === 'all' 
    ? items 
    : items.filter(item => item.category_group === category);
  
  // 渲染逻辑...
}

// 3. 事件监听
document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('upload-area').classList.remove('hidden');
});

document.getElementById('image-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    // 预览和上传...
  }
});
```

## CSS样式 (待添加)

需要在 `frontend/static/styles.css` 添加:

```css
.upload-area { /* 上传区域样式 */ }
.category-tabs { /* 分类标签样式 */ }
.wardrobe-grid { /* 网格布局 */ }
```

## 下一步优化

1. **高级图像识别**: 集成深度学习模型进行更准确的分类
2. **批量上传**: 支持一次上传多张图片
3. **编辑功能**: 允许用户修改自动识别的类别
4. **搜索过滤**: 按颜色、品牌、季节等筛选
5. **智能建议**: 基于已有衣橱推荐搭配组合
