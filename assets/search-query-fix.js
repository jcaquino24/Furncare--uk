const nativeFetch = window.fetch.bind(window);
const buildSearchUrl = (term) => `${window.location.origin}/search?options[prefix]=last&q=${encodeURIComponent(term)}`;
const hasProductCards = (html) => html.includes('product-card');

const getSuggestedTerms = async (term) => {
  const response = await nativeFetch(
    `/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=query&resources[limit]=4`,
  );

  if (!response.ok) return [];

  const data = await response.json();
  const results = data.resources?.results;
  const suggestions = Array.isArray(results) ? results : results?.queries;
  const terms = suggestions
    ?.map((result) => result.query || result.text || result.title)
    .filter(Boolean)
    .map((suggestion) => suggestion.trim())
    .filter((suggestion, index, suggestions) => suggestions.indexOf(suggestion) === index);

  return terms || [];
};

window.fetch = (input, init) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input.url, window.location.origin);

  if (requestUrl.pathname === '/search' && requestUrl.searchParams.get('view') === 'condensed') {
    const term = requestUrl.searchParams.get('q')?.trim();

    if (term) {
      requestUrl.searchParams.set('type', 'product');
      requestUrl.searchParams.set('options[prefix]', 'last');
      requestUrl.searchParams.set('q', term);

      return nativeFetch(requestUrl.toString(), init).then(async (response) => {
        const responseBody = await response.clone().text();

        if (hasProductCards(responseBody)) return response;

        try {
          const suggestedTerms = await getSuggestedTerms(term);

          for (const suggestedTerm of suggestedTerms) {
            if (suggestedTerm.toLowerCase() === term.toLowerCase()) continue;

            requestUrl.searchParams.set('q', suggestedTerm);
            const suggestedResponse = await nativeFetch(requestUrl.toString(), init);

            if (hasProductCards(await suggestedResponse.clone().text())) return suggestedResponse;
          }
        } catch {}

        requestUrl.searchParams.set('q', `variants.sku:${term}`);
        return nativeFetch(requestUrl.toString(), init);
      });
    }
  }

  return nativeFetch(input, init);
};

customElements.whenDefined('uwp-search-input').then(() => {
  const SearchInput = customElements.get('uwp-search-input');

  SearchInput.prototype.submitSearch = function (term) {
    this.closeSearchResults();
    window.location.href = buildSearchUrl(term);
  };
});

document.addEventListener('click', (event) => {
  const viewAllButton = event.target.closest('[js-instant-search="view-all"]');

  if (!viewAllButton) return;

  const searchInput = viewAllButton.closest('uwp-search-input')?.querySelector('[js-search-input="input"]');
  const term = searchInput?.value.trim();

  if (!term) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  window.location.href = buildSearchUrl(term);
}, true);
