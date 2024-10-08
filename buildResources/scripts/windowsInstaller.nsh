!macro customInstall
  ${ifNot} ${isUpdated}
    # Makes the app runs as admin
    WriteRegStr HKLM "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$INSTDIR\${APP_FILENAME}.exe" "RUNASADMIN"

    # Delete old registry if exists
    DeleteRegKey HKCR "decentraland"
  ${endIf}
!macroend

!ifdef BUILD_UNINSTALLER
  Function un.customAtomicRMDir
    Exch $R0
    Push $R1
    Push $R2
    Push $R3

    StrCpy $R3 "$INSTDIR$R0\*.*"
    FindFirst $R1 $R2 $R3

    loop:
      StrCmp $R2 "" break

      StrCmp $R2 "." continue
      StrCmp $R2 ".." continue
      StrCmp $R2 "Explorer" continue

      IfFileExists "$INSTDIR$R0\$R2\*.*" isDir isNotDir

      isDir:
        CreateDirectory "$PLUGINSDIR\old-install$R0\$R2"

        Push "$R0\$R2"
        Call un.customAtomicRMDir
        Pop $R3

        IntCmp $R3 0 continue done

      isNotDir:
        ClearErrors
        Rename "$INSTDIR$R0\$R2" "$PLUGINSDIR\old-install$R0\$R2"

        StrCmp "$R0\$R2" "Uninstall ${PRODUCT_FILENAME}.exe" 0 +2
        ClearErrors

        IfErrors 0 +3
        StrCpy $R3 "$INSTDIR$R0\$R2"
        Goto done

      continue:
        FindNext $R1 $R2
        Goto loop

    break:
      StrCpy $R3 0

    done:
      FindClose $R1

      StrCpy $R0 $R3

      Pop $R3
      Pop $R2
      Pop $R1
      Exch $R0
  FunctionEnd
!endif

!macro customRemoveFiles
  ${if} ${isUpdated}
    CreateDirectory "$PLUGINSDIR\old-install"

    Push ""
    Call un.customAtomicRMDir
    Pop $R0

    ${if} $R0 != 0
      DetailPrint "File is busy, aborting: $R0"

      # Attempt to restore previous directory
      Push ""
      Call un.restoreFiles
      Pop $R0

      Abort `Can't rename "$INSTDIR" to "$PLUGINSDIR\old-install".`
    ${endif}
  ${else}
    RMDir /r $INSTDIR
  ${endif}
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegKey HKCR "decentraland"
  ${endIf}
!macroend
