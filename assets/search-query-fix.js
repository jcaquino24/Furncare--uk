const nativeFetch = window.fetch.bind(window);
const buildSearchUrl = (term) => `${window.location.origin}/search?q=${encodeURIComponent(term)}`;
const hasProductResults = (html) => /<article\b[^>]*class="[^"]*\bproduct-card\b/.test(html);
const findSearchQuery = async (term) => {
  try {
    const response = await nativeFetch(`${window.location.origin}/search?view=condensed&q=${encodeURIComponent(term)}`);
    const responseBody = await response.text();

    return response.ok && hasProductResults(responseBody) ? term : `variants.sku:${term}`;
  } catch {
    return term;
  }
};

window.fetch = (input, init) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input.url, window.location.origin);

  if (requestUrl.pathname.endsWith('/search') && requestUrl.searchParams.get('view') === 'condensed') {
    const term = requestUrl.searchParams.get('q')?.trim();

    if (term) {
      return nativeFetch(input, init).then(async (response) => {
        const responseBody = await response.clone().text();

        if (hasProductResults(responseBody)) return response;

        requestUrl.searchParams.set('q', `variants.sku:${term}`);
        return nativeFetch(requestUrl.toString(), init);
      });
    }
  }

  return nativeFetch(input, init);
};

customElements.whenDefined('uwp-search-input').then(() => {
  const SearchInput = customElements.get('uwp-search-input');

  SearchInput.prototype.submitSearch = async function (term) {
    const query = await findSearchQuery(term);
    this.closeSearchResults();
    window.location.href = buildSearchUrl(query);
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
  findSearchQuery(term).then((query) => {
    window.location.href = buildSearchUrl(query);
  });
}, true);
