!macro customInstall
    File /oname=$PLUGINSDIR\decentraland-deeplink.bat "${BUILD_RESOURCES_DIR}\decentraland-deeplink.bat"
    ExecWait '"$PLUGINSDIR\decentraland-deeplink.bat"'
!macroend
