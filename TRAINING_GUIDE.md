# 服装分类模型训练指南

## 当前实现

系统现在使用 **ResNet50 预训练模型** 进行服装分类，支持 18 种精细分类：

### 支持的类别
- **上衣类**: T恤、衬衫、毛衣、卫衣、女式衬衫
- **外套类**: 大衣、夹克、西装外套、开衫、羽绒服
- **下装类**: 牛仔裤、长裤、短裤、半身裙
- **连衣裙类**: 连衣裙、连体裤
- **其他**: 鞋子、配饰

### 改进特性
1. **深度学习分类器** (`ml_classifier.py`)
   - 使用预训练 ResNet50 模型
   - 返回置信度和 Top-3 预测
   - 智能规则后处理（区分外套和T恤）

2. **混合分类策略**
   - 优先使用深度学习模型
   - 置信度低时结合关键词辅助
   - 根据图像纵横比判断长短款

3. **特殊优化**
   - 外套 vs T恤混淆问题：
     * 检查纵横比（外套通常 > 1.3）
     * 检查 Top-3 预测中的外套类别
     * 结合文件名关键词

---

## 使用自定义数据集训练

### 方案 1: 使用公开数据集微调

#### 推荐数据集

1. **Fashion-MNIST** (简单，6万张图片)
   - 下载: `torchvision.datasets.FashionMNIST`
   - 10类基础分类

2. **DeepFashion** (专业，80万张图片)
   - 官网: http://mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html
   - 包含属性、关键点、分割标注

3. **Fashion Product Images** (Kaggle)
   - 链接: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset
   - 44,000+ 图片，精细分类

#### 训练步骤

创建训练脚本 `train_classifier.py`:

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, datasets, models
import os

# 配置
DATA_DIR = "path/to/your/dataset"  # 数据集目录
MODEL_SAVE_PATH = "garment_classifier.pth"
NUM_CLASSES = 18
BATCH_SIZE = 32
NUM_EPOCHS = 20
LEARNING_RATE = 0.001

# 数据预处理
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 加载数据集 (需要按类别组织文件夹)
train_dataset = datasets.ImageFolder(
    os.path.join(DATA_DIR, 'train'),
    transform=train_transform
)
val_dataset = datasets.ImageFolder(
    os.path.join(DATA_DIR, 'val'),
    transform=val_transform
)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)

# 构建模型
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Linear(num_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, NUM_CLASSES)
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# 损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=LEARNING_RATE)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

# 训练循环
def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

# 训练
best_acc = 0.0
for epoch in range(NUM_EPOCHS):
    train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
    val_loss, val_acc = validate(model, val_loader, criterion, device)
    scheduler.step()
    
    print(f"Epoch {epoch+1}/{NUM_EPOCHS}")
    print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
    print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
    
    # 保存最佳模型
    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model, MODEL_SAVE_PATH)
        print(f"✅ Best model saved! Accuracy: {best_acc:.2f}%")

print(f"\n训练完成! 最佳验证准确率: {best_acc:.2f}%")
```

#### 数据集目录结构

```
dataset/
├── train/
│   ├── tshirt/
│   │   ├── img001.jpg
│   │   ├── img002.jpg
│   │   └── ...
│   ├── coat/
│   │   ├── img001.jpg
│   │   └── ...
│   ├── jacket/
│   └── ... (其他17个类别)
└── val/
    ├── tshirt/
    ├── coat/
    └── ...
```

### 方案 2: 使用标注工具创建自己的数据集

#### 推荐工具

1. **LabelImg** (边界框标注)
   ```bash
   pip install labelImg
   labelImg
   ```

2. **CVAT** (在线标注平台)
   - 网址: https://cvat.org
   - 支持分类、检测、分割

3. **Label Studio** (多功能标注)
   ```bash
   pip install label-studio
   label-studio start
   ```

#### 标注流程

1. **收集图片**: 从网上或自己拍摄收集各类服装图片
2. **按类别分类**: 创建 18 个文件夹，手动分类
3. **划分数据集**: 80% 训练，20% 验证
4. **运行训练脚本**: 使用上面的代码训练模型
5. **部署模型**: 将 `garment_classifier.pth` 放到项目中

### 方案 3: 使用现成的预训练模型

#### HuggingFace Models

```python
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch

# 加载预训练模型
processor = AutoImageProcessor.from_pretrained("microsoft/resnet-50")
model = AutoModelForImageClassification.from_pretrained("fashion-classifier")

# 预测
image = Image.open("garment.jpg")
inputs = processor(images=image, return_tensors="pt")
outputs = model(**inputs)
predicted_class = outputs.logits.argmax(-1)
```

---

## 部署自定义模型

### 1. 保存训练好的模型

```python
# 训练完成后
torch.save(model, 'garment_classifier.pth')
```

### 2. 放置模型文件

```bash
# 将模型文件放到项目目录
cp garment_classifier.pth 智能穿搭推荐平台/smartwardrobe/wardrobe/
```

### 3. 修改配置

在 `ml_classifier.py` 中指定模型路径:

```python
# 在 settings.py 中添加
GARMENT_MODEL_PATH = os.path.join(BASE_DIR, 'wardrobe', 'garment_classifier.pth')

# 在 ml_classifier.py 中使用
from django.conf import settings
classifier = GarmentClassifier(model_path=settings.GARMENT_MODEL_PATH)
```

---

## 性能优化建议

### 1. 模型轻量化

```python
# 使用 MobileNetV3 替代 ResNet50
model = models.mobilenet_v3_large(weights='IMAGENET1K_V1')
model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, NUM_CLASSES)
```

### 2. 模型量化

```python
# 减少模型大小，加快推理速度
model_quantized = torch.quantization.quantize_dynamic(
    model, {nn.Linear}, dtype=torch.qint8
)
```

### 3. GPU 加速

```python
# 确保使用 GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
```

---

## 评估模型性能

创建评估脚本:

```python
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# 在验证集上评估
all_preds = []
all_labels = []

model.eval()
with torch.no_grad():
    for inputs, labels in val_loader:
        inputs = inputs.to(device)
        outputs = model(inputs)
        _, preds = outputs.max(1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())

# 打印分类报告
print(classification_report(all_labels, all_preds, target_names=GARMENT_CLASSES))

# 绘制混淆矩阵
cm = confusion_matrix(all_labels, all_preds)
plt.figure(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=GARMENT_CLASSES,
            yticklabels=GARMENT_CLASSES)
plt.title('Confusion Matrix')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.savefig('confusion_matrix.png')
```

---

## 常见问题

### Q1: 模型太大，加载慢？
**A**: 使用 MobileNet 或 EfficientNet 等轻量级模型

### Q2: 准确率不高？
**A**: 
- 增加训练数据量（建议每类 500+ 图片）
- 使用数据增强
- 调整学习率和训练轮数
- 尝试不同的预训练模型

### Q3: 外套和T恤仍然混淆？
**A**: 
- 收集更多外套样本（特别是长款、短款）
- 添加特征工程（如纵横比、颜色分布）
- 使用 Focal Loss 处理类别不平衡

### Q4: 如何实时更新模型？
**A**: 
- 收集用户反馈（正确/错误标注）
- 定期重新训练
- 使用在线学习框架

---

## 下一步优化方向

1. **多任务学习**: 同时预测类别、风格、季节
2. **属性识别**: 检测领口、袖长、图案等
3. **相似度搜索**: 找相似款式
4. **风格迁移**: 虚拟试衣

---

## 联系与支持

如需数据集或训练帮助，请提供：
- 目标类别数量
- 每类样本数量
- 图片分辨率要求
- 准确率目标
