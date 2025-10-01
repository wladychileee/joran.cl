$ErrorActionPreference = 'Stop'
$path = 'C:\Users\w_sal\CascadeProjects\mi-pagina-web\index.html'
$backup = 'C:\Users\w_sal\CascadeProjects\mi-pagina-web\index.before-remove-improvement.final.html'
Copy-Item -Path $path -Destination $backup -Force

# Read file
$content = Get-Content -Raw -LiteralPath $path -Encoding UTF8

# Remove all quote-improvement sections
$regexSections = '(?is)\s*<div\s+class="quote-improvement-section"[^>]*>.*?</div>\s*'
$content = [regex]::Replace($content, $regexSections, '')

# Remove the improvement modal
$regexModal = '(?is)\s*<!--\s*Quote\s+Improvement\s+Modal\s*-->\s*<div\s+id="improvement-modal"[^>]*>.*?</div>\s*'
$content = [regex]::Replace($content, $regexModal, '')

# Save back
Set-Content -LiteralPath $path -Value $content -Encoding UTF8
Write-Output 'DONE'
