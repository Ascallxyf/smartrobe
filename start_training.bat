@echo off
echo ================================================
echo 数据集下载和训练一键脚本
echo ================================================
echo.

echo [步骤 1] 检查数据集...
if exist "kaggle_fashion\styles.csv" (
    echo ✅ 数据集已存在
    goto :prepare
)

if exist "fashion-product-images-small.zip" (
    echo ✅ 找到 Small 版本 ZIP 文件，开始解压...
    python download_dataset.py --extract
    goto :prepare
)

if exist "fashion-product-images-dataset.zip" (
    echo ✅ 找到 Full 版本 ZIP 文件，开始解压...
    python download_dataset.py --extract
    goto :prepare
)

if exist "archive.zip" (
    echo ✅ 找到 archive.zip 文件，开始解压...
    python download_dataset.py --extract
    goto :prepare
) else (
    echo ❌ 未找到数据集 ZIP 文件
    echo.
    echo 请手动下载数据集 (推荐 Small 版本):
    echo 1. 访问: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small
    echo 2. 点击 Download 按钮 (约 565MB)
    echo 3. 下载后重命名为: fashion-product-images-small.zip
    echo 4. 放在当前目录后重新运行此脚本
    echo.
    pause
    exit /b 1
)

:prepare
echo.
echo [步骤 2] 准备训练数据...
python prepare_dataset.py --mode prepare --kaggle-dir kaggle_fashion
if errorlevel 1 (
    echo ❌ 数据准备失败
    pause
    exit /b 1
)

echo.
echo [步骤 3] 开始训练模型...
echo ⚠️ 这将需要 1-2 小时（GPU）或 6-10 小时（CPU）
echo.
choice /C YN /M "是否开始训练"
if errorlevel 2 goto :end

python train_fashion_classifier.py

echo.
echo ================================================
echo ✅ 训练完成！
echo ================================================
echo.
echo 下一步:
echo 1. 复制模型: copy fashion_classifier_best.pth smartwardrobe\wardrobe\fashion_classifier.pth
echo 2. 重启服务器: cd smartwardrobe ^&^& python manage.py runserver --noreload
echo 3. 刷新浏览器测试
echo.

:end
pause
