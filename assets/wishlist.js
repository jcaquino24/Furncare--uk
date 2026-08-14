(function () {
  const endpoint = '/apps/furncare-wishlist';
  const loginUrl = '/account/login?return_url=' + encodeURIComponent(window.location.pathname);

  function setCount(count) {
    document.querySelectorAll('[data-wishlist-count]').forEach((element) => {
      element.textContent = count;
      element.hidden = count === 0;
    });
  }

  function setButton(button, active) {
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
  }

  async function updateWishlist(button) {
    if (button.dataset.requiresLogin === 'true') {
      window.location.href = loginUrl;
      return;
    }

    const active = button.getAttribute('aria-pressed') === 'true';
    button.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ product_id: button.dataset.productId, action: active ? 'remove' : 'add' }),
      });
      if (!response.ok) throw new Error('Wishlist request failed');

      const result = await response.json();
      setButton(button, result.active);
      setCount(Number(result.count) || 0);
    } catch (error) {
      console.error(error);
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-button]');
    if (button) updateWishlist(button);
  });
})();