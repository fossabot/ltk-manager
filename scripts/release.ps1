param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

# Strip leading 'v' if provided
$Version = $Version -replace '^v', ''
$Tag = "v$Version"

# Ensure we're in the repo root
$RepoRoot = git rev-parse --show-toplevel
Set-Location $RepoRoot

# Ensure working tree is clean
$status = git status --porcelain
if ($status) {
    Write-Error "Working tree is not clean. Commit or stash changes first."
    exit 1
}

# Ensure we're on main
$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Error "Releases should be created from main (currently on '$branch')."
    exit 1
}

# Ensure tag doesn't already exist
$tagExists = git tag -l $Tag
if ($tagExists) {
    Write-Error "Tag $Tag already exists."
    exit 1
}

# Update Cargo.toml version
$cargo = Get-Content src-tauri/Cargo.toml -Raw
$cargo = $cargo -replace '(?m)^(version\s*=\s*")([^"]+)(")', "`${1}$Version`${3}"
Set-Content src-tauri/Cargo.toml $cargo -NoNewline

# Update tauri.conf.json version
$conf = Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json
$conf.version = $Version
$conf | ConvertTo-Json -Depth 10 | Set-Content src-tauri/tauri.conf.json

Write-Host "Bumped version to $Version"

# Commit, tag, push
git add src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to $Version"
git tag -a $Tag -m "Release $Tag"
git push origin main $Tag

Write-Host ""
Write-Host "Pushed $Tag - CI will handle the release."
