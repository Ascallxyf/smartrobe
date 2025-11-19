# MinGW-w64 编译器安装向导

## 自动安装脚本（推荐 - 需要管理员权限）

请按照以下步骤操作：

### 步骤 1：打开管理员 PowerShell

1. 按 `Win + X`
2. 选择"Windows PowerShell (管理员)"或"终端(管理员)"

### 步骤 2：执行安装脚本

复制以下完整命令到管理员 PowerShell 中执行：

```powershell
# 设置 TLS 协议
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 下载 MSYS2 安装程序
$installerUrl = "https://repo.msys2.org/distrib/x86_64/msys2-x86_64-latest.exe"
$installerPath = "$env:TEMP\msys2-installer.exe"

Write-Host "正在下载 MSYS2 安装程序..." -ForegroundColor Green
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing

Write-Host "下载完成，开始安装..." -ForegroundColor Green
# 静默安装到 C:\msys64
Start-Process -FilePath $installerPath -ArgumentList "install --root C:\msys64 --confirm-command" -Wait

Write-Host "MSYS2 安装完成！" -ForegroundColor Green
```

### 步骤 3：安装 GCC 工具链

安装完成后，打开"开始菜单" -> 搜索"MSYS2 MSYS" -> 运行，在打开的终端中执行：

```bash
# 更新包数据库
pacman -Syu
# 按 Y 确认，然后关闭窗口

# 再次打开 MSYS2 MSYS，执行：
pacman -S --needed base-devel mingw-w64-x86_64-toolchain
# 按回车选择全部安装，然后按 Y 确认
```

### 步骤 4：添加到系统 PATH

1. 按 `Win + R`，输入 `sysdm.cpl`，按回车
2. 点击"高级" -> "环境变量"
3. 在"系统变量"中找到 `Path`，点击"编辑"
4. 点击"新建"，添加：`C:\msys64\mingw64\bin`
5. 点击"确定"保存所有窗口

### 步骤 5：验证安装

关闭所有 VS Code 窗口，重新打开，然后在终端中运行：

```powershell
gcc --version
```

应该看到类似输出：
```
gcc.exe (Rev10, Built by MSYS2 project) 13.2.0
```

### 步骤 6：更新 VS Code 配置

安装成功后，运行以下命令自动更新配置：

```powershell
cd "D:\vscodeproject\服装图片-指标"
code .vscode\c_cpp_properties.json
```

在配置文件中添加：
```json
"compilerPath": "C:/msys64/mingw64/bin/gcc.exe"
```

并在 `.vscode\settings.json` 中删除这一行：
```json
"C_Cpp.errorSquiggles": "disabled"
```

---

## 手动安装方式（如果自动安装失败）

### 方案 A：手动下载 MSYS2

1. 访问：https://www.msys2.org/
2. 点击下载 `msys2-x86_64-latest.exe`
3. 运行安装程序，安装到默认位置 `C:\msys64`
4. 安装完成后，按照上面的"步骤 3"继续

### 方案 B：使用 winget（Windows 10/11）

在 PowerShell 中运行：
```powershell
winget install --id=MSYS2.MSYS2 -e
```

---

## 常见问题

**Q: 安装后 gcc 命令仍然找不到？**
A: 确保已添加到 PATH 并重启了 VS Code。可以重启电脑确保环境变量生效。

**Q: pacman 命令执行很慢？**
A: 可以配置国内镜像源。编辑 `C:\msys64\etc\pacman.d\mirrorlist.mingw64`，在文件开头添加：
```
Server = https://mirrors.tuna.tsinghua.edu.cn/msys2/mingw/x86_64
```

**Q: 安装过程中遇到权限错误？**
A: 确保使用"管理员"身份运行 PowerShell。

---

## 需要帮助？

安装过程中遇到问题，请告诉我具体的错误信息，我会继续协助你。
