import { r as S, i as w } from "./uwp.utils.nmjlQhSZ.js";

class y {
    constructor(e) {
        this.config = e;
    }
    async executeSearch(e) {
        if (!e || "string" != typeof e || e.length < 3) throw new Error("Search query must be a non-empty string with at least 3 characters.");
        const t = this.getSearchUrl(e);
        try {
            const e = await fetch(t);
            if (!e.ok) throw new Error(`HTTP error! status: ${e.status}`);
            const s = await e.json();
            return S(s.resources.results);
        } catch (e) {
            throw console.error("Error fetching data: ", e), e;
        }
    }
    getSearchUrl(e) {
        let t = `/search/suggest.json?q=${encodeURIComponent(e)}`;
        const {resources: s, limit: i, unavailable_products: n, fields: l, prefix: r} = this.config.SearchAPISearchOptions;
        return s && (t += `&resources[type]=${s.join(",")}`), i && (t += `&resources[limit]=${i}`), 
        n && (t += `&resources[unavailable_products]=${n}`), l && l.length > 0 && (t += `&resources[fields]=${l.join(",")}`), 
        r && (t += `&resources[options][prefix]=${r}`), t;
    }
}

class L extends HTMLElement {
    constructor() {
        super(), this.searchButton = null, this.viewAllButton = null, this.waitingResults = null, 
        this.hasResults = null, this.noResults = null, this.suggestionColumn = null, this.collectionColumn = null, 
        this.productColumn = null, this.viewAllTermsEl = null, this.noResultsTermsEl = null, 
        this.headerInner = null, this.headerWasTransparent = !1, this.bodyScrollLocked = !1, 
        this.apiConfig = {
            SearchAPISearchOptions: {
                resources: [ "query", "collection", "product", "page" ],
                unavailable_products: "hide",
                fields: [],
                limit: 4,
                prefix: "last"
            }
        }, this.searchHandler = new y(this.apiConfig), this.debouncedSearch = this.debounce(e => this.getSearchResults(e), 300);
    }
    lockBodyScroll() {
        if (this.bodyScrollLocked) return;
        const e = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden", e > 0 && (document.body.style.paddingRight = `${e}px`), 
        this.bodyScrollLocked = !0;
    }
    unlockBodyScroll() {
        this.bodyScrollLocked && (document.body.style.overflow = "", document.body.style.paddingRight = "", 
        this.bodyScrollLocked = !1);
    }
    closeSearchResults() {
        var e;
        null == (e = this.resultsParent) || e.classList.remove("is-open"), this.classList.remove("is-active"), 
        this.unlockBodyScroll(), document.body.classList.remove("search-is-open"), this.headerInner && this.headerWasTransparent && (this.headerInner.classList.add("is-transparent"), 
        this.headerWasTransparent = !1), this.dispatchEvent(new CustomEvent("search-input-state-change", {
            detail: {
                isActive: !1
            },
            bubbles: !0
        }));
    }
    connectedCallback() {
        this.cacheDomElements(), this.headerInner = document.querySelector(".header__inner"), 
        this.setEventListeners(), this.setInitialValueFromUrl(), this.setVisibilityChangeListener();
    }
    cacheDomElements() {
        if (this.searchInput = this.querySelector("[js-search-input='input']"), !this.searchInput) throw new Error("search input is a required element");
        this.searchButton = this.querySelector("[js-search-input='button']"), this.viewAllButton = this.querySelector("[js-instant-search='view-all']"), 
        this.resultsParent = this.querySelector("[js-instant-search='results-parent']"), 
        this.waitingResults = this.querySelector('[js-instant-search="waiting-input"]'), 
        this.hasResults = this.querySelector('[js-instant-search="has-results"]'), this.noResults = this.querySelector('[js-instant-search="no-results"]'), 
        this.suggestionColumn = this.querySelector("[js-instant-search='suggestions']"), 
        this.collectionColumn = this.querySelector("[js-instant-search='collections']"), 
        this.productColumn = this.querySelector("[js-instant-search='products']"), this.viewAllTermsEl = this.querySelector(".instant-search-results__view-all-text__terms"), 
        this.noResultsTermsEl = this.querySelector(".instant-search-results__no-results-text__terms"), 
        this.productCardTemplate = this.querySelector("[js-instant-search='product-card-template']");
    }
    setVisibilityChangeListener() {
        document.addEventListener("visibilitychange", () => {
            var e;
            document.hidden && null != (e = this.resultsParent) && e.classList.contains("is-open");
        });
    }
    setEventListeners() {
        var e, t, s, i, n;
        null == (e = this.searchInput) || e.addEventListener("input", this.handleSearchInput.bind(this)), 
        null == (t = this.searchInput) || t.addEventListener("focusin", () => {
            var e, t, s;
            null == (e = this.resultsParent) || e.classList.add("is-open");
            const i = (null == (t = this.searchInput) ? void 0 : t.value) || "";
            this.getSearchResults(i), i.trim() || null == (s = this.waitingResults) || s.classList.remove("visually-hidden"), 
            this.headerInner && this.headerInner.classList.contains("is-transparent") && (this.headerWasTransparent = !0, 
            this.headerInner.classList.remove("is-transparent")), this.lockBodyScroll(), document.body.classList.add("search-is-open"), 
            w() && this.classList.add("is-active"), this.dispatchEvent(new CustomEvent("search-input-state-change", {
                detail: {
                    isActive: !0
                },
                bubbles: !0
            }));
        }), null == (s = this.searchInput) || s.addEventListener("keydown", e => {
            var t, s;
            if ("Enter" === e.key) {
                e.preventDefault();
                const i = null == (s = null == (t = this.searchInput) ? void 0 : t.value) ? void 0 : s.trim();
                i && i.length > 0 && this.submitSearch(i);
            }
        }), this.addEventListener("focusout", e => {
            var t;
            const s = e.relatedTarget;
            !s || null != (t = this.resultsParent) && t.contains(s) || this.contains(s) || setTimeout(() => {
                var e, t;
                (null == (e = this.searchInput) || !e.matches(":focus")) && (null == (t = this.resultsParent) || !t.contains(document.activeElement)) && this.closeSearchResults();
            }, 100);
        }), null == (i = this.searchButton) || i.addEventListener("click", e => {
            var t, s;
            if (w()) {
                if (!this.classList.contains("is-active")) return;
                e.preventDefault(), this.searchInput && (this.searchInput.value = "", null == (t = this.searchInput) || t.blur()), 
                null == (s = this.resultsParent) || s.classList.remove("is-open"), this.classList.remove("is-active"), 
                this.unlockBodyScroll(), document.body.classList.remove("search-is-open"), this.updateUrlQuery("");
            }
        });
        const l = this.querySelector("[js-instant-search='close']");
        null == l || l.addEventListener("click", () => {
            this.closeSearchResults();
        });
        const r = this.querySelector("[js-search-input='reset']");
        r && r.addEventListener("click", e => {
            e.preventDefault(), e.stopPropagation(), this.searchInput && (this.searchInput.value = "", 
            this.resetSuggestions(), this.updateUrlQuery(""), this.renderResultsPanel(""), this.clearExistingSearchResults(), 
            this.closeSearchResults());
        }), null == (n = this.viewAllButton) || n.addEventListener("click", () => {
            var e;
            const t = (null == (e = this.searchInput) ? void 0 : e.value) || "";
            window.location.href = `${window.location.origin}/search?q=${encodeURIComponent(t)}*`;
        }), document.addEventListener("click", e => {
            var t;
            const s = e.target, i = e.target.parentElement;
            !this.contains(s) && (null == (t = this.resultsParent) || !t.contains(s)) && (null == i || !i.hasAttribute("js-header")) && this.closeSearchResults();
        });
    }
    submitSearch(e) {
        this.closeSearchResults(), window.location.href = `${window.location.origin}/search?q=${encodeURIComponent(e)}*`;
    }
    isResultsEmpty(e) {
        return !(e.queries && e.queries.length > 0 || e.pages && e.pages.length > 0 || e.collections && e.collections.length > 0 || e.products && e.products.length > 0);
    }
    highlightSearchTerm(e, t, s) {
        if (!s.trim()) return void (e.innerHTML = t);
        const i = s.toLowerCase(), n = t.toLowerCase().indexOf(i);
        if (-1 === n) return void (e.innerHTML = t);
        const l = t.substring(0, n), r = t.substring(n, n + s.length), a = t.substring(n + s.length);
        e.innerHTML = `${l}<mark class="search-highlight">${r}</mark>${a}`;
    }
    filterAndHighlightSuggestions(e) {
        const t = this.querySelector('[js-instant-search="suggestions"] .instant-search-results__results');
        if (!t) return;
        const s = t.querySelectorAll("a[data-suggestion-text]"), i = e.toLowerCase().trim();
        s.forEach(t => {
            const s = t, n = s.getAttribute("data-suggestion-text") || "", l = s.querySelector("span");
            if (!l) return;
            const r = n.toLowerCase();
            "" === i || r.includes(i) ? (s.style.display = "", this.highlightSearchTerm(l, n, e)) : s.style.display = "none";
        });
    }
    resetSuggestions() {
        const e = this.querySelector('[js-instant-search="suggestions"] .instant-search-results__results');
        e && e.querySelectorAll("a[data-suggestion-text]").forEach(e => {
            const t = e;
            t.style.display = "";
            const s = t.querySelector("span"), i = t.getAttribute("data-suggestion-text") || "";
            s && (s.innerHTML = i);
        });
    }
    setColumnVisible(e, t) {
        e && e.classList.toggle("visually-hidden", !t);
    }
    normalizeSearchTerm(e) {
        return (e || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\s-]+/gu, " ").replace(/\s+/g, " ").trim();
    }
    tokenizeSearchTerm(e) {
        const t = this.normalizeSearchTerm(e);
        return t ? t.split(" ").filter(Boolean) : [];
    }
    isTokenCloseMatch(e, t) {
        if (!e || !t) return !1;
        if (e === t || e.startsWith(t) || t.startsWith(e)) return !0;
        if (Math.abs(e.length - t.length) > 1) return !1;
        let s = 0, i = 0, n = 0;
        for (;s < e.length && i < t.length; ) if (e[s] === t[i]) s++, i++; else {
            if (n++, n > 1) return !1;
            e.length > t.length ? s++ : (t.length > e.length || s++, i++);
        }
        return (s < e.length || i < t.length) && n++, n <= 1;
    }
    doesTitleMatchSearch(e, t) {
        const s = this.tokenizeSearchTerm(e);
        if (!s.length) return !1;
        const i = s.join(" ");
        return t.some(e => {
            const t = this.tokenizeSearchTerm(e);
            if (!t.length) return !1;
            const n = t.join(" ");
            return !!i.includes(n) || t.every(e => s.some(t => this.isTokenCloseMatch(t, e)));
        });
    }
    buildProductQueryCandidates(e, t, s, i) {
        const n = [], l = e => {
            e && "string" == typeof e && e.trim().length >= 3 && !n.includes(e.trim()) && n.push(e.trim());
        };
        l(e), l(s), l(i), [ ...(t.queries || []).slice(0, 3), ...(t.products || []).slice(0, 3) ].forEach(e => l((e => e && ((null == e ? void 0 : e.title) ?? (null == e ? void 0 : e.text) ?? (null == e ? void 0 : e.query) ?? ""))(e)));
        const r = this.normalizeSearchTerm(e), a = this.tokenizeSearchTerm(e), o = a[a.length - 1];
        return r && l(r), o && o.length >= 4 && l(`${o.slice(0, -1)}*`), r && r.length >= 4 && l(`${r.slice(0, -1)}*`), 
        n;
    }
    async fetchCondensedProducts(e, t) {
        for (const s of e) {
            const e = await fetch(`${window.location.origin}/search?view=condensed&q=${encodeURIComponent(s)}`);
            if (!e.ok) continue;
            const i = await e.text(), n = document.createElement("template");
            n.innerHTML = i.trim();
            const l = Array.from(n.content.querySelectorAll(".product-card")).map(e => {
                const t = e.querySelector(".product-card__title a, .product-card__title");
                return (null == t ? void 0 : t.textContent) ? t.textContent.trim() : "";
            }).filter(Boolean);
            if (l.some(e => this.doesTitleMatchSearch(e, t))) return {
                html: i,
                hasResults: !0
            };
        }
        return {
            html: "",
            hasResults: !1
        };
    }
    renderResultsPanel(e, t) {
        var s, i, n, l, r, a, o, c, u, h, d, m;
        return e ? t ? void (this.isResultsEmpty(t) ? (null == (h = this.waitingResults) || h.classList.add("visually-hidden"), 
        null == (d = this.hasResults) || d.classList.add("visually-hidden"), null == (m = this.noResults) || m.classList.remove("visually-hidden"), 
        this.viewAllTermsEl && (this.viewAllTermsEl.textContent = e), this.noResultsTermsEl && (this.noResultsTermsEl.textContent = e)) : (null == (o = this.waitingResults) || o.classList.add("visually-hidden"), 
        null == (c = this.hasResults) || c.classList.remove("visually-hidden"), null == (u = this.noResults) || u.classList.add("visually-hidden"), 
        this.viewAllTermsEl && (this.viewAllTermsEl.textContent = e))) : (null == (l = this.waitingResults) || l.classList.add("visually-hidden"), 
        null == (r = this.hasResults) || r.classList.add("visually-hidden"), null == (a = this.noResults) || a.classList.remove("visually-hidden"), 
        void (this.noResultsTermsEl && (this.noResultsTermsEl.textContent = e))) : (null == (s = this.waitingResults) || s.classList.remove("visually-hidden"), 
        null == (i = this.hasResults) || i.classList.add("visually-hidden"), void (null == (n = this.noResults) || n.classList.add("visually-hidden")));
    }
    async getSearchResults(e) {
        if (e.trim()) try {
            const t = e.trim(), s = [ t, ...this.getFallbackQueries(t) ], i = [];
            let n = null, l = t;
            for (const t of s) if (t && !i.includes(t)) try {
                i.push(t);
                const e = await this.searchHandler.executeSearch(t);
                if (n = e, l = t, !this.isResultsEmpty(e)) break;
            } catch (e) {}
            this.renderResultsPanel(t, n), this.clearExistingSearchResults(), this.renderSearchResults(n || {
                queries: [],
                products: [],
                collections: [],
                pages: []
            }, t, l);
        } catch (e) {
            throw e instanceof Error ? e : new Error(String(e));
        } else this.renderResultsPanel("");
    }
    getFallbackQueries(e) {
        const t = e.trim().replace(/\s+/g, " "), s = [];
        if (!t) return s;
        const i = t.replace(/[^\p{L}\p{N}\s-]+/gu, "").trim();
        return i && i !== t && s.push(i), t.length >= 4 && s.push(`${t.slice(0, -1)}*`), 
        i.length >= 4 && i !== t && s.push(`${i.slice(0, -1)}*`), s;
    }
    handleSearchInput(e) {
        var t;
        const s = e.target.value;
        null == (t = this.resultsParent) || t.classList.add("is-open"), this.filterAndHighlightSuggestions(s), 
        this.updateUrlQuery(s), s.trim().length >= 3 ? this.debouncedSearch(s) : 0 === s.trim().length && this.renderResultsPanel("");
    }
    setInitialValueFromUrl() {
        const e = new URLSearchParams(window.location.search).get("q");
        e && this.setAttribute("query", e);
    }
    updateUrlQuery(e) {
        const t = new URLSearchParams(window.location.search);
        "" !== e.trim() ? t.set("q", e) : t.delete("q");
        const s = `${window.location.pathname}?${t.toString()}${window.location.hash}`;
        window.history.pushState({
            path: s
        }, "", s);
    }
    clearExistingSearchResults() {
        const e = e => {
            const t = null == e ? void 0 : e.querySelector(".instant-search-results__results");
            null == t || t.replaceChildren();
        };
        e(this.suggestionColumn), e(this.collectionColumn), e(this.productColumn);
    }
    escapeHtml(e) {
        return ("" + (e || "")).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    }
    buildInstantProductCardHtml(e) {
        var t;
        const s = this.productCardTemplate;
        if (!s) return "";
        const i = this.escapeHtml(e.title || ""), n = e.url || "#", l = this.escapeHtml((null == (t = e.featured_image) ? void 0 : t.alt) || e.title || ""), r = (null == e ? void 0 : e.featured_image) && e.featured_image.url ? e.featured_image.url : e.image || "";
        return s.innerHTML.replaceAll("__PRODUCT_TITLE__", i).replaceAll("__PRODUCT_URL__", n).replaceAll("__PRODUCT_IMAGE__", r).replaceAll("__PRODUCT_IMAGE_ALT__", l);
    }
    renderPredictiveProducts(e, t, s) {
        const i = this.productColumn;
        if (!i) return;
        const n = i.querySelector(".instant-search-results__results");
        if (!n) return;
        this.tokenizeSearchTerm(t);
        const l = e.filter(e => this.doesTitleMatchSearch(e.title || "", [ t, ...s ])).slice(0, 4);
        if (!l.length) return this.setColumnVisible(this.productColumn, !1), void (n.innerHTML = "");
        n.innerHTML = l.map(e => this.buildInstantProductCardHtml(e)).join("");
        const r = n.children.length > 0;
        this.setColumnVisible(this.productColumn, r), r && (null == this.waitingResults || this.waitingResults.classList.add("visually-hidden"), 
        null == this.hasResults || this.hasResults.classList.remove("visually-hidden"), 
        null == this.noResults || this.noResults.classList.add("visually-hidden"), this.viewAllTermsEl && (this.viewAllTermsEl.textContent = t || ""));
    }
    async renderSearchResults(e, t, s) {
        const i = e => {
            const t = e;
            return (null == t ? void 0 : t.title) ?? (null == t ? void 0 : t.text) ?? (null == t ? void 0 : t.query) ?? "";
        }, n = (e, t, s) => {
            const n = document.createElement("a");
            n.href = e.url, n.className = "instant-search-results__result button button--text";
            const l = i(e), r = document.createElement("span");
            return r.textContent = l, t && (n.innerHTML = t), n.appendChild(r), null != s && s.trim() && l && this.highlightSearchTerm(r, l, s), 
            n;
        }, l = (e, t, s) => {
            var l;
            if (!e || !t) return;
            const r = t.querySelector(".instant-search-results__results");
            if (!r) return;
            const a = r.dataset.iconType, o = a && null != (l = window.themeVars) && l.icons ? window.themeVars.icons[a] : void 0;
            e.slice(0, 3).forEach(e => {
                i(e) && r.appendChild(n(e, o, s));
            });
        };
        if (this.setColumnVisible(this.suggestionColumn, !1), this.setColumnVisible(this.collectionColumn, !1), 
        this.setColumnVisible(this.productColumn, !1), e.queries || e.pages) {
            l(e.queries, this.suggestionColumn, t), l(e.pages, this.suggestionColumn, t);
            const s = !!(e.queries && e.queries.length > 0 || e.pages && e.pages.length > 0);
            this.setColumnVisible(this.suggestionColumn, s);
        }
        if (e.collections) {
            l(e.collections, this.collectionColumn, t);
            const s = e.collections.length > 0;
            this.setColumnVisible(this.collectionColumn, s);
        }
        if (this.productColumn) {
            const s = [ t, ...(e.queries || []).map(e => i(e)).filter(Boolean) ];
            this.renderPredictiveProducts(e.products || [], t, s);
        }
    }
    debounce(e, t) {
        let s;
        return (...i) => {
            clearTimeout(s), s = window.setTimeout(() => e(...i), t);
        };
    }
}

customElements.define("uwp-search-input", L);