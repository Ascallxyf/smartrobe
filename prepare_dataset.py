"""准备服装分类数据集"""
import os
import shutil
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 18类服装分类映射
GARMENT_CLASSES = [
    "tshirt", "shirt", "sweater", "hoodie", "coat", "jacket",
    "blazer", "cardigan", "down_jacket", "jeans", "pants",
    "shorts", "skirt", "dress", "jumpsuit", "blouse", "shoes", "accessory"
]

# Kaggle Fashion Product Images 的类别映射
KAGGLE_TO_OUR_MAPPING = {
    # 上衣类
    "Tshirts": "tshirt",
    "Shirts": "shirt",
    "Tops": "shirt",  # 归类到衬衫
    "Sweaters": "sweater",
    "Sweatshirts": "hoodie",
    
    # 外套类
    "Jackets": "jacket",
    "Coats": "coat",
    "Blazers": "blazer",
    "Cardigan": "cardigan",
    "Shrug": "cardigan",
    "Waistcoat": "blazer",
    
    # 下装类
    "Jeans": "jeans",
    "Trousers": "pants",
    "Track Pants": "pants",
    "Shorts": "shorts",
    "Skirts": "skirt",
    "Leggings": "pants",
    
    # 连衣裙类
    "Dresses": "dress",
    "Kurtas": "dress",
    "Kurtis": "dress",
    "Jumpsuit": "jumpsuit",
    
    # 其他
    "Casual Shoes": "shoes",
    "Formal Shoes": "shoes",
    "Sports Shoes": "shoes",
    "Flip Flops": "shoes",
    "Sandals": "shoes",
    "Heels": "shoes",
    "Flats": "shoes",
}


def prepare_kaggle_dataset(
    kaggle_dir: str,
    output_dir: str,
    val_split: float = 0.2,
    max_samples_per_class: int = 1000
):
    """
    准备 Kaggle Fashion Product Images 数据集
    
    下载地址: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset
    
    Args:
        kaggle_dir: Kaggle 数据集解压目录
        output_dir: 输出目录
        val_split: 验证集比例
        max_samples_per_class: 每类最大样本数
    """
    logger.info("Processing Kaggle Fashion Product Images dataset...")
    
    # 读取样式CSV
    styles_file = os.path.join(kaggle_dir, 'styles.csv')
    if not os.path.exists(styles_file):
        logger.error(f"styles.csv not found in {kaggle_dir}")
        return
    
    df = pd.read_csv(styles_file, on_bad_lines='skip')
    logger.info(f"Loaded {len(df)} products from styles.csv")
    
    # 统计每个类别的样本
    class_samples = {cls: [] for cls in GARMENT_CLASSES}
    
    images_dir = os.path.join(kaggle_dir, 'images')
    
    for idx, row in df.iterrows():
        try:
            article_type = row.get('articleType', '')
            product_id = row.get('id', '')
            
            # 映射到我们的类别
            our_class = KAGGLE_TO_OUR_MAPPING.get(article_type)
            
            if our_class and our_class in class_samples:
                # 检查图片是否存在
                img_path = os.path.join(images_dir, f"{product_id}.jpg")
                if os.path.exists(img_path):
                    class_samples[our_class].append(img_path)
            
            if idx % 1000 == 0:
                logger.info(f"Processed {idx} products...")
        
        except Exception as e:
            logger.warning(f"Error processing row {idx}: {e}")
            continue
    
    # 打印统计
    logger.info("\nDataset statistics:")
    for cls in GARMENT_CLASSES:
        count = len(class_samples[cls])
        logger.info(f"  {cls:15s}: {count:5d} samples")
    
    # 创建输出目录
    output_path = Path(output_dir)
    train_dir = output_path / 'train'
    val_dir = output_path / 'val'
    
    train_dir.mkdir(parents=True, exist_ok=True)
    val_dir.mkdir(parents=True, exist_ok=True)
    
    # 划分训练集和验证集
    total_train = 0
    total_val = 0
    
    for cls in GARMENT_CLASSES:
        samples = class_samples[cls]
        
        if len(samples) == 0:
            logger.warning(f"No samples for class {cls}")
            continue
        
        # 限制每类样本数
        if len(samples) > max_samples_per_class:
            import random
            random.shuffle(samples)
            samples = samples[:max_samples_per_class]
        
        # 划分训练和验证
        train_samples, val_samples = train_test_split(
            samples, test_size=val_split, random_state=42
        )
        
        # 创建类别目录
        (train_dir / cls).mkdir(exist_ok=True)
        (val_dir / cls).mkdir(exist_ok=True)
        
        # 复制训练集
        for i, src_path in enumerate(train_samples):
            dst_path = train_dir / cls / f"{cls}_{i:04d}.jpg"
            shutil.copy2(src_path, dst_path)
        
        # 复制验证集
        for i, src_path in enumerate(val_samples):
            dst_path = val_dir / cls / f"{cls}_val_{i:04d}.jpg"
            shutil.copy2(src_path, dst_path)
        
        total_train += len(train_samples)
        total_val += len(val_samples)
        
        logger.info(
            f"  {cls:15s}: {len(train_samples)} train, {len(val_samples)} val"
        )
    
    logger.info(f"\n✅ Dataset prepared successfully!")
    logger.info(f"   Train: {total_train} images")
    logger.info(f"   Val: {total_val} images")
    logger.info(f"   Output: {output_dir}")


