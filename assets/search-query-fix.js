const nativeFetch = window.fetch.bind(window);
const buildSearchQuery = (term) => `${term} OR variants.sku:${term}`;
const buildSearchUrl = (term) => `${window.location.origin}/search?options[prefix]=last&q=${encodeURIComponent(buildSearchQuery(term))}`;

window.fetch = (input, init) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input.url, window.location.origin);

  if (requestUrl.pathname === '/search' && requestUrl.searchParams.get('view') === 'condensed') {
    const term = requestUrl.searchParams.get('q')?.trim();

    if (term) {
      requestUrl.searchParams.set('type', 'product');
      requestUrl.searchParams.set('options[prefix]', 'last');
      requestUrl.searchParams.set('q', `${term} OR variants.sku:${term}`);

      return nativeFetch(requestUrl.toString(), init);
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
