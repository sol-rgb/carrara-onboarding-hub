// Branding folder listing: live from Google Drive when GOOGLE_API_KEY is set.
// The folder must be shared "anyone with the link can view" for the API key approach.
// Without a key the client falls back to Drive's embedded folder view, which needs no key.
const FOLDER = process.env.BRAND_FOLDER_ID || '1z2fPx_iK4xBdTGiTrwo6JNQ1OQxDkzoM';

function kindOf(mime) {
  if (mime.includes('presentation')) return 'presentation';
  if (mime.includes('spreadsheet')) return 'spreadsheets';
  return 'document';
}
function typeOf(mime) {
  if (mime.includes('presentation')) return 'deck';
  if (mime.includes('spreadsheet')) return 'sheet';
  if (mime.includes('document')) return 'doc';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('folder')) return 'folder';
  return 'file';
}

module.exports = async (req, res) => {
  const key = process.env.GOOGLE_API_KEY;
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  if (!key) return res.status(404).json({ error: 'no key configured' });

  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', `'${FOLDER}' in parents and trashed = false`);
    url.searchParams.set('fields', 'files(id,name,mimeType,shortcutDetails)');
    url.searchParams.set('key', key);
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);

    const files = (j.files || [])
      .map((f) => {
        // resolve shortcuts to their targets
        const id = f.shortcutDetails ? f.shortcutDetails.targetId : f.id;
        const mime = f.shortcutDetails ? f.shortcutDetails.targetMimeType : f.mimeType;
        return { name: f.name, id, kind: kindOf(mime || ''), type: typeOf(mime || '') };
      })
      .filter((f) => f.type !== 'folder');

    return res.status(200).json({ source: 'drive', files });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
