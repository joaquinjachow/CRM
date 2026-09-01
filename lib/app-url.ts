const DEFAULT_APP_URL = 'https://tajamarmolduras.com'

function normalizeAppUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

export function getAppUrl(path = '/') {
  const baseUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL)
  return new URL(path, `${baseUrl}/`)
}