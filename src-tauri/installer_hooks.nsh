!macro NSIS_HOOK_PREINSTALL
  ; Terminate any existing instance before replacing files
  nsExec::Exec 'taskkill /F /IM betwise-smartpc.exe'
  nsExec::Exec 'taskkill /F /IM winbet-smart-pc.exe'
  
  ; Remove old application files
  RMDir /r "$INSTDIR"

  ; Clean old WebView2 cache and data directory
  RMDir /r "$LOCALAPPDATA\com.betwise.smartpc"
  RMDir /r "$LOCALAPPDATA\com.winbet.smartpc"
  RMDir /r "$APPDATA\com.betwise.smartpc"
  RMDir /r "$APPDATA\com.winbet.smartpc"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Wipe all leftover cache and app data on uninstall
  RMDir /r "$LOCALAPPDATA\com.betwise.smartpc"
  RMDir /r "$LOCALAPPDATA\com.winbet.smartpc"
  RMDir /r "$APPDATA\com.betwise.smartpc"
  RMDir /r "$APPDATA\com.winbet.smartpc"
!macroend
