(function () {

  function closestParent(element, selector) {
    var node = element;
    while (node && node !== document) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  function setStatus(block, message, type) {
    var status = block.querySelector('[data-cross-sell-status]');
    if (!status) return;
    status.textContent = message || '';
    status.classList.remove('is-error', 'is-success');
    if (type) status.classList.add(type);
  }

  function openDrawerAndRefresh() {
    fetch('/?sections=minicart')
      .then(res => res.json())
      .then(data => {
        var container = document.querySelector('[data-minicart-main]') || 
                       document.querySelector('uwp-minicart [data-minicart]') ||
                       document.querySelector('[role="complementary"][aria-label*="cart" i]');
        if (container && data.minicart) {
          container.innerHTML = data.minicart;
        }
      })
      .then(() => {
        // Open the cart drawer by adding the class to body
        document.body.classList.add('minicart-is-open');
        
        // Also try to trigger the uwp-minicart component's open method if it exists
        var minicart = document.querySelector('uwp-minicart');
        if (minicart && typeof minicart.openCart === 'function') {
          minicart.openCart();
        }
      })
      .catch(err => {
        console.error('Error opening cart drawer:', err);
      });
  }

  function addItemsToCart(block, items, triggerButton) {
    if (!items.length) {
      setStatus(block, 'Select at least one product.', 'error');
      return;
    }

    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.classList.add('is-loading');
    }

    setStatus(block, 'Adding...');

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ items })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to add items to cart: ' + res.status);
        }
        return res.json();
      })
      .then(() => {
        setStatus(block, 'Added to cart.', 'success');
        openDrawerAndRefresh();
      })
      .catch((error) => {
        console.error('Error adding to cart:', error);
        setStatus(block, 'Error adding to cart.', 'error');
      })
      .finally(() => {
        if (triggerButton) {
          triggerButton.disabled = false;
          triggerButton.classList.remove('is-loading');
        }
      });
  }

  function collectSelectedBatchItems(block) {
    var checked = block.querySelectorAll('[data-cross-sell-select]:checked');
    var items = [];

    checked.forEach(function (input) {
      var itemEl = closestParent(input, '[data-cross-sell-item]');
      if (!itemEl) return;

      var variantId = parseInt(itemEl.getAttribute('data-variant-id'));
      if (!variantId) return;

      var qtyInput = itemEl.querySelector('[data-cross-sell-qty]');
      var qty = parseInt(qtyInput?.value || '1');

      items.push({
        id: variantId,
        quantity: qty > 0 ? qty : 1
      });
    });

    return items;
  }

  function setupSingleAdd(block) {
    block.querySelectorAll('[data-cross-sell-single-add]').forEach(btn => {
      btn.addEventListener('click', function () {
        var item = closestParent(btn, '[data-cross-sell-item]');
        if (!item) return;

        var id = parseInt(item.getAttribute('data-variant-id'));
        if (!id) return;

        var qty = parseInt(item.querySelector('[data-cross-sell-qty]')?.value || '1');

        addItemsToCart(block, [{ id, quantity: qty }], btn);
      });
    });
  }

  function setupBatchAdd(block) {
    var btn = block.querySelector('[data-cross-sell-add-selected]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var items = collectSelectedBatchItems(block);
      addItemsToCart(block, items, btn);
    });
  }

  function setupBlock(block) {
    if (block.dataset.ready) return;
    block.dataset.ready = true;

    setupSingleAdd(block);
    setupBatchAdd(block);
  }

  function init() {
    document.querySelectorAll('[data-cross-sell-block]').forEach(setupBlock);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);


  // ✅ ✅ ✅ FETCH INTERCEPT (MAIN PRODUCT ADD FIX)
  const originalFetch = window.fetch;

  window.fetch = function (url, options) {

    if (typeof url === 'string' && url.includes('/cart/add')) {
      try {
        if (options && options.body) {

          let body = JSON.parse(options.body);

          // only for main product adds
          if (!body.items && body.id) {

            const block = document.querySelector('[data-cross-sell-block]');
            if (block) {

              const extraItems = collectSelectedBatchItems(block);

              if (extraItems.length) {

                body = {
                  items: [
                    {
                      id: body.id,
                      quantity: body.quantity || 1
                    },
                    ...extraItems
                  ]
                };

                options.body = JSON.stringify(body);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Cross-sell merge error:', e);
      }
    }

    return originalFetch.apply(this, arguments)
      .then(function (response) {

        // ✅ AFTER MAIN ADD → refresh + open drawer (only on success)
        if (typeof url === 'string' && url.includes('/cart/add') && response.ok) {
          openDrawerAndRefresh();
        }

        return response;
      })
      .catch(function (error) {
        console.error('Fetch error:', error);
        throw error;
      });

  };

})();