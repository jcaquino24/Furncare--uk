(function () {
  const storageKey = 'furncare-wishlist';

  function getWishlist() {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveWishlist(wishlist) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(wishlist));
    } catch (error) {
      console.error('Unable to save wishlist', error);
    }
  }

  function setCount(count) {
    document.querySelectorAll('[data-wishlist-count]').forEach((element) => {
      element.textContent = count;
      element.hidden = count === 0;
    });
  }

  function setButton(button, active) {
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute(
      'aria-label',
      `${active ? 'Remove' : 'Add'} ${button.dataset.productTitle} ${active ? 'from' : 'to'} wishlist`,
    );
  }

  function syncButtons(wishlist) {
    const ids = wishlist.map((item) => String(item.id));
    document.querySelectorAll('[data-wishlist-button]').forEach((button) => {
      setButton(button, ids.includes(String(button.dataset.productId)));
    });
    setCount(wishlist.length);
  }

  function renderWishlistPage(wishlist) {
    const page = document.querySelector('[data-wishlist-page]');
    if (!page) return;

    const content = page.querySelector('[data-wishlist-content]');
    if (!wishlist.length) {
      content.innerHTML = '<p>Your wishlist is empty.</p><a class="button button--primary" href="/collections/all">Browse products</a>';
      return;
    }

    content.innerHTML = wishlist.map((item) => `
      <article class="wishlist-item">
        <a href="${item.url}">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" loading="lazy">` : ''}
          <h2>${item.title}</h2>
        </a>
        <button type="button" class="button button--underline" data-wishlist-remove="${item.id}">Remove</button>
      </article>
    `).join('');
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-button]');
    if (!button) return;

    const wishlist = getWishlist();
    const productId = String(button.dataset.productId);
    const index = wishlist.findIndex((item) => String(item.id) === productId);
    if (index === -1) {
      wishlist.push({
        id: productId,
        title: button.dataset.productTitle,
        url: button.dataset.productUrl,
        image: button.dataset.productImage,
      });
    } else {
      wishlist.splice(index, 1);
    }
    saveWishlist(wishlist);
    syncButtons(wishlist);
    renderWishlistPage(wishlist);
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-remove]');
    if (!button) return;
    const wishlist = getWishlist().filter((item) => String(item.id) !== String(button.dataset.wishlistRemove));
    saveWishlist(wishlist);
    syncButtons(wishlist);
    renderWishlistPage(wishlist);
  });

  const wishlist = getWishlist();
  syncButtons(wishlist);
  renderWishlistPage(wishlist);
})();