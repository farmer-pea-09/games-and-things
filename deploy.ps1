# Deploy Games and Things to GitHub Pages
# Run once: gh auth login
# Then run: powershell -ExecutionPolicy Bypass -File deploy.ps1

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Git = Join-Path $Root '.tools\git\cmd\git.exe'
$Gh = Get-ChildItem -Path (Join-Path $Root '.tools\gh') -Recurse -Filter 'gh.exe' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName

if (-not (Test-Path $Git)) { throw 'Portable git missing. Re-run setup or install Git.' }
if (-not $Gh) { throw 'Portable gh missing. Re-run setup or install GitHub CLI.' }

Set-Location $Root

$prevErr = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $Gh auth status 2>&1 | Out-Null
$authOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevErr
if (-not $authOk) {
  Write-Host 'Sign in to GitHub first (browser will open):'
  & $Gh auth login --web --git-protocol https
  if ($LASTEXITCODE -ne 0) { throw 'GitHub login failed. Run: gh auth login' }
}

$RepoName = 'games-and-things'
$User = & $Gh api user --jq .login
$Remote = "https://github.com/$User/$RepoName.git"

& $Git branch -M main 2>$null

if (-not (& $Gh repo view "$User/$RepoName" 2>$null)) {
  & $Gh repo create $RepoName --public --source=. --remote=origin --push --description 'Games and Things — pet care, farming, and platform adventures'
} else {
  if (-not (& $Git remote get-url origin 2>$null)) { & $Git remote add origin $Remote }
  & $Git push -u origin main
}

& $Gh api repos/$User/$RepoName/pages -X POST -f build_type=workflow 2>$null
Write-Host ''
Write-Host "Live at: https://$User.github.io/$RepoName/"
Write-Host "Repo:    https://github.com/$User/$RepoName"
