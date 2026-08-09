# Build a .docx from UTF-8 content file using Word COM (ASCII-only script)
$ErrorActionPreference = 'Stop'
$contentPath = Join-Path $PSScriptRoot 'doc_content.txt'
$lines = [System.IO.File]::ReadAllLines($contentPath, [System.Text.Encoding]::UTF8)

$outPath = ''
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sel = $word.Selection

# Style constants (WdBuiltinStyle)
$wdStyleTitle = -63
$wdStyleHeading1 = -2
$wdStyleHeading2 = -3
$wdStyleHeading3 = -4
$wdStyleNormal = -1
$wdFormatDocumentDefault = 16

function Set-DefaultFont {
  param($sel)
  $sel.Font.Name = 'Times New Roman'
  $sel.Font.NameFarEast = 'SimSun'
  $sel.Font.Size = 11
}

Set-DefaultFont $sel

$tableState = @{ active = $false; rows = 0; cols = 0; r = 0; c = 0; table = $null }

function Add-Para {
  param($sel, $text)
  $sel.Style = $wdStyleNormal
  $sel.ParagraphFormat.LeftIndent = 0
  $sel.ParagraphFormat.SpaceBefore = 2
  $sel.ParagraphFormat.SpaceAfter = 2
  $sel.TypeText($text)
  $sel.TypeParagraph()
  Set-DefaultFont $sel
}

function Add-Bullet {
  param($sel, $text)
  $sel.Style = $wdStyleNormal
  $sel.ParagraphFormat.LeftIndent = 24
  $sel.ParagraphFormat.SpaceBefore = 1
  $sel.ParagraphFormat.SpaceAfter = 1
  $sel.TypeText([char]0x2022 + '  ' + $text)
  $sel.TypeParagraph()
  Set-DefaultFont $sel
}

function Add-Blank {
  param($sel)
  $sel.Style = $wdStyleNormal
  $sel.TypeParagraph()
}

foreach ($raw in $lines) {
  $line = $raw.TrimEnd()
  if ([string]::IsNullOrWhiteSpace($line)) { continue }

  if ($tableState.active) {
    if ($line.StartsWith('C|')) {
      $tableState.c++
      $cellText = $line.Substring(2)
      if ($tableState.r -eq 1) {
        $tableState.table.Rows.Item(1).Range.Font.Bold = $true
        $tableState.table.Rows.Item(1).Range.Shading.BackgroundPatternColor = 15132390
      }
      $cell = $tableState.table.Cell($tableState.r, $tableState.c)
      $cell.Range.Text = $cellText
      if ($tableState.c -eq $tableState.cols) {
        $tableState.r++
        $tableState.c = 0
        if ($tableState.r -gt $tableState.rows) {
          # 表格单元格已全部填充，退出表格状态，继续后续内容
          $tableState.active = $false
          $sel.EndKey(6) | Out-Null
          $sel.TypeParagraph()
        }
      }
    }
    continue
  }

  if ($line.StartsWith('OUT|')) {
    $outPath = $line.Substring(4)
  } elseif ($line.StartsWith('TITLE|')) {
    $sel.Style = $wdStyleTitle
    $sel.ParagraphFormat.Alignment = 1
    $sel.TypeText($line.Substring(6))
    $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0
    $sel.Style = $wdStyleNormal
  } elseif ($line.StartsWith('#1|')) {
    $sel.Style = $wdStyleHeading1
    $sel.ParagraphFormat.LeftIndent = 0
    $sel.ParagraphFormat.SpaceBefore = 10
    $sel.ParagraphFormat.SpaceAfter = 4
    $sel.TypeText($line.Substring(3))
    $sel.TypeParagraph()
    $sel.Style = $wdStyleNormal
  } elseif ($line.StartsWith('##|')) {
    $sel.Style = $wdStyleHeading2
    $sel.ParagraphFormat.LeftIndent = 0
    $sel.ParagraphFormat.SpaceBefore = 8
    $sel.ParagraphFormat.SpaceAfter = 3
    $sel.TypeText($line.Substring(3))
    $sel.TypeParagraph()
    $sel.Style = $wdStyleNormal
  } elseif ($line.StartsWith('###|')) {
    $sel.Style = $wdStyleHeading3
    $sel.ParagraphFormat.LeftIndent = 0
    $sel.ParagraphFormat.SpaceBefore = 6
    $sel.ParagraphFormat.SpaceAfter = 2
    $sel.TypeText($line.Substring(4))
    $sel.TypeParagraph()
    $sel.Style = $wdStyleNormal
  } elseif ($line.StartsWith('P|')) {
    Add-Para $sel $line.Substring(2)
  } elseif ($line.StartsWith('B|')) {
    Add-Bullet $sel $line.Substring(2)
  } elseif ($line -eq 'BR') {
    Add-Blank $sel
  } elseif ($line.StartsWith('TBL|')) {
    $parts = $line.Substring(4).Split('|')
    $rows = [int]$parts[0]
    $cols = [int]$parts[1]
    $sel.TypeParagraph()
    $table = $doc.Tables.Add($sel.Range, $rows, $cols)
    $table.Borders.Enable = $true
    $table.Range.Font.Size = 10
    $table.Range.Font.Name = 'Times New Roman'
    $table.Range.Font.NameFarEast = 'SimSun'
    $tableState.active = $true
    $tableState.rows = $rows
    $tableState.cols = $cols
    $tableState.r = 1
    $tableState.c = 0
    $tableState.table = $table
    $sel.EndKey(6) | Out-Null
  }
}

if ([string]::IsNullOrWhiteSpace($outPath)) {
  throw 'OUT| path not found in content file'
}

$doc.SaveAs([ref]$outPath, [ref]$wdFormatDocumentDefault)
$doc.Close(0)
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sel) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output ("OK|" + $outPath)
