# Tracking Functions
!ifndef TRACKING_NSH
!define TRACKING_NSH

# Get Segment Write Key from environment during build
!define SEGMENT_WRITE_KEY "4gsiGKen1LyWATLxpZpsGI9iGYyAEBAF"

# Registry keys
!define TRACKING_REG_KEY "Software\Decentraland\Launcher\Analytics"
!define ANONYMOUS_ID_REG_NAME "AnonymousId"

# Function to get or create anonymous ID
Function GetAnonymousId
    Push $R0
    Push $R1
    
    # Try to read from registry first
    ReadRegStr $R0 HKCU "${TRACKING_REG_KEY}" "${ANONYMOUS_ID_REG_NAME}"
    StrCmp $R0 "" 0 read_success
    
    # If not found, generate new UUID and store it
    nsExec::ExecToStack 'powershell -Command "[guid]::NewGuid().ToString()"'
    Pop $0  # Return value
    Pop $R0 # UUID string
    
    # Create registry key and store UUID
    CreateDirectory "$LOCALAPPDATA\Decentraland\Launcher"
    WriteRegStr HKCU "${TRACKING_REG_KEY}" "${ANONYMOUS_ID_REG_NAME}" "$R0"
    Goto done
    
read_success:
done:
    Pop $R1
    Exch $R0 # Return UUID on stack
FunctionEnd

Function IdentifyUser
    Push $R1
    Push $R2
    Push $R3
    
    # Get or create anonymous ID
    Call GetAnonymousId
    Pop $R1
    
    # Use build-time Segment Write Key
    StrCpy $R2 "${SEGMENT_WRITE_KEY}"
    
    # Get app version from env or fallback
    ReadEnvStr $R3 "APP_VERSION"
    StrCmp $R3 "" 0 +2
    StrCpy $R3 "unknown"
    
    # Use PowerShell to make the HTTP request
    nsExec::ExecToStack 'powershell -Command "Invoke-RestMethod -Uri https://api.segment.io/v1/identify -Method Post -ContentType application/json -Body (@{\"writeKey\"=\"$R2\";\"anonymousId\"=\"$R1\"} | ConvertTo-Json);"'
    Pop $0
    Pop $1
    
    Pop $R3
    Pop $R2
    Pop $R1
FunctionEnd

Function TrackEvent
    # Parameters are passed through $R0 (event name)
    Exch $R0
    Push $R1
    Push $R2
    Push $R3
    
    # Use build-time Segment Write Key
    StrCpy $R2 "${SEGMENT_WRITE_KEY}"
    
    # Get or create anonymous ID
    Call GetAnonymousId
    Pop $R1
    
    # Get app version from env or fallback
    ReadEnvStr $R3 "APP_VERSION"
    StrCmp $R3 "" 0 +2
    StrCpy $R3 "unknown"
    
    # Use PowerShell to make the HTTP request
    nsExec::ExecToStack 'powershell -Command "Invoke-RestMethod -Uri https://api.segment.io/v1/track -Method Post -ContentType application/json -Body (@{\"writeKey\"=\"$R2\";\"anonymousId\"=\"$R1\";\"event\"=\"$R0\"} | ConvertTo-Json);"'
    Pop $0
    Pop $1
    
    Pop $R3
    Pop $R2
    Pop $R1
    Pop $R0
FunctionEnd

!macro IdentifyInstallation
    Call IdentifyUser
!macroend

!macro TrackInstallationStart
    !insertmacro IdentifyInstallation
    Push "installation_started"
    Call TrackEvent
!macroend

!macro TrackInstallationSuccess
    Push "installation_successful"
    Call TrackEvent
!macroend

!macro TrackInstallationFailed
    Push "installation_failed"
    Call TrackEvent
!macroend

!macro TrackInstallationAborted
    Push "installation_aborted"
    Call TrackEvent
!macroend

!endif # TRACKING_NSH 