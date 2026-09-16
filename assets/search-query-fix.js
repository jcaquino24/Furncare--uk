const nativeFetch = window.fetch.bind(window);
const buildSearchUrl = (term) => `${window.location.origin}/search?options[prefix]=last&q=${encodeURIComponent(term)}`;

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

        if (responseBody.includes('product-card')) return response;

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
