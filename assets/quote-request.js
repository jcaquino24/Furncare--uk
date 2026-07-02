(function () {
  const settings = window.quoteRequestSettings || {
    locale: 'en-GB',
    currency: 'GBP',
    storageKey: 'furncare_quote_requests'
  };

  const formatter = new Intl.NumberFormat(settings.locale, {
    style: 'currency',
    currency: settings.currency,
    minimumFractionDigits: 2
  });

  function formatMoney(amount) {
    return formatter.format(amount / 100);
  }

  function getQuoteHistory() {
    try {
      return JSON.parse(window.localStorage.getItem(settings.storageKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveQuoteHistory(entry) {
    try {
      const history = getQuoteHistory();
      history.unshift(entry);
      window.localStorage.setItem(settings.storageKey, JSON.stringify(history.slice(0, 20)));
    } catch (error) {
      // ignore localStorage failures
    }
  }

  function renderQuoteRows(items) {
    return items.map((item) => {
      const title = item.product_title || item.title;
      const options = item.options_with_values || [];
      const optionsText = options
        .filter((option) => option.value && option.value !== 'Default Title')
        .map((option) => `\n  ${option.name}: ${option.value}`)
        .join('');

      return `
        <li class="quote-request__item">
          <span class="quote-request__item-title">${title}</span>
          <span class="quote-request__item-meta">Qty: ${item.quantity} · ${formatMoney(item.line_price)}</span>
          ${optionsText ? `<span class="quote-request__item-options">${optionsText}</span>` : ''}
        </li>`;
    }).join('');
  }

  function renderQuoteSummary(cart) {
    const target = document.querySelector('#quote-request-summary .quote-request__summary-body');
    if (!target) return;

    if (!cart || cart.item_count === 0) {
      target.innerHTML = '<p class="quote-request__empty">Your quote basket is empty. Add items to your cart first, then come back to request a quote.</p>';
      const submitBtn = document.querySelector('.quote-request__form button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    target.innerHTML = `
      <ul class="quote-request__items">${renderQuoteRows(cart.items)}</ul>
      <div class="quote-request__summary-total">
        <strong>Total estimate:</strong>
        <span>${formatMoney(cart.total_price)}</span>
      </div>
    `;

    updateHiddenBody(cart);
  }

  function buildQuoteText(cart) {
    if (!cart || cart.item_count === 0) {
      return 'Quote basket is empty.';
    }

    const itemsText = cart.items
      .map((item, index) => {
        const title = item.product_title || item.title;
        const options = (item.options_with_values || [])
          .filter((option) => option.value && option.value !== 'Default Title')
          .map((option) => `    ${option.name}: ${option.value}`)
          .join('\n');

        return `${index + 1}. ${title}\n  Quantity: ${item.quantity}\n  Line price: ${formatMoney(item.line_price)}${options ? `\n${options}` : ''}`;
      })
      .join('\n\n');

    const customerName = document.querySelector('#quote-first-name')?.value || '';
    const email = document.querySelector('#quote-email')?.value || '';
    const phone = document.querySelector('#quote-phone')?.value || '';
    const company = document.querySelector('#quote-company')?.value || '';
    const message = document.querySelector('#quote-message')?.value || '';

    return `Quote request details:\n\n${itemsText}\n\nSubtotal: ${formatMoney(cart.total_price)}\n\nCustomer details:\nName: ${customerName}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company}\n\nAdditional information:\n${message}`;
  }

  function updateHiddenBody(cart) {
    const bodyField = document.getElementById('quote-request-body');
    if (!bodyField) return;
    bodyField.value = buildQuoteText(cart);
  }

  function attachFormListeners(cart) {
    const form = document.querySelector('.quote-request__form');
    if (!form) return;

    const inputs = form.querySelectorAll('#quote-email, #quote-first-name, #quote-phone, #quote-company, #quote-message');
    inputs.forEach((input) => {
      input.addEventListener('input', () => updateHiddenBody(cart));
    });

    form.addEventListener('submit', function () {
      const quote = {
        id: `quote-${Date.now()}`,
        submitted_at: new Date().toISOString(),
        email: form.querySelector('#quote-email')?.value || '',
        name: form.querySelector('#quote-first-name')?.value || '',
        phone: form.querySelector('#quote-phone')?.value || '',
        company: form.querySelector('#quote-company')?.value || '',
        note: form.querySelector('#quote-message')?.value || '',
        total_price: cart.total_price,
        item_count: cart.item_count,
        items: cart.items.map((item) => ({
          title: item.product_title || item.title,
          quantity: item.quantity,
          line_price: item.line_price
        }))
      };
      saveQuoteHistory(quote);
    });
  }

  function renderQuoteHistory() {
    const container = document.getElementById('quote-history');
    if (!container) return;

    const history = getQuoteHistory();
    if (!history.length) {
      container.innerHTML = '<p class="account__quote-empty">Your quote requests will appear here once you submit a quote request.</p>';
      return;
    }

    container.innerHTML = history.map((quote) => {
      const rows = quote.items
        .map((item) => `<li>${item.title} — Qty: ${item.quantity} — ${formatMoney(item.line_price)}</li>`)
        .join('');

      return `
        <article class="account__quote-item">
          <div class="account__quote-meta">
            <strong>${quote.name || quote.email}</strong>
            <span>${new Date(quote.submitted_at).toLocaleDateString(settings.locale)}</span>
            <span>${formatMoney(quote.total_price)}</span>
          </div>
          <ul class="account__quote-items">${rows}</ul>
          <p>${quote.note ? `Notes: ${quote.note}` : ''}</p>
        </article>`;
    }).join('');
  }

  function initQuoteRequestPage() {
    const summary = document.getElementById('quote-request-summary');
    if (!summary) return;

    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        renderQuoteSummary(cart);
        attachFormListeners(cart);
      })
      .catch(() => {
        const target = document.querySelector('#quote-request-summary .quote-request__summary-body');
        if (target) target.innerHTML = '<p class="quote-request__empty">Unable to load your quote items right now. Please refresh the page.</p>';
      });
  }

  function initQuoteHistoryPage() {
    if (!document.getElementById('quote-history')) return;
    renderQuoteHistory();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initQuoteRequestPage();
    initQuoteHistoryPage();
  });
})();
