@echo off
setlocal

reg add "HKEY_CLASSES_ROOT\decentraland" /ve /t REG_SZ /d "URL: DCL Explorer Protocol" /f
reg add "HKEY_CLASSES_ROOT\decentraland" /v "URL Protocol" /t REG_SZ /d "" /f
reg add "HKEY_CLASSES_ROOT\decentraland\shell" /f
reg add "HKEY_CLASSES_ROOT\decentraland\shell\open" /f
reg add "HKEY_CLASSES_ROOT\decentraland\shell\open\command" /ve /t REG_SZ /d "\"%APPDATA%\DecentralandLauncher\Explorer\latest\Decentraland.exe\" \"%%1\" \"%%2\" \"%%3\"" /f

endlocal