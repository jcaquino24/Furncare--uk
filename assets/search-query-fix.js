const nativeFetch = window.fetch.bind(window);
const buildSearchUrl = (term) => `${window.location.origin}/search?options[prefix]=last&q=${encodeURIComponent(term)}`;
const hasProductCards = (html) => html.includes('product-card');
const productSearchFields = 'title,product_type,variants.title,variants.sku,vendor';
const predictiveSearchCache = new Map();

const getCached = (key, request) => {
  if (!predictiveSearchCache.has(key)) predictiveSearchCache.set(key, request());
  return predictiveSearchCache.get(key);
};

const getSuggestedTerms = async (term) => {
  const response = await getCached(`queries:${term}`, () => nativeFetch(
    `/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=query&resources[limit]=4`,
  ));

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

const getSuggestedProducts = async (term) => {
  const response = await getCached(`products:${term}`, () => {
    const searchUrl = new URL('/search/suggest.json', window.location.origin);
    searchUrl.searchParams.set('q', term);
    searchUrl.searchParams.set('resources[type]', 'product');
    searchUrl.searchParams.set('resources[fields]', productSearchFields);
    searchUrl.searchParams.set('resources[limit]', '4');
    searchUrl.searchParams.set('resources[unavailable_products]', 'hide');
    return nativeFetch(searchUrl.toString());
  });
  if (!response.ok) return [];

  const data = await response.json();
  return data.resources?.results?.products || [];
};

window.fetch = (input, init) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input.url, window.location.origin);

  if (requestUrl.pathname === '/search' && requestUrl.searchParams.get('view') === 'condensed') {
    const term = requestUrl.searchParams.get('q')?.trim();

    if (term) {
      requestUrl.searchParams.set('type', 'product');
      requestUrl.searchParams.set('options[prefix]', 'last');
      requestUrl.searchParams.set('q', term);
      const suggestedProductsPromise = getSuggestedProducts(term);

      return nativeFetch(requestUrl.toString(), init).then(async (response) => {
        const responseBody = await response.clone().text();

        if (hasProductCards(responseBody)) return response;

        try {
          const suggestedProducts = await suggestedProductsPromise;

          const productResponses = await Promise.all(
            suggestedProducts
              .filter((product) => product.title)
              .map((product) => {
                const productUrl = new URL(requestUrl);
                productUrl.searchParams.set('q', product.title);
                return nativeFetch(productUrl.toString(), init).then(async (productResponse) => ({
                  productResponse,
                  hasCards: hasProductCards(await productResponse.clone().text()),
                }));
              }),
          );
          const productMatch = productResponses.find(({ hasCards }) => hasCards);

          if (productMatch) return productMatch.productResponse;

          const suggestedTerms = await getSuggestedTerms(term);
          const suggestedResponses = await Promise.all(
            suggestedTerms
              .filter((suggestedTerm) => suggestedTerm.toLowerCase() !== term.toLowerCase())
              .map((suggestedTerm) => {
                const suggestedUrl = new URL(requestUrl);
                suggestedUrl.searchParams.set('q', suggestedTerm);
                return nativeFetch(suggestedUrl.toString(), init).then(async (suggestedResponse) => ({
                  suggestedResponse,
                  hasCards: hasProductCards(await suggestedResponse.clone().text()),
                }));
              }),
          );
          const suggestedMatch = suggestedResponses.find(({ hasCards }) => hasCards);

          if (suggestedMatch) return suggestedMatch.suggestedResponse;
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
