import { r as S, i as w } from "./uwp.utils.nmjlQhSZ.js";

class y {
    constructor(t) {
        this.config = t;
    }
    async executeSearch(t) {
        if (!t || "string" != typeof t || t.length < 3) throw new Error("Search query must be a non-empty string with at least 3 characters.");
        const e = this.getSearchUrl(t);
        try {
            const t = await fetch(e);
            if (!t.ok) throw new Error(`HTTP error! status: ${t.status}`);
            const s = await t.json();
            return S(s.resources.results);
        } catch (t) {
            throw console.error("Error fetching data: ", t), t;
        }
    }
    getSearchUrl(t) {
        let e = `/search/suggest.json?q=${encodeURIComponent(t)}`;
        const {resources: s, limit: i, unavailable_products: n, fields: l, prefix: r} = this.config.SearchAPISearchOptions;
        return s && (e += `&resources[type]=${s.join(",")}`), i && (e += `&resources[limit]=${i}`), 
        n && (e += `&resources[unavailable_products]=${n}`), l && l.length > 0 && (e += `&resources[fields]=${l.join(",")}`), 
        r && (e += `&resources[options][prefix]=${r}`), e;
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
        }, this.searchHandler = new y(this.apiConfig), this.debouncedSearch = this.debounce(t => this.getSearchResults(t), 300);
    }
    lockBodyScroll() {
        if (this.bodyScrollLocked) return;
        const t = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden", t > 0 && (document.body.style.paddingRight = `${t}px`), 
        this.bodyScrollLocked = !0;
    }
    unlockBodyScroll() {
        this.bodyScrollLocked && (document.body.style.overflow = "", document.body.style.paddingRight = "", 
        this.bodyScrollLocked = !1);
    }
    closeSearchResults() {
        var t;
        null == (t = this.resultsParent) || t.classList.remove("is-open"), this.classList.remove("is-active"), 
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
            var t;
            document.hidden && null != (t = this.resultsParent) && t.classList.contains("is-open");
        });
    }
    setEventListeners() {
        var t, e, s, i, n;
        null == (t = this.searchInput) || t.addEventListener("input", this.handleSearchInput.bind(this)), 
        null == (e = this.searchInput) || e.addEventListener("focusin", () => {
            var t, e, s;
            null == (t = this.resultsParent) || t.classList.add("is-open");
            const i = (null == (e = this.searchInput) ? void 0 : e.value) || "";
            this.getSearchResults(i), i.trim() || null == (s = this.waitingResults) || s.classList.remove("visually-hidden"), 
            this.headerInner && this.headerInner.classList.contains("is-transparent") && (this.headerWasTransparent = !0, 
            this.headerInner.classList.remove("is-transparent")), this.lockBodyScroll(), document.body.classList.add("search-is-open"), 
            w() && this.classList.add("is-active"), this.dispatchEvent(new CustomEvent("search-input-state-change", {
                detail: {
                    isActive: !0
                },
                bubbles: !0
            }));
        }), null == (s = this.searchInput) || s.addEventListener("keydown", t => {
            var e, s;
            if ("Enter" === t.key) {
                t.preventDefault();
                const i = null == (s = null == (e = this.searchInput) ? void 0 : e.value) ? void 0 : s.trim();
                i && i.length > 0 && this.submitSearch(i);
            }
        }), this.addEventListener("focusout", t => {
            var e;
            const s = t.relatedTarget;
            !s || null != (e = this.resultsParent) && e.contains(s) || this.contains(s) || setTimeout(() => {
                var t, e;
                (null == (t = this.searchInput) || !t.matches(":focus")) && (null == (e = this.resultsParent) || !e.contains(document.activeElement)) && this.closeSearchResults();
            }, 100);
        }), null == (i = this.searchButton) || i.addEventListener("click", t => {
            var e, s;
            if (w()) {
                if (!this.classList.contains("is-active")) return;
                t.preventDefault(), this.searchInput && (this.searchInput.value = "", null == (e = this.searchInput) || e.blur()), 
                null == (s = this.resultsParent) || s.classList.remove("is-open"), this.classList.remove("is-active"), 
                this.unlockBodyScroll(), document.body.classList.remove("search-is-open"), this.updateUrlQuery("");
            }
        });
        const l = this.querySelector("[js-instant-search='close']");
        null == l || l.addEventListener("click", () => {
            this.closeSearchResults();
        });
        const r = this.querySelector("[js-search-input='reset']");
        r && r.addEventListener("click", t => {
            t.preventDefault(), t.stopPropagation(), this.searchInput && (this.searchInput.value = "", 
            this.resetSuggestions(), this.updateUrlQuery(""), this.renderResultsPanel(""), this.clearExistingSearchResults(), 
            this.closeSearchResults());
        }), null == (n = this.viewAllButton) || n.addEventListener("click", () => {
            var t;
            const e = (null == (t = this.searchInput) ? void 0 : t.value) || "";
            window.location.href = `${window.location.origin}/search?q=${encodeURIComponent(e)}*`;
        }), document.addEventListener("click", t => {
            var e;
            const s = t.target, i = t.target.parentElement;
            !this.contains(s) && (null == (e = this.resultsParent) || !e.contains(s)) && (null == i || !i.hasAttribute("js-header")) && this.closeSearchResults();
        });
    }
    submitSearch(t) {
        this.closeSearchResults(), window.location.href = `${window.location.origin}/search?q=${encodeURIComponent(t)}*`;
    }
    isResultsEmpty(t) {
        return !(t.queries && t.queries.length > 0 || t.pages && t.pages.length > 0 || t.collections && t.collections.length > 0 || t.products && t.products.length > 0);
    }
    highlightSearchTerm(t, e, s) {
        if (!s.trim()) return void (t.innerHTML = e);
        const i = s.toLowerCase(), n = e.toLowerCase().indexOf(i);
        if (-1 === n) return void (t.innerHTML = e);
        const l = e.substring(0, n), r = e.substring(n, n + s.length), o = e.substring(n + s.length);
        t.innerHTML = `${l}<mark class="search-highlight">${r}</mark>${o}`;
    }
    filterAndHighlightSuggestions(t) {
        const e = this.querySelector('[js-instant-search="suggestions"] .instant-search-results__results');
        if (!e) return;
        const s = e.querySelectorAll("a[data-suggestion-text]"), i = t.toLowerCase().trim();
        s.forEach(e => {
            const s = e, n = s.getAttribute("data-suggestion-text") || "", l = s.querySelector("span");
            if (!l) return;
            const r = n.toLowerCase();
            "" === i || r.includes(i) ? (s.style.display = "", this.highlightSearchTerm(l, n, t)) : s.style.display = "none";
        });
    }
    resetSuggestions() {
        const t = this.querySelector('[js-instant-search="suggestions"] .instant-search-results__results');
        t && t.querySelectorAll("a[data-suggestion-text]").forEach(t => {
            const e = t;
            e.style.display = "";
            const s = e.querySelector("span"), i = e.getAttribute("data-suggestion-text") || "";
            s && (s.innerHTML = i);
        });
    }
    setColumnVisible(t, e) {
        t && t.classList.toggle("visually-hidden", !e);
    }
    normalizeSearchTerm(t) {
        return (t || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\s-]+/gu, " ").replace(/\s+/g, " ").trim();
    }
    tokenizeSearchTerm(t) {
        const e = this.normalizeSearchTerm(t);
        return e ? e.split(" ").filter(Boolean) : [];
    }
    isTokenCloseMatch(t, e) {
        if (!t || !e) return !1;
        if (t === e || t.startsWith(e) || e.startsWith(t)) return !0;
        if (Math.abs(t.length - e.length) > 1) return !1;
        let s = 0, i = 0, n = 0;
        for (;s < t.length && i < e.length; ) if (t[s] === e[i]) s++, i++; else {
            if (n++, n > 1) return !1;
            t.length > e.length ? s++ : (e.length > t.length || s++, i++);
        }
        return (s < t.length || i < e.length) && n++, n <= 1;
    }
    doesTitleMatchSearch(t, e) {
        const s = this.tokenizeSearchTerm(t);
        if (!s.length) return !1;
        const i = s.join(" ");
        return e.some(t => {
            const e = this.tokenizeSearchTerm(t);
            if (!e.length) return !1;
            const n = e.join(" ");
            return !!i.includes(n) || e.every(t => s.some(e => this.isTokenCloseMatch(e, t)));
        });
    }
    buildProductQueryCandidates(t, e, s, i) {
        const n = [], l = t => {
            t && "string" == typeof t && t.trim().length >= 3 && !n.includes(t.trim()) && n.push(t.trim());
        };
        l(t), l(s), l(i), [ ...(e.queries || []).slice(0, 3), ...(e.products || []).slice(0, 3) ].forEach(t => l((t => t && ((null == t ? void 0 : t.title) ?? (null == t ? void 0 : t.text) ?? (null == t ? void 0 : t.query) ?? ""))(t)));
        const r = this.normalizeSearchTerm(t), o = this.tokenizeSearchTerm(t), a = o[o.length - 1];
        return r && l(r), a && a.length >= 4 && l(`${a.slice(0, -1)}*`), r && r.length >= 4 && l(`${r.slice(0, -1)}*`), 
        n;
    }
    async fetchCondensedProducts(t, e) {
        let s = "", i = !1;
        for (const n of t) {
            const t = await fetch(`${window.location.origin}/search?view=condensed&q=${encodeURIComponent(n)}`);
            if (!t.ok) continue;
            const l = await t.text(), r = document.createElement("template");
            r.innerHTML = l.trim();
            const o = Array.from(r.content.querySelectorAll(".product-card")), a = o.map(t => {
                const e = t.querySelector(".product-card__title a, .product-card__title");
                return (null == e ? void 0 : e.textContent) ? e.textContent.trim() : "";
            }).filter(Boolean);
            if (o.length && !s && (s = l), a.some(t => this.doesTitleMatchSearch(t, e))) return {
                html: l,
                hasResults: !0
            };
            o.length && (i = !0);
        }
        return {
            html: s,
            hasResults: i
        };
    }
    renderResultsPanel(t, e) {
        var s, i, n, l, r, o, a, u, c, h, d, m;
        return t ? e ? void (this.isResultsEmpty(e) ? (null == (h = this.waitingResults) || h.classList.add("visually-hidden"), 
        null == (d = this.hasResults) || d.classList.add("visually-hidden"), null == (m = this.noResults) || m.classList.remove("visually-hidden"), 
        this.viewAllTermsEl && (this.viewAllTermsEl.textContent = t), this.noResultsTermsEl && (this.noResultsTermsEl.textContent = t)) : (null == (a = this.waitingResults) || a.classList.add("visually-hidden"), 
        null == (u = this.hasResults) || u.classList.remove("visually-hidden"), null == (c = this.noResults) || c.classList.add("visually-hidden"), 
        this.viewAllTermsEl && (this.viewAllTermsEl.textContent = t))) : (null == (l = this.waitingResults) || l.classList.add("visually-hidden"), 
        null == (r = this.hasResults) || r.classList.add("visually-hidden"), null == (o = this.noResults) || o.classList.remove("visually-hidden"), 
        void (this.noResultsTermsEl && (this.noResultsTermsEl.textContent = t))) : (null == (s = this.waitingResults) || s.classList.remove("visually-hidden"), 
        null == (i = this.hasResults) || i.classList.add("visually-hidden"), void (null == (n = this.noResults) || n.classList.add("visually-hidden")));
    }
    async getSearchResults(t) {
        if (t.trim()) try {
            const e = t.trim(), s = [ e, ...this.getFallbackQueries(e) ], i = [];
            let n = null, l = e;
            for (const e of s) if (e && !i.includes(e)) try {
                i.push(e);
                const t = await this.searchHandler.executeSearch(e);
                if (n = t, l = e, !this.isResultsEmpty(t)) break;
            } catch (t) {}
            this.renderResultsPanel(e, n), this.clearExistingSearchResults(), this.renderSearchResults(n || {
                queries: [],
                products: [],
                collections: [],
                pages: []
            }, e, l);
        } catch (t) {
            throw t instanceof Error ? t : new Error(String(t));
        } else this.renderResultsPanel("");
    }
    getFallbackQueries(t) {
        const e = t.trim().replace(/\s+/g, " "), s = [];
        if (!e) return s;
        const i = e.replace(/[^\p{L}\p{N}\s-]+/gu, "").trim();
        return i && i !== e && s.push(i), e.length >= 4 && s.push(`${e.slice(0, -1)}*`), 
        i.length >= 4 && i !== e && s.push(`${i.slice(0, -1)}*`), s;
    }
    handleSearchInput(t) {
        var e;
        const s = t.target.value;
        null == (e = this.resultsParent) || e.classList.add("is-open"), this.filterAndHighlightSuggestions(s), 
        this.updateUrlQuery(s), s.trim().length >= 3 ? this.debouncedSearch(s) : 0 === s.trim().length && this.renderResultsPanel("");
    }
    setInitialValueFromUrl() {
        const t = new URLSearchParams(window.location.search).get("q");
        t && this.setAttribute("query", t);
    }
    updateUrlQuery(t) {
        const e = new URLSearchParams(window.location.search);
        "" !== t.trim() ? e.set("q", t) : e.delete("q");
        const s = `${window.location.pathname}?${e.toString()}${window.location.hash}`;
        window.history.pushState({
            path: s
        }, "", s);
    }
    clearExistingSearchResults() {
        const t = t => {
            const e = null == t ? void 0 : t.querySelector(".instant-search-results__results");
            null == e || e.replaceChildren();
        };
        t(this.suggestionColumn), t(this.collectionColumn), t(this.productColumn);
    }
    async renderSearchResults(t, e, s) {
        var i, n, l;
        const r = t => {
            const e = t;
            return (null == e ? void 0 : e.title) ?? (null == e ? void 0 : e.text) ?? (null == e ? void 0 : e.query) ?? "";
        }, o = (t, e, s) => {
            const i = document.createElement("a");
            i.href = t.url, i.className = "instant-search-results__result button button--text";
            const n = r(t), l = document.createElement("span");
            return l.textContent = n, e && (i.innerHTML = e), i.appendChild(l), null != s && s.trim() && n && this.highlightSearchTerm(l, n, s), 
            i;
        }, a = (t, e, s) => {
            var i;
            if (!t || !e) return;
            const n = e.querySelector(".instant-search-results__results");
            if (!n) return;
            const l = n.dataset.iconType, a = l && null != (i = window.themeVars) && i.icons ? window.themeVars.icons[l] : void 0;
            t.slice(0, 3).forEach(t => {
                r(t) && n.appendChild(o(t, a, s));
            });
        };
        if (this.setColumnVisible(this.suggestionColumn, !1), this.setColumnVisible(this.collectionColumn, !1), 
        this.setColumnVisible(this.productColumn, !1), t.queries || t.pages) {
            a(t.queries, this.suggestionColumn, e), a(t.pages, this.suggestionColumn, e);
            const s = !!(t.queries && t.queries.length > 0 || t.pages && t.pages.length > 0);
            this.setColumnVisible(this.suggestionColumn, s);
        }
        if (t.collections) {
            a(t.collections, this.collectionColumn, e);
            const s = t.collections.length > 0;
            this.setColumnVisible(this.collectionColumn, s);
        }
        if (this.productColumn) {
            const r = this.productColumn.querySelector(".instant-search-results__results");
            if (r) try {
                const o = this.buildProductQueryCandidates(e, t, s, null == this.searchInput ? void 0 : this.searchInput.value), a = [ e, ...(t.queries || []).map(t => r(t)).filter(Boolean) ], u = await this.fetchCondensedProducts(o, a);
                r.innerHTML = u.html || "";
                const c = u.hasResults && r.children.length > 0;
                this.setColumnVisible(this.productColumn, c), c && (null == (i = this.waitingResults) || i.classList.add("visually-hidden"), 
                null == (n = this.hasResults) || n.classList.remove("visually-hidden"), null == (l = this.noResults) || l.classList.add("visually-hidden"), 
                this.viewAllTermsEl && (this.viewAllTermsEl.textContent = e || ""));
            } catch (e) {
                if (console.error("Error fetching condensed product results", e), t.products) {
                    a(t.products, this.productColumn, e);
                    const s = t.products.length > 0;
                    this.setColumnVisible(this.productColumn, s), s && (null == (i = this.waitingResults) || i.classList.add("visually-hidden"), 
                    null == (n = this.hasResults) || n.classList.remove("visually-hidden"), null == (l = this.noResults) || l.classList.add("visually-hidden"), 
                    this.viewAllTermsEl && (this.viewAllTermsEl.textContent = e || ""));
                }
            }
        }
    }
    debounce(t, e) {
        let s;
        return (...i) => {
            clearTimeout(s), s = window.setTimeout(() => t(...i), e);
        };
    }
}

customElements.define("uwp-search-input", L);