Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$mediaDir = Join-Path $root '.codex-temp\fresh-irip-aral-program\word\media'
$outDir = Join-Path $root 'public\irip'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Canvas([int]$width, [int]$height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $bitmap.SetResolution(192, 192)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-Png($bitmap, [string]$path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$header = New-Canvas 1684 184
$headerGraphics = $header.Graphics
$headerBitmap = $header.Bitmap
$centerFormat = New-Object System.Drawing.StringFormat
$centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
$centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Near

$blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
$greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 51, 0))
$linePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 3

$headerSeal = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '2.jpeg'))
$headerGraphics.DrawImage($headerSeal, 820, 0, 44, 44)

$oldEnglishSmall = New-Object System.Drawing.Font ('Old English Text MT', 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$oldEnglishLarge = New-Object System.Drawing.Font ('Old English Text MT', 31, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$trajanFallback = New-Object System.Drawing.Font ('Perpetua Titling MT', 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$headerGraphics.DrawString('Republic of the Philippines', $oldEnglishSmall, $blackBrush, [System.Drawing.RectangleF]::new(0, 44, 1684, 26), $centerFormat)
$headerGraphics.DrawString('Department of Education', $oldEnglishLarge, $blackBrush, [System.Drawing.RectangleF]::new(0, 64, 1684, 32), $centerFormat)
$headerGraphics.DrawString('Region IV-A', $trajanFallback, $blackBrush, [System.Drawing.RectangleF]::new(0, 102, 1684, 20), $centerFormat)
$headerGraphics.DrawString('SCHOOLS DIVISION OF QUEZON PROVINCE', $trajanFallback, $blackBrush, [System.Drawing.RectangleF]::new(0, 122, 1684, 20), $centerFormat)
$headerGraphics.DrawString('AGDANGAN CENTRAL ELEMENTARY SCHOOL', $trajanFallback, $blackBrush, [System.Drawing.RectangleF]::new(0, 142, 1684, 20), $centerFormat)
$headerGraphics.DrawString('Poblacion I, Agdangan, Quezon', $trajanFallback, $greenBrush, [System.Drawing.RectangleF]::new(0, 162, 1684, 18), $centerFormat)
$headerGraphics.DrawLine($linePen, 56, 180, 1628, 180)

Save-Png $headerBitmap (Join-Path $outDir 'header-strip.png')

$headerSeal.Dispose()
$oldEnglishSmall.Dispose()
$oldEnglishLarge.Dispose()
$trajanFallback.Dispose()
$headerGraphics.Dispose()
$headerBitmap.Dispose()

$footer = New-Canvas 1684 126
$footerGraphics = $footer.Graphics
$footerBitmap = $footer.Bitmap
$leftFormat = New-Object System.Drawing.StringFormat
$leftFormat.Alignment = [System.Drawing.StringAlignment]::Near
$leftFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
$mottoFormat = New-Object System.Drawing.StringFormat
$mottoFormat.Alignment = [System.Drawing.StringAlignment]::Center
$mottoFormat.LineAlignment = [System.Drawing.StringAlignment]::Near

$footerLinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 3
$footerGraphics.DrawLine($footerLinePen, 56, 0, 1628, 0)

$schoolSeal = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '23.png'))
$facebook = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '32.png'))
$quezon = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '29.png'))
$website = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '35.png'))
$agdangan = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '7.jpeg'))
$serbisyo = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '26.png'))
$matatag = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '10.png'))
$email = [System.Drawing.Image]::FromFile((Join-Path $mediaDir '38.png'))

$footerGraphics.DrawImage($schoolSeal, 68, 14, 46, 46)
$footerGraphics.DrawImage($facebook, 146, 55, 14, 14)
$footerGraphics.DrawImage($quezon, 300, 18, 132, 42)
$footerGraphics.DrawImage($website, 420, 55, 14, 14)
$footerGraphics.DrawImage($agdangan, 664, 6, 220, 72)
$footerGraphics.DrawImage($serbisyo, 712, 74, 180, 36)
$footerGraphics.DrawImage($matatag, 1240, 24, 148, 38)
$footerGraphics.DrawImage($email, 1412, 54, 16, 16)

$footerFont = New-Object System.Drawing.Font ('Arial', 12, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$footerSmallFont = New-Object System.Drawing.Font ('Arial', 11, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$mottoFont = New-Object System.Drawing.Font ('Arial', 13, ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic), [System.Drawing.GraphicsUnit]::Pixel)
$blueBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 68, 114, 196))

$footerGraphics.DrawString('DepEd Tayo Agdangan CES', $footerFont, $blackBrush, [System.Drawing.RectangleF]::new(170, 48, 190, 20), $leftFormat)
$footerGraphics.DrawString('https://agdangances.weebly.com', $footerSmallFont, $blackBrush, [System.Drawing.RectangleF]::new(440, 50, 190, 18), $leftFormat)
$footerGraphics.DrawString('Lead the Race.... ACES', $mottoFont, $blueBrush, [System.Drawing.RectangleF]::new(654, 0, 250, 20), $mottoFormat)
$footerGraphics.DrawString('Address: Brgy. Poblacion I, Agdangan, Quezon', $footerSmallFont, $blackBrush, [System.Drawing.RectangleF]::new(1240, 6, 360, 16), $leftFormat)
$footerGraphics.DrawString('Contact Numbers: 09104490517, (042) 785-0308', $footerSmallFont, $blackBrush, [System.Drawing.RectangleF]::new(1240, 22, 360, 16), $leftFormat)
$footerGraphics.DrawString('108944@deped.gov.ph', $footerSmallFont, $blackBrush, [System.Drawing.RectangleF]::new(1434, 50, 200, 18), $leftFormat)

Save-Png $footerBitmap (Join-Path $outDir 'footer-strip.png')

$schoolSeal.Dispose()
$facebook.Dispose()
$quezon.Dispose()
$website.Dispose()
$agdangan.Dispose()
$serbisyo.Dispose()
$matatag.Dispose()
$email.Dispose()
$footerFont.Dispose()
$footerSmallFont.Dispose()
$mottoFont.Dispose()
$blueBrush.Dispose()
$linePen.Dispose()
$footerLinePen.Dispose()
$blackBrush.Dispose()
$greenBrush.Dispose()
$footerGraphics.Dispose()
$footerBitmap.Dispose()
