$ErrorActionPreference = 'Stop'
# Files to fix
$files = @(
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\index.html',
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\thanks.html',
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\script.js',
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\styles.css'
)

foreach ($f in $files) {
  if (Test-Path $f) {
    # Read current text as UTF-8 (mojibake visible), then reinterpret as bytes ISO-8859-1 and decode as UTF-8
    $text = Get-Content -Raw -LiteralPath $f -Encoding UTF8
    # Convert the visible mojibake characters back to the original UTF-8 by re-decoding
    $bytesLatin1 = [System.Text.Encoding]::GetEncoding(28591).GetBytes($text)
    $fixed = [System.Text.Encoding]::UTF8.GetString($bytesLatin1)
    Set-Content -LiteralPath $f -Value $fixed -Encoding UTF8
  }
}
Write-Output 'REENCODED'
