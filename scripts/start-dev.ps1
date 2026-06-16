$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $ProjectRoot

Start-Transcript -Path ".\dev-server.log" -Force

try {
  & "C:\Program Files\nodejs\node.exe" ".\node_modules\next\dist\bin\next" dev --hostname 127.0.0.1 --port 3000
} catch {
  Write-Host "Erro ao iniciar o servidor:"
  Write-Host $_.Exception.Message
  throw
} finally {
  Stop-Transcript
}
