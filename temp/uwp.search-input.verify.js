import { r as S, i as w } from "./uwp.utils.nmjlQhSZ.js";

class y {
    constructor(s) {
        this.config = s;
    }
    async executeSearch(s) {
        if (!s || "string" != typeof s || s.length < 3) throw new Error("Search query must be a non-empty string with at least 3 characters.");
        const t = this.getSearchUrl(s);
        try {
            const s = await fetch(t);
            if (!s.ok) throw new Error(`HTTP error! status: ${s.status}`);
            const e = await s.json();
            return S(e.resources.results);
        } catch (s) {
            throw console.error("Error fetching data: ", s), s;
        }
    }
    getSearchUrl(s) {
        let t = `/search/suggest.json?q=${encodeURIComponent(s)}`;
        const {resources: e, limit: i, unavailable_products: n, fields: l, prefix: r} = this.config.SearchAPISearchOptions;
        return e && (t += `&resources[type]=${e.join(",")}`), i && (t += `&resources[limit]=${i}`), 
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
        }, this.searchHandler = new y(this.apiConfig), this.debouncedSearch = this.debounce(s => this.getSearchResults(s), 300);
    }
    lockBodyScroll() {
        if (this.bodyScrollLocked) return;
        const s = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden", s > 0 && (document.body.style.paddingRight = `${s}px`), 
        this.bodyScrollLocked = !0;
    }
    unlockBodyScroll() {
        this.bodyScrollLocked && (document.body.style.overflow = "", document.body.style.paddingRight = "", 
        this.bodyScrollLocked = !1);
    }
    closeSearchResults() {
        var s;
        null == (s = this.resultsParent) || s.classList.remove("is-open"), this.classList.remove("is-active"), 
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
        this.noResultsTermsEl = this.querySelector(".instant-search-results__no-results-text__terms");
    }
    setVisibilityChangeListener() {
        document.addEventListener("visibilitychange", () => {
            var s;
            document.hidden && null != (s = this.resultsParent) && s.classList.contains("is-open");
        });
    }
    setEventListeners() {
        var s, t, e, i, n;
        null == (s = this.searchInput) || s.addEventListener("input", this.handleSearchInput.bind(this)), 
        null == (t = this.searchInput) || t.addEventListener("focusin", () => {
            var s, t, e;
            null == (s = this.resultsParent) || s.classList.add("is-open");
            const i = (null == (t = this.searchInput) ? void 0 : t.value) || "";
            this.getSearchResults(i), i.trim() || null == (e = this.waitingResults) || e.classList.remove("visually-hidden"), 
            this.headerInner && this.headerInner.classList.contains("is-transparent") && (this.headerWasTransparent = !0, 
            this.headerInner.classList.remove("is-transparent")), this.lockBodyScroll(), document.body.classList.add("search-is-open"), 
            w() && this.classList.add("is-active"), this.dispatchEvent(new CustomEvent("search-input-state-change", {
                detail: {
                    isActive: !0
                },
                bubbles: !0
            }));
        }), null == (e = this.searchInput) || e.addEventListener("keydown", s => {
            var t, e;
            if ("Enter" === s.key) {
                s.preventDefault();
                const i = null == (e = null == (t = this.searchInput) ? void 0 : t.value) ? void 0 : e.trim();
                i && i.length > 0 && this.submitSearch(i);
            }
        }), this.addEventListener("focusout", s => {
            var t;
            const e = s.relatedTarget;
            !e || null != (t = this.resultsParent) && t.contains(e) || this.contains(e) || setTimeout(() => {
                var s, t;
                (null == (s = this.searchInput) || !s.matches(":focus")) && (null == (t = this.resultsParent) || !t.contains(document.activeElement)) && this.closeSearchResults();
            }, 100);
        }), null == (i = this.searchButton) || i.addEventListener("click", s => {
            var t, e;
            if (w()) {
                if (!this.classList.contains("is-active")) return;
                s.preventDefault(), this.searchInput && (this.searchInput.value = "", null == (t = this.searchInput) || t.blur()), 
                null == (e = this.resultsParent) || e.classList.remove("is-open"), this.classList.remove("is-active"), 
                this.unlockBodyScroll(), document.body.classList.remove("search-is-open"), this.updateUrlQuery("");
            }
        });
        const l = this.querySelector("[js-instant-search='close']");
        null == l || l.addEventListener("click", () => {
            this.closeSearchResults();
        });
        const r = this.querySelector("[js-search-input='reset']");
        r && r.addEventListener("click", s => {
            s.preventDefault(), s.stopPropagation(), this.searchInput && (this.searchInput.value = "", 
            this.resetSuggestions(), this.updateUrlQuery(""), this.renderResultsPanel(""), this.clearExistingSearchResults(), 
            this.closeSearchResults());
        }), null == (n = this.viewAllButton) || n.addEventListener("click", () => {
            var s;
            const t = (null == (s = this.searchInput) ? void 0 : s.value) || "";
            window.location.href = `${window.location.origin}/search?q=${encodeURIComponent(t)}*`;
        }), document.addEventListener("click", s => {
            var t;
            const e = s.target, i = s.target.parentElement;
            !this.contains(e) && (null == (t = this.resultsParent) || !t.contains(e)) && (null == i || !i.hasAttribute("js-header")) && this.closeSearchResults();
        });
    }
    submitSearch(s) {
        this.closeSearchResults(), window.location.href = `${window.location.origin}/search?q=${encodeURIComponent(s)}*`;
    }
    isResultsEmpty(s) {
        return !(s.queries && s.queries.length > 0 || s.pages && s.pages.length > 0 || s.collections && s.collections.length > 0 || s.products && s.products.length > 0);
    }
    highlightSearchTerm(s, t, e) {
        if (!e.trim()) return void (s.innerHTML = t);
        const i = e.toLowerCase(), n = t.toLowerCase().indexOf(i);
        if (-1 === n) return void (s.innerHTML = t);
        const l = t.substring(0, n), r = t.substring(n, n + e.length), o = t.substring(n + e.length);
        s.innerHTML = `${l}<mark class="search-highlight">${r}</mark>${o}`;
    }
    filterAndHighlightSuggestions(s) {
        const t = this.querySelector('[js-instant-search="suggestions"] .instant-search-results__results');
        if (!t) return;
        const e = t.querySelectorAll("a[data-suggestion-text]"), i = s.toLowerCase().trim();
        e.forEach(t => {
            const e = t, n = e.getAttribute("data-suggestion-text") || "", l = e.querySelector("span");
            if (!l) return;
            const r = n.toLowerCase();
            "" === i || r.includes(i) ? (e.style.display = "", this.highlightSearchTerm(l, n, s)) : e.style.display = "none";
        });
    }
    resetSuggestions() {
        const s = this.querySelector('[js-instant-search="suggestions"] .instant-search-results__results');
        s && s.querySelectorAll("a[data-suggestion-text]").forEach(s => {
            const t = s;
            t.style.display = "";
            const e = t.querySelector("span"), i = t.getAttribute("data-suggestion-text") || "";
            e && (e.innerHTML = i);
        });
    }
    setColumnVisible(s, t) {
        s && s.classList.toggle("visually-hidden", !t);
    }
    normalizeSearchTerm(s) {
        return (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\s-]+/gu, " ").replace(/\s+/g, " ").trim();
    }
    tokenizeSearchTerm(s) {
        const t = this.normalizeSearchTerm(s);
        return t ? t.split(" ").filter(Boolean) : [];
    }
    isTokenCloseMatch(s, t) {
        if (!s || !t) return !1;
        if (s === t || s.startsWith(t) || t.startsWith(s)) return !0;
        if (Math.abs(s.length - t.length) > 1) return !1;
        let e = 0, i = 0, n = 0;
        for (;e < s.length && i < t.length; ) if (s[e] === t[i]) e++, i++; else {
            if (n++, n > 1) return !1;
            s.length > t.length ? e++ : t.length > s.length ? i++ : (e++, i++);
        }
        return (e < s.length || i < t.length) && n++, n <= 1;
    }
    doesTitleMatchSearch(s, t) {
        const e = this.tokenizeSearchTerm(s);
        if (!e.length) return !1;
        const i = e.join(" ");
        return t.some(s => {
            const t = this.tokenizeSearchTerm(s);
            if (!t.length) return !1;
            const n = t.join(" ");
            return !!i.includes(n) || t.every(s => e.some(t => this.isTokenCloseMatch(t, s)));
        });
    }
    buildProductQueryCandidates(s, t, e, i) {
        const n = [], l = s => {
            s && "string" == typeof s && s.trim().length >= 3 && !n.includes(s.trim()) && n.push(s.trim());
        }, r = s => s && ((null == s ? void 0 : s.title) ?? (null == s ? void 0 : s.text) ?? (null == s ? void 0 : s.query) ?? "");
        l(s), l(e), l(i);
        [ ...(t.queries || []).slice(0, 3), ...(t.products || []).slice(0, 3) ].forEach(s => l(r(s)));
        const o = this.normalizeSearchTerm(s), a = this.tokenizeSearchTerm(s), c = a[a.length - 1];
        return o && l(o), c && c.length >= 4 && l(`${c.slice(0, -1)}*`), o && o.length >= 4 && l(`${o.slice(0, -1)}*`), 
        n;
    }
    async fetchCondensedProducts(s, t) {
        let e = "", i = !1;
        for (const n of s) {
            const s = await fetch(`${window.location.origin}/search?view=condensed&q=${encodeURIComponent(n)}`);
            if (!s.ok) continue;
            const l = await s.text(), r = document.createElement("template");
            r.innerHTML = l.trim();
            const o = Array.from(r.content.querySelectorAll(".product-card")), a = o.map(s => {
                const t = s.querySelector(".product-card__title a, .product-card__title");
                return (null == t ? void 0 : t.textContent) ? t.textContent.trim() : "";
            }).filter(Boolean);
            if (o.length && !e && (e = l), a.some(s => this.doesTitleMatchSearch(s, t))) return {
                html: l,
                hasResults: !0
            };
            o.length && (i = !0);
        }
        return {
            html: e,
            hasResults: i
        };
    }
    renderResultsPanel(s, t) {
        var e, i, n, l, r, o, a, c, u, h, d, m;
        return s ? t ? void (this.isResultsEmpty(t) ? (null == (h = this.waitingResults) || h.classList.add("visually-hidden"), 
        null == (d = this.hasResults) || d.classList.add("visually-hidden"), null == (m = this.noResults) || m.classList.remove("visually-hidden"), 
        this.viewAllTermsEl && (this.viewAllTermsEl.textContent = s), this.noResultsTermsEl && (this.noResultsTermsEl.textContent = s)) : (null == (a = this.waitingResults) || a.classList.add("visually-hidden"), 
        null == (c = this.hasResults) || c.classList.remove("visually-hidden"), null == (u = this.noResults) || u.classList.add("visually-hidden"), 
        this.viewAllTermsEl && (this.viewAllTermsEl.textContent = s))) : (null == (l = this.waitingResults) || l.classList.add("visually-hidden"), 
        null == (r = this.hasResults) || r.classList.add("visually-hidden"), null == (o = this.noResults) || o.classList.remove("visually-hidden"), 
        void (this.noResultsTermsEl && (this.noResultsTermsEl.textContent = s))) : (null == (e = this.waitingResults) || e.classList.remove("visually-hidden"), 
        null == (i = this.hasResults) || i.classList.add("visually-hidden"), void (null == (n = this.noResults) || n.classList.add("visually-hidden")));
    }
    async getSearchResults(s) {
        if (s.trim()) try {
            const t = s.trim(), e = [ t, ...this.getFallbackQueries(t) ], i = [];
            let n = null, l = t;
            for (const t of e) if (t && !i.includes(t)) try {
                i.push(t);
                const s = await this.searchHandler.executeSearch(t);
                if (n = s, l = t, !this.isResultsEmpty(s)) break;
            } catch (s) {}
            this.renderResultsPanel(t, n), this.clearExistingSearchResults(), this.renderSearchResults(n || {
                queries: [],
                products: [],
                collections: [],
                pages: []
            }, t, l);
        } catch (s) {
            throw s instanceof Error ? s : new Error(String(s));
        } else this.renderResultsPanel("");
    }
    getFallbackQueries(s) {
        const t = s.trim().replace(/\s+/g, " "), e = [];
        if (!t) return e;
        const i = t.replace(/[^\p{L}\p{N}\s-]+/gu, "").trim();
        return i && i !== t && e.push(i), t.length >= 4 && e.push(`${t.slice(0, -1)}*`), 
        i.length >= 4 && i !== t && e.push(`${i.slice(0, -1)}*`), e;
    }
    handleSearchInput(s) {
        var t;
        const e = s.target.value;
        null == (t = this.resultsParent) || t.classList.add("is-open"), this.filterAndHighlightSuggestions(e), 
        this.updateUrlQuery(e), e.trim().length >= 3 ? this.debouncedSearch(e) : 0 === e.trim().length && this.renderResultsPanel("");
    }
    setInitialValueFromUrl() {
        const s = new URLSearchParams(window.location.search).get("q");
        s && this.setAttribute("query", s);
    }
    updateUrlQuery(s) {
        const t = new URLSearchParams(window.location.search);
        "" !== s.trim() ? t.set("q", s) : t.delete("q");
        const e = `${window.location.pathname}?${t.toString()}${window.location.hash}`;
        window.history.pushState({
            path: e
        }, "", e);
    }
    clearExistingSearchResults() {
        const s = s => {
            const t = null == s ? void 0 : s.querySelector(".instant-search-results__results");
            null == t || t.replaceChildren();
        };
        s(this.suggestionColumn), s(this.collectionColumn), s(this.productColumn);
    }
    async renderSearchResults(s, t, e) {
        var i, n, l;
        const r = s => {
            const t = s;
            return (null == t ? void 0 : t.title) ?? (null == t ? void 0 : t.text) ?? (null == t ? void 0 : t.query) ?? "";
        }, o = (s, t, e) => {
            const i = document.createElement("a");
            i.href = s.url, i.className = "instant-search-results__result button button--text";
            const n = r(s), l = document.createElement("span");
            return l.textContent = n, t && (i.innerHTML = t), i.appendChild(l), null != e && e.trim() && n && this.highlightSearchTerm(l, n, e), 
            i;
        }, a = (s, t, e) => {
            var i;
            if (!s || !t) return;
            const n = t.querySelector(".instant-search-results__results");
            if (!n) return;
            const l = n.dataset.iconType, a = l && null != (i = window.themeVars) && i.icons ? window.themeVars.icons[l] : void 0;
            s.slice(0, 3).forEach(s => {
                r(s) && n.appendChild(o(s, a, e));
            });
        };
        if (this.setColumnVisible(this.suggestionColumn, !1), this.setColumnVisible(this.collectionColumn, !1), 
        this.setColumnVisible(this.productColumn, !1), s.queries || s.pages) {
            a(s.queries, this.suggestionColumn, t), a(s.pages, this.suggestionColumn, t);
            const e = !!(s.queries && s.queries.length > 0 || s.pages && s.pages.length > 0);
            this.setColumnVisible(this.suggestionColumn, e);
        }
        if (s.collections) {
            a(s.collections, this.collectionColumn, t);
            const e = s.collections.length > 0;
            this.setColumnVisible(this.collectionColumn, e);
        }
        if (this.productColumn) {
            const r = this.productColumn.querySelector(".instant-search-results__results");
            if (r) try {
                const o = this.buildProductQueryCandidates(t, s, e, null == this.searchInput ? void 0 : this.searchInput.value), a = [ t, ...(s.queries || []).map(s => r(s)).filter(Boolean) ], c = await this.fetchCondensedProducts(o, a);
                r.innerHTML = c.html || "";
                const u = c.hasResults && r.children.length > 0;
                this.setColumnVisible(this.productColumn, u), u && (null == (i = this.waitingResults) || i.classList.add("visually-hidden"), 
                null == (n = this.hasResults) || n.classList.remove("visually-hidden"), null == (l = this.noResults) || l.classList.add("visually-hidden"), 
                this.viewAllTermsEl && (this.viewAllTermsEl.textContent = t || ""));
            } catch (t) {
                if (console.error("Error fetching condensed product results", t), s.products) {
                    a(s.products, this.productColumn, t);
                    const e = s.products.length > 0;
                    this.setColumnVisible(this.productColumn, e), e && (null == (i = this.waitingResults) || i.classList.add("visually-hidden"), 
                    null == (n = this.hasResults) || n.classList.remove("visually-hidden"), null == (l = this.noResults) || l.classList.add("visually-hidden"), 
                    this.viewAllTermsEl && (this.viewAllTermsEl.textContent = t || ""));
                }
            }
        }
    }
    debounce(s, t) {
        let e;
        return (...i) => {
            clearTimeout(e), e = window.setTimeout(() => s(...i), t);
        };
    }
}

customElements.define("uwp-search-input", L);