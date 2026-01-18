# Script to rename PNG files by converting capital letters to lowercase
# while keeping everything else (underscores, numbers, etc.) the same

# Get all PNG files in the current directory
$pngFiles = Get-ChildItem -Path "." -Filter "*.png"

foreach ($file in $pngFiles) {
    # Convert filename to lowercase
    $newName = $file.Name.ToLower()
    
    # Only rename if the name actually changes (case-sensitive comparison)
    if ($file.Name -cne $newName) {
        # Windows file system is case-insensitive, so we need to rename in 2 steps
        # Step 1: Rename to a temporary name
        $tempName = "$($file.Name).temp"
        Rename-Item -Path $file.FullName -NewName $tempName
        
        # Step 2: Rename from temp to final lowercase name
        $tempPath = Join-Path -Path $file.Directory -ChildPath $tempName
        Rename-Item -Path $tempPath -NewName $newName
        
        Write-Host "Renamed: $($file.Name) -> $newName" -ForegroundColor Green
    }
}

Write-Host "`nRename operation completed!" -ForegroundColor Cyan
