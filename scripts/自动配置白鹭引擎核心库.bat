@echo off
setlocal

rem ������ʱĿ¼
set TEMP_DIR=%temp%
set VERSION=5.2.15

rem ������������
set DOWNLOAD_URL=http://192.168.1.205:3000/917/egret-core/archive/v%VERSION%.zip

rem ���ñ����ļ���
set FILENAME=%TEMP_DIR%\egret-core-v%VERSION%.zip

rem �����ļ�
echo �������� Egret Engine %VERSION%...
powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%FILENAME%'"

if exist "%FILENAME%" (
    echo �������: %FILENAME%
) else (
    echo ����ʧ��
    exit /b
)

rem ���Ŀ¼�Ƿ����
set TARGET_DIR=%APPDATA%\Egret\engine

if exist "%TARGET_DIR%" (
    echo Ŀ¼�Ѵ���: %TARGET_DIR%
) else (
    echo Ŀ¼������: %TARGET_DIR%
    rem �ݹ鴴��Ŀ¼
    mkdir "%TARGET_DIR%"
    if exist "%TARGET_DIR%" (
        echo Ŀ¼�ѳɹ�����: %TARGET_DIR%
    ) else (
        echo Ŀ¼����ʧ��
        exit /b
    )
)

rem ��ѹ�� ZIP �ļ���Ŀ��Ŀ¼
powershell -Command "Expand-Archive -Path '%FILENAME%' -DestinationPath '%TARGET_DIR%' -Force"

if exist "%TARGET_DIR%\egret-core" (
    echo ��ѹ��ɵ�: %TARGET_DIR%
    rem ����Ѵ��� v%VERSION% �ļ��У���ɾ��
    if exist "%TARGET_DIR%\v%VERSION%" (
        echo ����ɾ���Ѵ��ڵ� v%VERSION% �ļ���...
        rmdir /s /q "%TARGET_DIR%\v%VERSION%"
        echo ��ɾ�� v%VERSION% �ļ���
    )
    if exist "%TARGET_DIR%\%VERSION%" (
        echo ����ɾ���Ѵ��ڵ� %VERSION% �ļ���...
        rmdir /s /q "%TARGET_DIR%\%VERSION%"
        echo ��ɾ�� %VERSION% �ļ���
    )
    rem �������ļ���
    ren "%TARGET_DIR%\egret-core" "%VERSION%"
    if exist "%TARGET_DIR%\%VERSION%" (
        echo �ļ����ѳɹ�������Ϊ: %VERSION%
    ) else (
        echo �ļ���������ʧ��
    )
) else (
    echo ��ѹʧ��
)

endlocal
pause
