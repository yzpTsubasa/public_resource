@echo off
setlocal

rem 设置临时目录
set TEMP_DIR=%temp%
set VERSION=5.2.15

rem 设置下载链接
set DOWNLOAD_URL=http://192.168.1.205:3000/917/egret-core/archive/v%VERSION%.zip

rem 设置保存文件名
set FILENAME=%TEMP_DIR%\egret-core-v%VERSION%.zip

rem 下载文件
echo 正在下载 Egret Engine %VERSION%...
powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%FILENAME%'"

if exist "%FILENAME%" (
    echo 下载完成: %FILENAME%
) else (
    echo 下载失败
    exit /b
)

rem 检查目录是否存在
set TARGET_DIR=%APPDATA%\Egret\engine

if exist "%TARGET_DIR%" (
    echo 目录已存在: %TARGET_DIR%
) else (
    echo 目录不存在: %TARGET_DIR%
    rem 递归创建目录
    mkdir "%TARGET_DIR%"
    if exist "%TARGET_DIR%" (
        echo 目录已成功创建: %TARGET_DIR%
    ) else (
        echo 目录创建失败
        exit /b
    )
)

rem 解压缩 ZIP 文件到目标目录
powershell -Command "Expand-Archive -Path '%FILENAME%' -DestinationPath '%TARGET_DIR%' -Force"

if exist "%TARGET_DIR%\egret-core" (
    echo 解压完成到: %TARGET_DIR%
    rem 如果已存在 v%VERSION% 文件夹，先删除
    if exist "%TARGET_DIR%\v%VERSION%" (
        echo 正在删除已存在的 v%VERSION% 文件夹...
        rmdir /s /q "%TARGET_DIR%\v%VERSION%"
        echo 已删除 v%VERSION% 文件夹
    )
    if exist "%TARGET_DIR%\%VERSION%" (
        echo 正在删除已存在的 %VERSION% 文件夹...
        rmdir /s /q "%TARGET_DIR%\%VERSION%"
        echo 已删除 %VERSION% 文件夹
    )
    rem 重命名文件夹
    ren "%TARGET_DIR%\egret-core" "%VERSION%"
    if exist "%TARGET_DIR%\%VERSION%" (
        echo 文件夹已成功重命名为: %VERSION%
    ) else (
        echo 文件夹重命名失败
    )
) else (
    echo 解压失败
)

endlocal
pause
