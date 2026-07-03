(function () {
  const settings = window.quotePrintSettings || {
    locale: 'en-GB',
    currency: 'GBP'
  };

  const formatter = new Intl.NumberFormat(settings.locale, {
    style: 'currency',
    currency: settings.currency,
    minimumFractionDigits: 2
  });

  function formatMoney(amount) {
    return formatter.format(amount / 100);
  }

  function renderCartItems(cart) {
    if (!cart || !cart.items || !cart.items.length) {
      return '<p class="quote-print__empty">Your cart is empty. Add items to your cart and refresh this page.</p>';
    }

    return `
      <div class="quote-print__summary">
        <div class="quote-print__summary-row quote-print__summary-row--header">
          <span>Product</span>
          <span>Quantity</span>
          <span>Line total</span>
        </div>
        ${cart.items.map((item) => {
          const imageUrl = item.image || item.featured_image || '';
          const title = item.product_title || item.title;
          const options = item.options_with_values || [];
          const optionsText = options
            .filter((option) => option.value && option.value !== 'Default Title')
            .map((option) => `<span class="quote-print__option">${option.name}: ${option.value}</span>`)
            .join('');

          return `
            <div class="quote-print__summary-row">
              <div class="quote-print__product">
                ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="quote-print__product-image">` : ''}
                <div>
                  <strong>${title}</strong>
                  ${optionsText ? `<div class="quote-print__options">${optionsText}</div>` : ''}
                </div>
              </div>
              <span>${item.quantity}</span>
              <span>${formatMoney(item.line_price)}</span>
            </div>`;
        }).join('')}
        <div class="quote-print__summary-total">
          <span>Total</span>
          <span>${cart.item_count}</span>
          <span>${formatMoney(cart.total_price)}</span>
        </div>
      </div>`;
  }

  function init() {
    const container = document.getElementById('quote-print-items');
    const printButton = document.getElementById('quote-print-button');
    if (!container || !printButton) return;

    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        container.innerHTML = renderCartItems(cart);
      })
      .catch(() => {
        container.innerHTML = '<p class="quote-print__empty">Unable to load cart items. Please refresh.</p>';
      });

    printButton.addEventListener('click', function () {
      window.print();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
