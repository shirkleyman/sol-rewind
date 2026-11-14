param([string]$Dest = "G:\My Drive\University\Space\SpaceApps\Sol_Rewind\code-backup")
# Copies the project (without node_modules, dist and .git) into the Google Drive folder, as a safety copy.
$src = Split-Path -Parent $PSScriptRoot
robocopy $src $Dest /MIR /XD node_modules dist .git /NFL /NDL /NJH /NJS | Out-Null
"Backup copied to $Dest"
