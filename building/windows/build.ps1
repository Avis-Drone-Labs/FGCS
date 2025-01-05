<#
  .DESCRIPTION
  A simple script to automatically build FGCS on windows with powershell

  .EXAMPLE
  .\build.ps1 -Version "0.1.8-alpha"
#>

Param (
  [Parameter(Mandatory = $true)]
  [string]$Version
)

Write-Output "Building backend"
Write-Output "Assuming location is FGCS\building\windows"
Set-Location ../../

Write-Output "Building backend"
Set-Location radio
pip install pyinstaller

if (Test-Path .\dist) {
  Remove-Item -Path .\dist -Recurse
}
pyinstaller --paths .\venv\Lib\site-packages\ --add-data=".\venv\Lib\site-packages\pymavlink\message_definitions\:message_definitions" --add-data=".\venv\Lib\site-packages\pymavlink\:pymavlink" --hidden-import pymavlink --hidden-import engineio.async_drivers.threading .\app.py -n fgcs_backend

Write-Output "Moving contents of /radio/dist/fgcs_backend to gcs/extras"
if (Test-Path ..\gcs\extras) {
  Remove-Item -Path ..\gcs\extras -Recurse
}
Move-Item .\dist\fgcs_backend\ ..\gcs\extras

Write-Output "Building frontend"
Set-Location ../gcs
yarn
yarn version --new-version $Version --no-git-tag-version --no-commit-hooks
yarn build

Write-Output "Going back to building\windows from gcs"
Set-Location ..\building\windows

Write-Output "Done!"

