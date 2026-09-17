const nativeFetch = window.fetch.bind(window);
const hasProductCards = (html) => /<article\b[^>]*class="[^"]*\bproduct-card\b/.test(html);
const normalizeSearchQuery = (query) => {
  const malformedQuery = query.match(/^title:(.+?)(?:\s+OR\s+variantssku.*|\*)$/i);

  return malformedQuery ? malformedQuery[1].trim() : query;
};

const getSuggestedTerm = async (term) => {
  const response = await nativeFetch(`/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=query&resources[limit]=4`);
  if (!response.ok) return '';

  const data = await response.json();
  const suggestion = data.resources?.results?.find((result) => result.query || result.text || result.title);

  return suggestion?.query || suggestion?.text || suggestion?.title || '';
};

window.fetch = (input, init) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input.url, window.location.origin);

  if (!requestUrl.pathname.endsWith('/search') || requestUrl.searchParams.get('view') !== 'condensed') {
    return nativeFetch(input, init);
  }

  const term = requestUrl.searchParams.get('q')?.trim();
  if (!term) return nativeFetch(input, init);

  const normalizedTerm = normalizeSearchQuery(term);
  if (normalizedTerm !== term) {
    requestUrl.searchParams.set('q', normalizedTerm);
    return nativeFetch(requestUrl.toString(), init);
  }

  return nativeFetch(input, init).then(async (response) => {
    const responseBody = await response.clone().text();
    if (hasProductCards(responseBody)) return response;

    try {
      const suggestedTerm = await getSuggestedTerm(term);
      if (!suggestedTerm || suggestedTerm.toLowerCase() === term.toLowerCase()) return response;

      requestUrl.searchParams.set('q', suggestedTerm);
      return nativeFetch(requestUrl.toString(), init);
    } catch {
      return response;
    }
  });
};
