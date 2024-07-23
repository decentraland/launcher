!macro customInstall
    # Makes the app runs as admin
    WriteRegStr HKLM "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$INSTDIR\${APP_FILENAME}.exe" "RUNASADMIN"

    # Defines the deeplink to executes the explorer
    WriteRegStr HKCR "decentraland" "" "URL: DCL Explorer Protocol"
    WriteRegStr HKCR "decentraland" "URL Protocol" ""
    WriteRegStr HKCR "decentraland\shell" "" ""
    WriteRegStr HKCR "decentraland\shell\open" "" ""
    WriteRegStr HKCR "decentraland\shell\open\command" "" '"$INSTDIR\Explorer\latest\Decentraland.exe" "%1" "%2" "%3"'
!macroend
