# MSYS2 和 MinGW-w64 自动安装脚本
# 需要管理员权限运行

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  MSYS2 + MinGW-w64 自动安装脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "✗ 需要管理员权限！" -ForegroundColor Red
    Write-Host "请右键点击此脚本，选择'以管理员身份运行'" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "✓ 检测到管理员权限" -ForegroundColor Green
Write-Host ""

# 设置安装路径
$installPath = "C:\msys64"
$installerPath = "$env:TEMP\msys2-installer.exe"

# 检查是否已安装
if (Test-Path "$installPath\msys2.exe") {
    Write-Host "✓ MSYS2 已安装在: $installPath" -ForegroundColor Green
    $continue = Read-Host "是否继续安装 GCC 工具链? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 0
    }
} else {
    # 尝试使用 winget 安装
    Write-Host "正在尝试使用 winget 安装 MSYS2..." -ForegroundColor Cyan
    try {
        $wingetOutput = winget install --id=MSYS2.MSYS2 -e --silent --accept-source-agreements --accept-package-agreements 2>&1
        Write-Host $wingetOutput
        
        Start-Sleep -Seconds 5
        
        if (Test-Path "$installPath\msys2.exe") {
            Write-Host "✓ MSYS2 安装成功！" -ForegroundColor Green
        } else {
            throw "winget 安装失败"
        }
    } catch {
        Write-Host "✗ winget 安装失败，尝试手动下载..." -ForegroundColor Yellow
        Write-Host ""
        
        # 手动下载安装
        $urls = @(
            "https://mirror.msys2.org/distrib/x86_64/msys2-x86_64-20231026.exe",
            "https://mirrors.tuna.tsinghua.edu.cn/msys2/distrib/x86_64/msys2-x86_64-20231026.exe"
        )
        
        $downloaded = $false
        foreach ($url in $urls) {
            try {
                Write-Host "正在从镜像下载: $url" -ForegroundColor Cyan
                [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                Invoke-WebRequest -Uri $url -OutFile $installerPath -UseBasicParsing -TimeoutSec 180
                
                if (Test-Path $installerPath) {
                    $size = [math]::Round((Get-Item $installerPath).Length / 1MB, 2)
                    Write-Host "✓ 下载完成 ($size MB)" -ForegroundColor Green
                    $downloaded = $true
                    break
                }
            } catch {
                Write-Host "✗ 下载失败: $_" -ForegroundColor Red
                continue
            }
        }
        
        if (-not $downloaded) {
            Write-Host ""
            Write-Host "✗ 自动下载失败！" -ForegroundColor Red
            Write-Host "请手动下载并安装:" -ForegroundColor Yellow
            Write-Host "1. 访问 https://www.msys2.org/" -ForegroundColor Yellow
            Write-Host "2. 下载并安装到 C:\msys64" -ForegroundColor Yellow
            Write-Host "3. 重新运行此脚本" -ForegroundColor Yellow
            Read-Host "按回车键退出"
            exit 1
        }
        
        # 静默安装
        Write-Host ""
        Write-Host "正在安装 MSYS2 到 $installPath ..." -ForegroundColor Cyan
        $process = Start-Process -FilePath $installerPath -ArgumentList "install", "--root", $installPath, "--confirm-command" -Wait -PassThru
        
        if ($process.ExitCode -eq 0 -and (Test-Path "$installPath\msys2.exe")) {
            Write-Host "✓ MSYS2 安装成功！" -ForegroundColor Green
        } else {
            Write-Host "✗ MSYS2 安装失败！" -ForegroundColor Red
            Read-Host "按回车键退出"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  正在安装 GCC 工具链..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 安装 GCC 工具链
$msys2Bash = "$installPath\usr\bin\bash.exe"

if (-not (Test-Path $msys2Bash)) {
    Write-Host "✗ 找不到 MSYS2 bash！" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "步骤 1/2: 更新包数据库..." -ForegroundColor Cyan
& $msys2Bash -lc "pacman -Sy --noconfirm"

Write-Host ""
Write-Host "步骤 2/2: 安装 MinGW-w64 GCC 工具链（需要几分钟）..." -ForegroundColor Cyan
& $msys2Bash -lc "pacman -S --needed --noconfirm base-devel mingw-w64-x86_64-toolchain"

Write-Host ""
Write-Host "✓ GCC 工具链安装完成！" -ForegroundColor Green

# 添加到 PATH
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  配置系统环境变量..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$mingwBinPath = "$installPath\mingw64\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($currentPath -notlike "*$mingwBinPath*") {
    Write-Host "正在添加到系统 PATH: $mingwBinPath" -ForegroundColor Cyan
    try {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$mingwBinPath", "Machine")
        Write-Host "✓ PATH 配置成功！" -ForegroundColor Green
    } catch {
        Write-Host "✗ 自动配置 PATH 失败，请手动添加:" -ForegroundColor Yellow
        Write-Host "  $mingwBinPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ PATH 已包含 MinGW 目录" -ForegroundColor Green
}

# 刷新当前会话的环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  验证安装..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 验证 GCC
$gccPath = "$mingwBinPath\gcc.exe"
if (Test-Path $gccPath) {
    Write-Host "GCC 路径: $gccPath" -ForegroundColor Green
    & $gccPath --version | Select-Object -First 1
    Write-Host "✓ GCC 安装成功！" -ForegroundColor Green
} else {
    Write-Host "✗ 找不到 GCC！" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 关闭所有 VS Code 窗口" -ForegroundColor White
Write-Host "2. 重新打开 VS Code" -ForegroundColor White
Write-Host "3. 在终端中运行: gcc --version" -ForegroundColor White
Write-Host "4. 如果成功，更新 .vscode/c_cpp_properties.json 添加:" -ForegroundColor White
Write-Host '   "compilerPath": "C:/msys64/mingw64/bin/gcc.exe"' -ForegroundColor Cyan
Write-Host "5. 在 .vscode/settings.json 中删除:" -ForegroundColor White
Write-Host '   "C_Cpp.errorSquiggles": "disabled"' -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
