import { app } from '../../server/src/app';

function routedRequest(request: Request) {
  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname.startsWith('/.netlify/functions/api')) {
    pathname = pathname.slice('/.netlify/functions/api'.length) || '/';
  }
  if (pathname.startsWith('/api')) {
    pathname = pathname.slice('/api'.length) || '/';
  }
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;

  url.pathname = pathname;
  return new Request(url, request);
}

export default async (request: Request) => app.fetch(routedRequest(request));

export const config = {
  path: '/api/*',
};
