param()

$replacements = @{
    "data\ashtaavadhaana.md"  = "en_ashtaavadhaana.json"
    "data\deevatige_salaam.md" = "en_deevatige_salam.json"
    "data\mangala.md"          = "en_mangala.json"
}

foreach ($relPath in $replacements.Keys) {
    $fullPath = "$PSScriptRoot\..\$relPath"
    $targetFile = $replacements[$relPath]
    $text = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
    $updated = $text -replace 'file="en\.json"', ('file="' + $targetFile + '"')
    [System.IO.File]::WriteAllText($fullPath, $updated, [System.Text.Encoding]::UTF8)
    Write-Host "Updated $relPath to reference $targetFile"
}
