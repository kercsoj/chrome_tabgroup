# Usage: .\tabgroup.ps1 -Name "Work" -Color blue -Collapsed https://a.com https://b.com
param(
  [Parameter(Mandatory)] [string] $Name,
  [string] $Color,
  [switch] $Collapsed,
  [Parameter(Mandatory, ValueFromRemainingArguments)] [string[]] $Urls
)
$e = [uri]::EscapeDataString
$url = "http://tabgroup.localhost/?name=$(& $e $Name)"
if ($Color) { $url += "&color=$(& $e $Color)" }
if ($Collapsed) { $url += "&collapsed=1" }
foreach ($u in $Urls) { $url += "&u=$(& $e $u)" }
Start-Process chrome $url
