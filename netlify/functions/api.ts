import { app } from '../../server/src/app';

type NetlifyEvent = {
  httpMethod: string;
  path: string;
  rawUrl?: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined> | null;
};

function requestFromEvent(event: NetlifyEvent) {
  const url = event.rawUrl
    ? new URL(event.rawUrl)
    : new URL(event.path, 'https://pillioo.netlify.app');

  // Function URL is /.netlify/functions/api/... or rewritten /api/...
  let pathname = url.pathname.replace(/^\/.netlify\/functions\/api/, '') || '/';
  if (pathname.startsWith('/api/')) pathname = pathname.slice(4) || '/';
  url.pathname = pathname;

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value) headers.set(key, value);
  }

  const method = event.httpMethod.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' || !event.body
      ? undefined
      : event.isBase64Encoded
        ? Uint8Array.from(atob(event.body), (ch) => ch.charCodeAt(0))
        : event.body;

  return new Request(url, { method, headers, body });
}

export async function handler(event: NetlifyEvent) {
  const response = await app.fetch(requestFromEvent(event));
  const body = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return {
    statusCode: response.status,
    headers,
    body,
  };
}
