$ErrorActionPreference = 'Stop'
$files = @(
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\index.html',
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\thanks.html',
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\script.js',
  'C:\Users\w_sal\CascadeProjects\mi-pagina-web\styles.css'
)
# Map of common mojibake -> proper UTF-8
$map = [ordered]@{
  'Ã¡'='á'; 'Ã©'='é'; 'Ã­'='í'; 'Ã³'='ó'; 'Ãº'='ú';
  'Ã±'='ñ'; 'Ãœ'='Ü'; 'Ã¼'='ü'; 'Ã‘'='Ñ';
  'Ã'='Á'; 'Ã‰'='É'; 'Ã'='Í'; 'Ã“'='Ó'; 'Ãš'='Ú';
  'Â¿'='¿'; 'Â¡'='¡'; 'Â·'='·'
}
foreach ($f in $files) {
  if (Test-Path $f) {
    $content = Get-Content -Raw -LiteralPath $f -Encoding UTF8
    foreach ($k in $map.Keys) {
      $v = $map[$k]
      $content = $content -replace [Regex]::Escape($k), [System.String]::Copy($v)
    }
    Set-Content -LiteralPath $f -Value $content -Encoding UTF8
  }
}
Write-Output 'DONE'
