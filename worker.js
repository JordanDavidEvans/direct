import { getHtmlDocument } from './src/htmlTemplate.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/') {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(getHtmlDocument(), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
      },
    });
  },
};