def create_sample_dataset_structure(output_dir: str):
    """
    创建示例数据集目录结构
    用于手动准备数据集时参考
    """
    logger.info(f"Creating sample dataset structure in {output_dir}...")
    
    output_path = Path(output_dir)
    
    for split in ['train', 'val']:
        for cls in GARMENT_CLASSES:
            class_dir = output_path / split / cls
            class_dir.mkdir(parents=True, exist_ok=True)
            
            # 创建README
            readme_path = class_dir / 'README.txt'
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(f"将 {cls} 类别的图片放在这个目录下\n")
                f.write(f"建议每类至少 500 张图片用于训练\n")
                f.write(f"支持格式: .jpg, .jpeg, .png\n")
    
    # 创建主README
    main_readme = output_path / 'README.md'
    with open(main_readme, 'w', encoding='utf-8') as f:
        f.write("# 服装分类数据集\n\n")
        f.write("## 目录结构\n\n")
        f.write("```\n")
        f.write("fashion_dataset/\n")
        f.write("├── train/\n")
        for cls in GARMENT_CLASSES[:3]:
            f.write(f"│   ├── {cls}/\n")
        f.write("│   └── ...\n")
        f.write("└── val/\n")
        for cls in GARMENT_CLASSES[:3]:
            f.write(f"    ├── {cls}/\n")
        f.write("    └── ...\n")
        f.write("```\n\n")
        f.write("## 支持的类别\n\n")
        for i, cls in enumerate(GARMENT_CLASSES, 1):
            f.write(f"{i}. {cls}\n")
        f.write("\n## 数据要求\n\n")
        f.write("- 每类至少 500 张训练图片\n")
        f.write("- 每类至少 100 张验证图片\n")
        f.write("- 图片格式: JPG, PNG\n")
        f.write("- 图片质量: 清晰、正面、完整\n")
    
    logger.info(f"✅ Sample structure created in {output_dir}")


def download_kaggle_dataset():
    """使用 Kaggle API 下载数据集"""
    logger.info("Downloading Fashion Product Images from Kaggle...")
    
    try:
        import kaggle
        
        # 下载数据集
        kaggle.api.dataset_download_files(
            'paramaggarwal/fashion-product-images-dataset',
            path='./kaggle_fashion',
            unzip=True
        )
        
        logger.info("✅ Dataset downloaded to ./kaggle_fashion")
        return './kaggle_fashion'
    
    except ImportError:
        logger.error("Kaggle API not installed. Run: pip install kaggle")
        logger.info("Then configure your API key from kaggle.com/account")
        return None
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        return None


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare fashion dataset')
    parser.add_argument(
        '--mode',
        choices=['download', 'prepare', 'structure'],
        default='structure',
        help='Operation mode'
    )
    parser.add_argument(
        '--kaggle-dir',
        default='./kaggle_fashion',
        help='Kaggle dataset directory'
    )
    parser.add_argument(
        '--output-dir',
        default='./fashion_dataset',
        help='Output directory'
    )
    parser.add_argument(
        '--max-samples',
        type=int,
        default=1000,
        help='Max samples per class'
    )
    
    args = parser.parse_args()
    
    if args.mode == 'download':
        # 下载 Kaggle 数据集
        kaggle_dir = download_kaggle_dataset()
        if kaggle_dir:
            prepare_kaggle_dataset(
                kaggle_dir,
                args.output_dir,
                max_samples_per_class=args.max_samples
            )
    
    elif args.mode == 'prepare':
        # 从已下载的 Kaggle 数据集准备
        prepare_kaggle_dataset(
            args.kaggle_dir,
            args.output_dir,
            max_samples_per_class=args.max_samples
        )
    
    else:  # structure
        # 创建示例目录结构
        create_sample_dataset_structure(args.output_dir)
        logger.info("\n下一步:")
        logger.info("1. 将图片按类别放入对应目录")
        logger.info("2. 或使用 --mode download 自动下载 Kaggle 数据集")
        logger.info("3. 然后运行: python train_fashion_classifier.py")
