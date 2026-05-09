const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';
const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv'];

export function isPdfDownload(urlDownload) {
  return /_page\d+$/.test(urlDownload);
}

async function resolveExcelUrl(base) {
  for (const ext of EXCEL_EXTENSIONS) {
    const url = `${SERVER_URL}/${base}${ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch { /* try next */ }
  }
  return null;
}

export async function resolveDownloadUrl(urlDownload) {
  if (!urlDownload) return null;
  if (isPdfDownload(urlDownload)) {
    return `${SERVER_URL}/${urlDownload.replace(/_page\d+$/, '')}.pdf`;
  }
  return await resolveExcelUrl(urlDownload);
}
