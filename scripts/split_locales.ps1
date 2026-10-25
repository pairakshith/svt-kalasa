param()

$content = [System.IO.File]::ReadAllText("$PSScriptRoot\..\locales\en.json", [System.Text.Encoding]::UTF8)
$json = $content | ConvertFrom-Json

$ashta = [ordered]@{}
$deevatige = [ordered]@{}
$mangala = [ordered]@{}
$shared = [ordered]@{}

foreach ($prop in $json.psobject.properties) {
    $k = $prop.Name
    $v = $prop.Value
    if ($k -like "exp_*") {
        $ashta[$k] = $v
    } elseif ($k -like "ds_exp_*") {
        $deevatige[$k] = $v
    } elseif ($k -like "mang_*") {
        $mangala[$k] = $v
    } else {
        $shared[$k] = $v
    }
}

Write-Host "Ashta keys: $($ashta.Count)"
Write-Host "Deevatige keys: $($deevatige.Count)"
Write-Host "Mangala keys: $($mangala.Count)"
Write-Host "Shared keys: $($shared.Count)"

$ashtaJson = $ashta | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$PSScriptRoot\..\locales\en_ashtaavadhaana.json", $ashtaJson, [System.Text.Encoding]::UTF8)

$deevatigeJson = $deevatige | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$PSScriptRoot\..\locales\en_deevatige_salam.json", $deevatigeJson, [System.Text.Encoding]::UTF8)

$mangalaJson = $mangala | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$PSScriptRoot\..\locales\en_mangala.json", $mangalaJson, [System.Text.Encoding]::UTF8)

$sharedJson = $shared | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$PSScriptRoot\..\locales\en.json", $sharedJson, [System.Text.Encoding]::UTF8)

Write-Host "Done splitting!"
