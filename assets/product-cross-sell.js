(function () {
  function closestParent(element, selector) {
    var node = element;
    while (node && node !== document) {
      if (node.matches && node.matches(selector)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function getGapValue(track) {
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap || '0');
    if (isNaN(gap)) {
      return 0;
    }
    return gap;
  }

  function setStatus(block, message, type) {
    var status = block.querySelector('[data-cross-sell-status]');
    if (!status) {
      return;
    }
    status.textContent = message || '';
    status.classList.remove('is-error');
    status.classList.remove('is-success');
    if (type === 'error') {
      status.classList.add('is-error');
    }
    if (type === 'success') {
      status.classList.add('is-success');
    }
  }

  function emitCartEvents(payload, triggerButton, openDrawer, emitPubSub, emitAjaxLikeEvent) {
    if (emitPubSub !== false && typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'cross-sell',
        productVariantId: null,
        cartData: payload,
      });
    }

    if (emitAjaxLikeEvent !== false) {
      document.dispatchEvent(
        new CustomEvent('ajaxProduct:added', {
          detail: {
            product: payload,
            addToCartBtn: triggerButton || null,
            crossSell: true,
          },
        })
      );
    }

    if (openDrawer) {
      var drawer = document.querySelector('cart-drawer');
      if (drawer && typeof drawer.open === 'function') {
        drawer.open(triggerButton || undefined);
      }
    }
  }

  function addItemsToCart(block, items, triggerButton, options) {
    if (!items.length) {
      setStatus(block, 'Select at least one product.', 'error');
      return;
    }
    var requestOptions = options || {};
    var openDrawer = block.getAttribute('data-open-drawer') === 'true';
    if (typeof requestOptions.openDrawer === 'boolean') {
      openDrawer = requestOptions.openDrawer;
    }
    var endpoint = '/cart/add.js';
    if (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) {
      endpoint = window.Shopify.routes.root + 'cart/add.js';
    }
    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.classList.add('is-loading');
    }
    setStatus(block, 'Adding...');
    function finishRequest() {
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.classList.remove('is-loading');
      }
    }
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        items: items,
      }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (errorData) {
            throw errorData;
          });
        }
        return response.json();
      })
      .then(function (payload) {
        setStatus(block, 'Added to cart.', 'success');
        emitCartEvents(
          payload,
          triggerButton,
          openDrawer,
          requestOptions.emitPubSub !== false,
          requestOptions.emitAjaxEvent
        );
        finishRequest();
      })
      .catch(function (error) {
        var message = (error && error.description) || 'Unable to add items right now. Please try again.';
        setStatus(block, message, 'error');
        finishRequest();
      });
  }

  function collectSelectedBatchItems(block) {
    var checkedInputs = block.querySelectorAll('[data-cross-sell-select]:checked');
    var items = [];
    var index;
    for (index = 0; index < checkedInputs.length; index += 1) {
      var input = checkedInputs[index];
      var itemElement = closestParent(input, '[data-cross-sell-item]');
      if (!itemElement) {
        continue;
      }
      var variantId = parseInt(itemElement.getAttribute('data-variant-id'), 10);
      if (!variantId) {
        continue;
      }
      var quantityInput = itemElement.querySelector('[data-cross-sell-qty]');
      var quantity = parseInt(quantityInput && quantityInput.value ? quantityInput.value : '1', 10);
      if (!quantity || quantity < 1) {
        quantity = 1;
      }
      items.push({
        id: variantId,
        quantity: quantity,
      });
    }
    return items;
  }

  function collectSelectedBatchItemsFromBlocks(blocks) {
    var merged = {};
    var blockIndex;
    for (blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
      var blockItems = collectSelectedBatchItems(blocks[blockIndex]);
      var itemIndex;
      for (itemIndex = 0; itemIndex < blockItems.length; itemIndex += 1) {
        var item = blockItems[itemIndex];
        var key = String(item.id);
        if (!merged[key]) {
          merged[key] = {
            id: item.id,
            quantity: 0,
          };
        }
        merged[key].quantity += item.quantity;
      }
    }
    return Object.keys(merged).map(function (key) {
      return merged[key];
    });
  }

  function getSelectionLimit(block) {
    if (!block) {
      return 0;
    }
    var limit = parseInt(block.getAttribute('data-selection-limit') || '0', 10);
    if (!limit || isNaN(limit) || limit < 1) {
      return 0;
    }
    return limit;
  }

  function getCheckedSelectableInputs(block) {
    if (!block) {
      return [];
    }
    return Array.prototype.slice.call(block.querySelectorAll('[data-cross-sell-select]:checked:not(:disabled)'));
  }

  function enforceSelectionLimit(block, changedInput) {
    var limit = getSelectionLimit(block);
    if (!limit) {
      return true;
    }
    var checkedInputs = getCheckedSelectableInputs(block);
    if (checkedInputs.length <= limit) {
      return true;
    }
    if (changedInput) {
      changedInput.checked = false;
      return false;
    }
    var index;
    for (index = limit; index < checkedInputs.length; index += 1) {
      checkedInputs[index].checked = false;
    }
    return true;
  }

  function updateSelectedState(input) {
    var itemElement = closestParent(input, '[data-cross-sell-item]');
    if (!itemElement) {
      return;
    }
    if (input.checked && !input.disabled) {
      itemElement.classList.add('is-selected');
    } else {
      itemElement.classList.remove('is-selected');
    }
  }

  function setupSelectionState(block) {
    var inputs = block.querySelectorAll('[data-cross-sell-select]');
    var preselectEnabled = block.getAttribute('data-preselect-enabled') === 'true';
    var index;
    for (index = 0; index < inputs.length; index += 1) {
      if (preselectEnabled) {
        inputs[index].checked = inputs[index].hasAttribute('checked');
      } else {
        inputs[index].checked = false;
      }
      updateSelectedState(inputs[index]);
      inputs[index].addEventListener('change', function (event) {
        var input = event.currentTarget;
        var allowed = enforceSelectionLimit(block, input);
        if (!allowed) {
          var limit = getSelectionLimit(block);
          if (limit) {
            setStatus(block, 'You can select up to ' + limit + ' products.', 'error');
          }
        } else {
          setStatus(block, '');
        }
        updateSelectedState(input);
      });
    }
    enforceSelectionLimit(block, null);
    for (index = 0; index < inputs.length; index += 1) {
      updateSelectedState(inputs[index]);
    }
  }

  function setupBatchAdd(block) {
    if (block.getAttribute('data-batch-behavior') !== 'button') {
      return;
    }
    var button = block.querySelector('[data-cross-sell-add-selected]');
    if (!button) {
      return;
    }
    button.addEventListener('click', function () {
      var items = collectSelectedBatchItems(block);
      addItemsToCart(block, items, button);
    });
  }

 function setupBatchWithMainProductAdd(block) {
  if (block.getAttribute('data-cta-mode') !== 'batch') return;
  if (block.getAttribute('data-batch-behavior') !== 'with_main_product') return;

  var form = document.querySelector('product-form form');

  if (!form || form.dataset.crossSellIntercept === 'true') return;

  form.dataset.crossSellIntercept = 'true';

  form.addEventListener('submit', function (event) {

    var crossSellItems = collectSelectedBatchItems(block);

    if (!crossSellItems.length) return;

    // ✅ STOP THE ORIGINAL REQUEST
    event.preventDefault();
    event.stopImmediatePropagation();

    // ✅ get main product data
    var formData = new FormData(form);

    var mainVariantId = parseInt(formData.get('id'), 10);
    var mainQty = parseInt(formData.get('quantity') || '1', 10);

    var items = [];

    if (mainVariantId) {
      items.push({
        id: mainVariantId,
        quantity: mainQty
      });
    }

    // ✅ merge cross-sell
    items = items.concat(crossSellItems);

    // ✅ SINGLE REQUEST
    addItemsToCart(block, items, event.submitter);

  }, true); // ✅ CAPTURE MODE (CRITICAL)
}

  function setupMainProductCrossSellOnly(block) {
    if (block.getAttribute('data-cta-mode') !== 'batch') {
      return;
    }
    if (block.getAttribute('data-batch-behavior') !== 'with_main_product') {
      return;
    }
    if (block.getAttribute('data-main-add-cross-sell-only') !== 'true') {
      return;
    }
    var blockSection = closestParent(block, 'product-info');
    if (!blockSection) {
      return;
    }
    var form = blockSection.querySelector('product-form form[data-type="add-to-cart-form"]');
    if (!form) {
      return;
    }
    if (!form._crossSellOverrideBlocks) {
      form._crossSellOverrideBlocks = [];
    }
    if (form._crossSellOverrideBlocks.indexOf(block) === -1) {
      form._crossSellOverrideBlocks.push(block);
    }
    if (form._crossSellOverrideReady === true) {
      return;
    }
    form._crossSellOverrideReady = true;
    form.addEventListener(
      'submit',
      function (event) {
        var registeredBlocks = form._crossSellOverrideBlocks || [];
        var eligibleBlocks = [];
        var index;
        for (index = 0; index < registeredBlocks.length; index += 1) {
          var candidate = registeredBlocks[index];
          if (!candidate || !document.body.contains(candidate)) {
            continue;
          }
          if (candidate.getAttribute('data-main-add-cross-sell-only') !== 'true') {
            continue;
          }
          if (candidate.getAttribute('data-cta-mode') !== 'batch') {
            continue;
          }
          if (candidate.getAttribute('data-batch-behavior') !== 'with_main_product') {
            continue;
          }
          eligibleBlocks.push(candidate);
        }
        if (!eligibleBlocks.length) {
          return;
        }
        var submitter = event.submitter || null;
        var triggerButton = null;
        var isMainAddSubmit = true;
        if (submitter && submitter.matches) {
          isMainAddSubmit = submitter.matches('[data-add-to-cart], [name="add"], .product-form__submit');
          if (isMainAddSubmit) {
            triggerButton = submitter;
          }
        } else {
          triggerButton = form.querySelector('[type="submit"][name="add"], .product-form__submit');
        }
        if (!isMainAddSubmit) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        var items = collectSelectedBatchItemsFromBlocks(eligibleBlocks);
        if (!items.length) {
          for (index = 0; index < eligibleBlocks.length; index += 1) {
            setStatus(eligibleBlocks[index], 'Select at least one product.', 'error');
          }
          return;
        }
        addItemsToCart(eligibleBlocks[0], items, triggerButton);
      },
      true
    );
  }

  function setupSingleAdd(block) {
    var buttons = block.querySelectorAll('[data-cross-sell-single-add]');
    var index;
    for (index = 0; index < buttons.length; index += 1) {
      buttons[index].addEventListener('click', function (event) {
        var button = event.currentTarget;
        var itemElement = closestParent(button, '[data-cross-sell-item]');
        if (!itemElement) {
          return;
        }
        var variantId = parseInt(itemElement.getAttribute('data-variant-id'), 10);
        if (!variantId) {
          return;
        }
        var quantityInput = itemElement.querySelector('[data-cross-sell-qty]');
        var quantity = parseInt(quantityInput && quantityInput.value ? quantityInput.value : '1', 10);
        if (!quantity || quantity < 1) {
          quantity = 1;
        }
        addItemsToCart(
          block,
          [
            {
              id: variantId,
              quantity: quantity,
            },
          ],
          button
        );
      });
    }
  }

  function setupQtyStepper(block) {
    var steppers = block.querySelectorAll('[data-cross-sell-stepper]');
    var i;
    for (i = 0; i < steppers.length; i += 1) {
      var stepper = steppers[i];
      if (stepper.getAttribute('data-stepper-ready') === 'true') {
        continue;
      }
      stepper.setAttribute('data-stepper-ready', 'true');
      var input = stepper.querySelector('[data-cross-sell-qty]');
      var minus = stepper.querySelector('[data-cross-sell-qty-minus]');
      var plus = stepper.querySelector('[data-cross-sell-qty-plus]');
      if (!input || !minus || !plus) {
        continue;
      }
      function clamp(val) {
        var min = parseInt(input.getAttribute('min') || '1', 10);
        var max = parseInt(input.getAttribute('max') || '20', 10);
        if (isNaN(min) || min < 1) {
          min = 1;
        }
        if (isNaN(max) || max < min) {
          max = 20;
        }
        if (val < min) {
          return min;
        }
        if (val > max) {
          return max;
        }
        return val;
      }
      function syncFromInput() {
        var v = parseInt(input.value, 10);
        if (isNaN(v) || v < 1) {
          v = 1;
        }
        input.value = String(clamp(v));
      }
      minus.addEventListener('click', function () {
        var v = parseInt(input.value, 10) || 1;
        input.value = String(clamp(v - 1));
      });
      plus.addEventListener('click', function () {
        var v = parseInt(input.value, 10) || 1;
        input.value = String(clamp(v + 1));
      });
      input.addEventListener('change', syncFromInput);
      input.addEventListener('blur', syncFromInput);
    }
  }

  function setupCarousel(block) {
    var layout = block.getAttribute('data-layout');
    var visual = block.getAttribute('data-visual-style') || '';
    var items = block.querySelectorAll('[data-cross-sell-item]');
    var multi = items.length > 1;
    var useCarousel = layout === 'carousel' || (visual === 'dark_promo' && multi);
    if (!useCarousel) {
      return;
    }
    if (visual === 'dark_promo' && multi && layout !== 'carousel') {
      block.classList.add('product-cross-sell--carousel');
    }
    var track = block.querySelector('[data-cross-sell-track]');
    var prev = block.querySelector('[data-cross-sell-prev]');
    var next = block.querySelector('[data-cross-sell-next]');
    if (!track || !prev || !next) {
      return;
    }
    function updateButtons() {
      var maxScroll = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll - 2;
    }
    function scrollByCard(direction) {
      var firstCard = track.querySelector('.product-cross-sell__item');
      var distance = track.clientWidth;
      if (firstCard) {
        distance = firstCard.getBoundingClientRect().width + getGapValue(track);
      }
      if (typeof track.scrollBy === 'function') {
        track.scrollBy({
          left: direction * distance,
          behavior: 'smooth',
        });
      } else {
        track.scrollLeft += direction * distance;
      }
    }
    prev.addEventListener('click', function () {
      scrollByCard(-1);
    });
    next.addEventListener('click', function () {
      scrollByCard(1);
    });
    track.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);
    updateButtons();
  }

  function setupBlock(block) {
    if (!block || block.getAttribute('data-cross-sell-ready') === 'true') {
      return;
    }
    block.setAttribute('data-cross-sell-ready', 'true');
    setupSelectionState(block);
    setupQtyStepper(block);
    setupBatchAdd(block);
    setupMainProductCrossSellOnly(block);
    setupBatchWithMainProductAdd(block);
    setupSingleAdd(block);
    setupCarousel(block);
  }

  function initCrossSellBlocks(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var blocks = root.querySelectorAll('[data-cross-sell-block]');
    var index;
    for (index = 0; index < blocks.length; index += 1) {
      setupBlock(blocks[index]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initCrossSellBlocks(document);
    });
  } else {
    initCrossSellBlocks(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initCrossSellBlocks(event.target);
  });

  document.addEventListener('quickview:loaded', function () {
    initCrossSellBlocks(document);
  });
})();
