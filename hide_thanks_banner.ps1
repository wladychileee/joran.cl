$ErrorActionPreference = 'Stop'
$path = 'C:\Users\w_sal\CascadeProjects\mi-pagina-web\index.html'
$content = Get-Content -Raw -LiteralPath $path -Encoding UTF8
# Add inline display:none to thanks banner div if not present
$pattern = '(?m)^\s*<div\s+id="thanks-banner"\s+class="thanks-banner"([^>]*)>'
$replacement = '<div id="thanks-banner" class="thanks-banner"$1 style="display:none">'
if ($content -match $pattern) {
  $content = [regex]::Replace($content, $pattern, $replacement, 1)
}
Set-Content -LiteralPath $path -Value $content -Encoding UTF8
Write-Output 'DONE'
