function f(e) {
    const o = document.cookie.split("; ").find(t => t.startsWith(`${e}=`));
    return o ? decodeURIComponent(o.split("=")[1]) : null;
}

function p(e, s, o = 365, t = "/", r, n = !1, c = "Lax") {
    const i = new Date;
    i.setTime(i.getTime() + o * 24 * 60 * 60 * 1e3);
    let a = `${e}=${encodeURIComponent(s)}; expires=${i.toUTCString()}; path=${t}`;
    n && (a += "; secure"), a += `; SameSite=${c}`, document.cookie = a;
}

async function h() {
    try {
        return await fetch(window.Shopify.routes.root + `browsing_context_suggestions.json?country[enabled]=true&country[exclude]=${window.Shopify.country}&language[enabled]=true&language[exclude]=${window.Shopify.language}`).then(e => e.json());
    } catch (e) {
        throw new Error(e);
    }
}

const l = e => {
    const s = new FormData(e), o = {};
    for (const [t, r] of s.entries()) if (t.includes("[]")) {
        const n = t.replace("[]", "");
        o[n] || (o[n] = []), o[n].push(r);
    } else o[t] = r;
    return o;
}, u = e => Array.isArray(e) ? e.length === 0 : typeof e == "object" && e !== null ? Object.keys(e).length === 0 : e === "";

async function d(e, s, o) {
    const t = `https://${window.themeVars.store.permanent_domain}/api/${window.themeVars.config.storefrontApiVersion}/graphql`;
    try {
        const r = await fetch(t, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Shopify-Storefront-Access-Token": window.themeVars.config.storefrontAccessToken
            },
            body: JSON.stringify({
                query: e.loc.source.body,
                variables: s
            })
        });
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        const n = await r.json();
        if (n.errors) throw console.error(n.errors), new Error("GraphQL query error!");
        return n.data;
    } catch (r) {
        throw console.error("Error in fetchGraphQL:", r), r;
    }
}

function w() {
    return window.innerWidth <= 768;
}

const y = e => (Object.keys(e).forEach(o => {
    (e[o] === null || e[o] === void 0 || u(e[o])) && delete e[o];
}), e);

export { h as a, f as b, d as f, l as g, w as i, y as r, p as s };