<#
.SYNOPSIS
    Automated ImgBB Image Uploader and gallery.json Publisher for SVT Kalasa.
.DESCRIPTION
    Streamlines the photo upload process by uploading image files to ImgBB via API,
    gathering bilingual metadata, and cleanly appending/updating data/gallery.json.
    Gives the developer full interactive confirmation before saving changes.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\add-photo.ps1 -ImagePath "C:\Photos\rathotsava.jpg"
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0, Mandatory = $false)]
    [string]$ImagePath,

    [Parameter(Mandatory = $false)]
    [string]$ApiKey = "66c04660b388ef7e482286c1a9530545",

    [Parameter(Mandatory = $false)]
    [string]$GalleryJsonPath = "data\gallery.json"
)

# Set UTF-8 encoding for Kannada characters
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$CategoryMap = [ordered]@{
    "1" = @{ Key = "festivals"; Kn = "ಉತ್ಸವಗಳು"; Label = "Festivals (ಉತ್ಸವಗಳು)" }
    "2" = @{ Key = "rituals";   Kn = "ಧಾರ್ಮಿಕ ವಿಧಿಗಳು"; Label = "Rituals (ಧಾರ್ಮಿಕ ವಿಧಿಗಳು)" }
    "3" = @{ Key = "premises";  Kn = "ದೇವಸ್ಥಾನದ ಆವರಣ"; Label = "Premises (ದೇವಸ್ಥಾನದ ಆವರಣ)" }
    "4" = @{ Key = "archives";  Kn = "ಹಳೆಯ ಚಿತ್ರಗಳು"; Label = "Archives (ಹಳೆಯ ಚಿತ್ರಗಳು)" }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   SVT Kalasa - Automated Gallery Photo Publisher       " -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Resolve Image Path
if (-not $ImagePath) {
    $ImagePath = Read-Host "Enter image path (or drag and drop file here)"
    $ImagePath = $ImagePath.Trim().Trim('"').Trim("'")
}

if (-not (Test-Path -Path $ImagePath -PathType Leaf)) {
    Write-Error "Error: Image file does not exist at path: $ImagePath"
    exit 1
}

$ResolvedImage = Resolve-Path $ImagePath
Write-Host "Selected Image: " -NoNewline
Write-Host "$ResolvedImage" -ForegroundColor Green

# 2. Upload to ImgBB
Write-Host "`nUploading to ImgBB..." -ForegroundColor Cyan
try {
    $Bytes = [System.IO.File]::ReadAllBytes($ResolvedImage)
    $Base64Content = [Convert]::ToBase64String($Bytes)

    $Body = @{
        key   = $ApiKey
        image = $Base64Content
    }

    $Response = Invoke-RestMethod -Uri "https://api.imgbb.com/1/upload" -Method Post -Body $Body
    if (-not $Response.success) {
        Write-Error "ImgBB upload failed: $($Response.error.message)"
        exit 1
    }

    $DirectUrl = $Response.data.url
    $DisplayUrl = $Response.data.display_url
    $ImgWidth = $Response.data.width
    $ImgHeight = $Response.data.height
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "Direct URL: $DirectUrl" -ForegroundColor Gray
} catch {
    Write-Error "Failed to upload image to ImgBB: $_"
    exit 1
}

# 3. Collect Metadata Interactively
Write-Host "`n--- Photo Metadata ---" -ForegroundColor Cyan

# Category selection
Write-Host "Select Category:"
foreach ($key in $CategoryMap.Keys) {
    Write-Host "  [$key] $($CategoryMap[$key].Label)"
}
$CatChoice = Read-Host "Choice (1-4) [Default: 1]"
if (-not $CategoryMap.Contains($CatChoice)) {
    $CatChoice = "1"
}
$SelectedCategory = $CategoryMap[$CatChoice]

# Title
$TitleKn = Read-Host "Title (Kannada/English) (e.g. ವಾರ್ಷಿಕ ರಥೋತ್ಸವ ವೈಭವ)"
if (-not $TitleKn) {
    $TitleKn = [System.IO.Path]::GetFileNameWithoutExtension($ResolvedImage)
}

# Optional Caption
$CaptionKn = Read-Host "Caption (Optional, press Enter to skip)"

# Date
$DefaultDate = (Get-Date).ToString("yyyy-MM-dd")
$DateInput = Read-Host "Date (YYYY-MM-DD) [Default: $DefaultDate]"
if (-not $DateInput) {
    $DateInput = $DefaultDate
}

# Generate ID
$RandomSuffix = (Get-Random -Minimum 10 -Maximum 99)
$DateSuffix = (Get-Date -Format "yyMMdd")
$GeneratedId = "svt-$($SelectedCategory.Key.Substring(0, [Math]::Min(4, $SelectedCategory.Key.Length)))-$DateSuffix$RandomSuffix"

# Build JSON Object
$NewPhoto = [ordered]@{
    id          = $GeneratedId
    title       = $TitleKn
    category    = $SelectedCategory.Key
    categoryKn  = $SelectedCategory.Kn
    imagePath   = $DirectUrl
}

if ($CaptionKn) {
    $NewPhoto["caption"] = $CaptionKn
}
$NewPhoto["date"] = $DateInput

if ($ImgWidth -and $ImgHeight) {
    $NewPhoto["width"] = [int]$ImgWidth
    $NewPhoto["height"] = [int]$ImgHeight
}

# 4. Preview Entry & Developer Approval
$JsonPreview = $NewPhoto | ConvertTo-Json -Depth 5
Write-Host "`n---------------- NEW GALLERY ENTRY ----------------" -ForegroundColor Yellow
Write-Host $JsonPreview -ForegroundColor White
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

$Confirm = Read-Host "`nDo you want to publish this entry to $GalleryJsonPath? (Y/N) [Default: Y]"
if ($Confirm -and $Confirm.Trim().ToUpper() -ne "Y") {
    Write-Host "Operation cancelled by developer. Image was uploaded but NOT published to gallery.json." -ForegroundColor Yellow
    exit 0
}

# 5. Append to gallery.json
try {
    $FullGalleryPath = Resolve-Path $GalleryJsonPath
    $GalleryJsonRaw = [System.IO.File]::ReadAllText($FullGalleryPath, [System.Text.Encoding]::UTF8)
    $GalleryList = [System.Collections.ArrayList]@($GalleryJsonRaw | ConvertFrom-Json)

    $GalleryList.Add($NewPhoto) | Out-Null

    $UpdatedJson = $GalleryList | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($FullGalleryPath, $UpdatedJson, [System.Text.Encoding]::UTF8)

    Write-Host "`nSuccessfully published to $GalleryJsonPath!" -ForegroundColor Green
    Write-Host "Total photos now: $($GalleryList.Count)" -ForegroundColor Cyan
} catch {
    Write-Error "Failed to update $($GalleryJsonPath): $_"
    exit 1
}

