const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

export function extractAssetId(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  const match = value.match(UUID_RE)
  return match ? match[0].toLowerCase() : null
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printQrSheet(items: Array<{
  name?: string
  assetTag: string
  qrCodeDataUrl: string
  qrCodeUrl?: string
}>) {
  const pages = items.map((item) => `
    <article class="card">
      <img src="${item.qrCodeDataUrl}" alt="QR code for ${item.assetTag}" />
      <h1>${escapeHtml(item.name ?? item.assetTag)}</h1>
      <p class="tag">${escapeHtml(item.assetTag)}</p>
      ${item.qrCodeUrl ? `<p class="url">${escapeHtml(item.qrCodeUrl)}</p>` : ''}
    </article>
  `).join('')

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!popup) return
  popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AssetFlow QR labels</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; color: #0f172a; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
      .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; text-align: center; break-inside: avoid; }
      img { width: 180px; height: 180px; }
      h1 { font-size: 14px; margin: 10px 0 4px; }
      .tag { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; margin: 0; }
      .url { font-size: 10px; color: #64748b; word-break: break-all; margin: 8px 0 0; }
      @media print { body { margin: 0; } .card { box-shadow: none; } }
    </style>
  </head>
  <body>
    <div class="grid">${pages}</div>
    <script>window.onload = function () { window.print(); }</script>
  </body>
</html>`)
  popup.document.close()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
