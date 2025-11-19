"""
简化版数据集下载脚本
支持手动下载和自动下载两种方式
默认推荐下载 Small 版本 (500MB+)，足够训练使用
"""

import os
import sys
import zipfile
from pathlib import Path

# 数据集配置
DATASET_SMALL = "paramaggarwal/fashion-product-images-small"
DATASET_FULL = "paramaggarwal/fashion-product-images-dataset"

def check_kaggle_credentials():
    """检查 Kaggle 凭证是否配置"""
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if kaggle_json.exists():
        print("✅ 找到 Kaggle API 凭证")
        return True
    else:
        print("❌ 未找到 Kaggle API 凭证")
        return False

def download_with_kaggle_api(use_small=True):
    """使用 Kaggle API 下载数据集"""
    dataset = DATASET_SMALL if use_small else DATASET_FULL
    size_desc = "565MB" if use_small else "15GB+"
    
    print(f"🔄 正在下载数据集: {dataset} ({size_desc})...")
    try:
        os.system(f"kaggle datasets download -d {dataset}")
        print("✅ 下载完成！")
        return True
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        return False

def manual_download_instructions():
    """显示手动下载说明"""
    print("\n" + "="*60)
    print("📥 手动下载数据集步骤 (推荐 Small 版本)")
    print("="*60)
    print()
    print("⚠️ 完整版数据集约 15GB-25GB，训练耗时且下载慢。")
    print("✅ 推荐下载 Small 版本 (约 565MB)，包含所有图片且分辨率足够训练。")
    print()
    print("1. 访问 Small 版本页面:")
    print("   https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small")
    print()
    print("2. 点击 'Download' 按钮")
    print()
    print("3. 下载后将 ZIP 文件移动到当前目录:")
    print(f"   {os.getcwd()}")
    print()
    print("4. 重命名为: fashion-product-images-small.zip")
    print()
    print("5. 运行: python download_dataset.py --extract")
    print()
    print("="*60)

def extract_dataset():
    """解压数据集 (自动检测文件名)"""
    # 可能的文件名
    possible_files = [
        "fashion-product-images-small.zip",
        "fashion-product-images-dataset.zip",
        "archive.zip"
    ]
    
    zip_path = None
    for f in possible_files:
        if os.path.exists(f):
            zip_path = f
            break
            
    if not zip_path:
        # 搜索任何 zip
        for f in os.listdir('.'):
            if f.endswith('.zip') and 'fashion' in f:
                zip_path = f
                break
    
    if not zip_path:
        print("❌ 未找到数据集 ZIP 文件")
        print(f"请确保文件名为以下之一: {', '.join(possible_files)}")
        return False
    
    print(f"📦 正在解压 {zip_path}...")
    
    try:
        extract_dir = "kaggle_fashion"
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            total_files = len(file_list)
            print(f"总共 {total_files} 个文件")
            
            for i, file in enumerate(file_list):
                zip_ref.extract(file, extract_dir)
                if (i + 1) % 2000 == 0:
                    print(f"进度: {i+1}/{total_files} ({100*(i+1)/total_files:.1f}%)")
            
            print(f"✅ 解压完成！文件保存在: {extract_dir}")
            return True
            
    except Exception as e:
        print(f"❌ 解压失败: {e}")
        return False

def main():
    print("🎯 Fashion 数据集下载工具")
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--extract":
        extract_dataset()
        return
    
    if os.path.exists("kaggle_fashion") and os.path.exists(os.path.join("kaggle_fashion", "styles.csv")):
        print("✅ 数据集已准备就绪 (kaggle_fashion 目录)")
        return
    
    if check_kaggle_credentials():
        print("1. 下载 Small 版本 (565MB) - 推荐")
        print("2. 下载 Full 版本 (15GB+) - 不推荐")
        choice = input("请选择 (1/2): ")
        
        if choice == '1':
            if download_with_kaggle_api(use_small=True):
                extract_dataset()
        elif choice == '2':
            if download_with_kaggle_api(use_small=False):
                extract_dataset()
        else:
            manual_download_instructions()
    else:
        manual_download_instructions()

if __name__ == "__main__":
    main()
