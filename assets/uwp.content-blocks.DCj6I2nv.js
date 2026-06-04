class u extends HTMLElement{constructor(){super(),this.triggers=null,this.contents=null,this.blocksContainer=null,this.intersectionObserver=null,this.triggers=this.querySelectorAll("[js-content-blocks='tab-trigger']"),this.contents=this.querySelectorAll("[js-content-blocks='tab-content']"),this.blocksContainer=this}connectedCallback(){this.setupTabListeners(),this.setAriaAttributes(),this.setupSwipers(),this.setupDesktopNavigation(),this.setupRecommendationsObserver()}disconnectedCallback(){this.intersectionObserver&&this.intersectionObserver.disconnect()}setupRecommendationsObserver(){(this.dataset.block1RecUrl||this.dataset.block2RecUrl)&&(this.intersectionObserver=new IntersectionObserver(this.handleAsyncMethods.bind(this),{rootMargin:"0px 0px 400px 0px"}),this.intersectionObserver.observe(this))}async handleAsyncMethods(e,t){e[0].isIntersecting&&(t.unobserve(this),await this.handleDynamicRecommendations())}async handleDynamicRecommendations(){const e=[];this.dataset.block1RecUrl&&e.push(this.fetchBlockRecommendations(1,this.dataset.block1RecUrl)),this.dataset.block2RecUrl&&e.push(this.fetchBlockRecommendations(2,this.dataset.block2RecUrl));try{await Promise.all(e),this.updateHeaderNavigation()}catch(t){console.error("Error fetching recommendations:",t)}}async fetchBlockRecommendations(e,t){try{const i=await fetch(t),r=i.headers.get("content-type");if(r&&r.includes("application/json")){const s=await i.json();if(s&&s.products&&s.products.length>0){const n=s.products,o=await this.buildProductCardsFromRecommendations(n,e);this.updateBlockContent(e,o)}}else{const s=await i.text();if(s.length===0||s.includes("404")||s.includes("Not Found"))return;const n=document.createElement("div");n.innerHTML=s;const o=n.querySelector("uwp-content-blocks");if(!o)return;const a=o.querySelectorAll(".product-card");if(a.length===0)return;let c="";a.length>4?c=this.createSwiperFromElements(a,e):c=this.createGridFromElements(a),c&&this.updateBlockContent(e,c)}}catch(i){console.error(`Error fetching recommendations for block ${e}:`,i)}}createSwiperFromElements(e,t){const i=t===1?"2":"1.75";let r="";return Array.from(e).slice(0,8).forEach(s=>{r+=`
      <swiper-slide class="content-blocks__slide">
        ${s.outerHTML}
      </swiper-slide>
    `}),`
    <swiper-container
      class="content-blocks__swiper"
      slides-per-view="${i}"
      space-between="12"
      breakpoints='{"1024": {"spaceBetween": 20, "slidesPerView": 4}}'
      role="region"
      aria-label="Product carousel ${t}"
      aria-roledescription="carousel"
    >
      ${r}
    </swiper-container>
  `}createGridFromElements(e){let t="";return Array.from(e).forEach(i=>{t+=i.outerHTML}),`<div class="content-blocks__grid">${t}</div>`}async buildProductCardsFromRecommendations(e,t){return e.length>4?this.createSwiperFromProducts(e,t):this.createGridFromProducts(e)}createSwiperFromProducts(e,t){const i=t===1?"2":"1.75";let r="";return e.slice(0,8).forEach(s=>{r+=`
        <swiper-slide class="content-blocks__slide">
          <div class="product-card">
            <a href="${s.url}" class="product-card__link">
              <div class="product-card__image">
                <img src="${s.featured_image}" alt="${s.title}" loading="lazy">
              </div>
              <div class="product-card__info">
                <h3 class="product-card__title">${s.title}</h3>
                <div class="product-card__price">${this.formatPrice(s.price)}</div>
              </div>
            </a>
          </div>
        </swiper-slide>
      `}),`
      <swiper-container
        class="content-blocks__swiper"
        slides-per-view="${i}"
        space-between="12"
        breakpoints='{"1024": {"spaceBetween": 20, "slidesPerView": 4}}'
        role="region"
        aria-label="Product carousel ${t}"
        aria-roledescription="carousel"
      >
        ${r}
      </swiper-container>
    `}createGridFromProducts(e){let t="";return e.forEach(i=>{t+=`
        <div class="product-card">
          <a href="${i.url}" class="product-card__link">
            <div class="product-card__image">
              <img src="${i.featured_image}" alt="${i.title}" loading="lazy">
            </div>
            <div class="product-card__info">
              <h3 class="product-card__title">${i.title}</h3>
              <div class="product-card__price">${this.formatPrice(i.price)}</div>
            </div>
          </a>
        </div>
      `}),`<div class="content-blocks__grid">${t}</div>`}formatPrice(e){var r,s,n,o,a;const t=((n=(s=(r=window.themeVars)==null?void 0:r.store)==null?void 0:s.currency)==null?void 0:n.isoCode)||((a=(o=window.Shopify)==null?void 0:o.currency)==null?void 0:a.active),i=e/100;return t?new Intl.NumberFormat(void 0,{style:"currency",currency:t}).format(i):i.toFixed(2)}updateBlockContent(e,t){const i=this.querySelector(`[js-content-blocks="tab-content"][data-tab="tab${e}"]`);i&&(i.innerHTML=t,this.announceContentChange(e),this.reinitializeTabSwiper(i))}updateHeaderNavigation(){if(this.querySelectorAll(".content-blocks__swiper, swiper-container").length>0){const t=this.querySelector(".title-with-nav");let i=this.querySelector(".title-with-nav__nav");if(t&&!i){const r=this.id||"content-blocks";i=document.createElement("div"),i.className="swiper-nav title-with-nav__nav",i.innerHTML=`
          <button
            id="swiper-button-prev-${r}"
            class="button button--icon-only button--secondary swiper-button-prev fade-on-hover"
            data-nav-action="prev"
            aria-label="Previous products"
            type="button"
          >
            <svg 
              focusable="false"
              aria-hidden="true"
              width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            id="swiper-button-next-${r}"
            class="button button--icon-only button--secondary swiper-button-next fade-on-hover"
            data-nav-action="next"
            aria-label="Next products"
            type="button"
          >
            <svg 
              focusable="false"
              aria-hidden="true"
              width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        `,t.appendChild(i),this.setupNavigationListeners(i)}if(t&&i){i.classList.remove("hide-on-mobile"),i.style.display="";const r=this.querySelector(".content-blocks__header");r&&r.setAttribute("data-show-nav","true")}}}setupNavigationListeners(e){const t=e.querySelector('[data-nav-action="prev"]'),i=e.querySelector('[data-nav-action="next"]');t&&(t.addEventListener("click",()=>{this.navigateActiveSwiper("prev")}),t.addEventListener("keydown",r=>{const s=r;(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this.navigateActiveSwiper("prev"))})),i&&(i.addEventListener("click",()=>{this.navigateActiveSwiper("next")}),i.addEventListener("keydown",r=>{const s=r;(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this.navigateActiveSwiper("next"))}))}navigateActiveSwiper(e){const t=this.querySelector(".content-blocks__tab.is-active");if(!t)return;const i=t.querySelector("swiper-container");!i||!i.swiper||(e==="prev"?i.swiper.slidePrev():i.swiper.slideNext())}reinitializeTabSwiper(e){const t=e.querySelector("uwp-carousel");if(!t){const i=e.querySelector("swiper-container");i&&this.setupSwiperForElement(i);return}t.createCarousel&&t.createCarousel()}setupSwiperForElement(e){const t=()=>{this.setupSwiperNavigation(e)};e.addEventListener("swiperinit",t),e.swiper&&t()}setupTabListeners(){var e;(e=this.triggers)==null||e.forEach((t,i)=>{t.addEventListener("click",this.handleTriggerClick.bind(this)),t.addEventListener("keydown",r=>this.handleKeyDown(r,i))})}setAriaAttributes(){var t;const e=this.querySelector(".title-with-nav__tabs");e&&e.setAttribute("role","tablist"),(t=this.triggers)==null||t.forEach((i,r)=>{var a;const s=`content-blocks-tab-${r}`,n=`content-blocks-panel-${r}`;i.setAttribute("role","tab"),i.setAttribute("id",s),i.setAttribute("aria-controls",n),this.updateTabAriaState(i,i.classList.contains("is-active"));const o=(a=this.contents)==null?void 0:a[r];o&&(o.setAttribute("role","tabpanel"),o.setAttribute("id",n),o.setAttribute("aria-labelledby",s),o.setAttribute("tabindex","0"),o.setAttribute("aria-hidden",(!o.classList.contains("is-active")).toString()))})}updateTabAriaState(e,t){e.setAttribute("aria-selected",t.toString()),e.setAttribute("tabindex",t?"0":"-1")}announceTabChange(e){let t=document.getElementById("content-blocks-announcer");t||(t=document.createElement("div"),t.id="content-blocks-announcer",t.setAttribute("aria-live","polite"),t.setAttribute("aria-atomic","true"),t.className="sr-only",t.style.cssText=`
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `,document.body.appendChild(t)),t.textContent=`Switched to ${e} tab`}announceContentChange(e){let t=document.getElementById("content-blocks-announcer");t||(t=document.createElement("div"),t.id="content-blocks-announcer",t.setAttribute("aria-live","polite"),t.setAttribute("aria-atomic","true"),t.className="sr-only",t.style.cssText=`
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `,document.body.appendChild(t)),t.textContent=`Recommendations loaded for block ${e}`}setupSwipers(){this.querySelectorAll("swiper-container").forEach(t=>{this.setupSwiperForElement(t)})}setupSwiperNavigation(e){if(!e.swiper)return;const t=e.closest("[data-tab]"),i=(t==null?void 0:t.getAttribute("data-tab"))||"unknown",r=this.getAttribute("data-section-id")||this.id,{nextButton:s,prevButton:n}=this.findNavigationButtons(r,i,t,e);this.attachNavigationListeners(s,n,e)}findNavigationButtons(e,t,i,r){let s=null,n=null;if(e&&(s=this.querySelector(`#swiper-button-next-${e}-${t}`),n=this.querySelector(`#swiper-button-prev-${e}-${t}`)),(!s||!n)&&this.id&&(s=s||this.querySelector(`#swiper-button-next-${this.id}-${t}`),n=n||this.querySelector(`#swiper-button-prev-${this.id}-${t}`)),(!s||!n)&&(s=s||((i==null?void 0:i.querySelector(".swiper-button-next"))??null),n=n||((i==null?void 0:i.querySelector(".swiper-button-prev"))??null)),!s||!n){const o=r.closest(".content-blocks__tab");s=s||((o==null?void 0:o.querySelector(".swiper-button-next"))??null),n=n||((o==null?void 0:o.querySelector(".swiper-button-prev"))??null)}return{nextButton:s,prevButton:n}}attachNavigationListeners(e,t,i){e&&e.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),i.swiper.slideNext()}),t&&t.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),i.swiper.slidePrev()})}setupDesktopNavigation(){const e=document.querySelectorAll('[id*="swiper-button"]');let t=this.querySelector(".hide-on-mobile .swiper-button-next")||this.querySelector(".title-with-nav .swiper-button-next"),i=this.querySelector(".hide-on-mobile .swiper-button-prev")||this.querySelector(".title-with-nav .swiper-button-prev");if(!t||!i){const r=Array.from(e).map(s=>s.id).filter(s=>s.includes("swiper-button")&&!s.includes("-tab1")&&!s.includes("-tab2"));for(const s of r)s.includes("next")&&!t&&(t=document.getElementById(s)),s.includes("prev")&&!i&&(i=document.getElementById(s))}this.attachDesktopNavigationListeners(t,i)}attachDesktopNavigationListeners(e,t){const i=()=>{var o;const s=this.querySelector(".content-blocks__tab.is-active"),n=s==null?void 0:s.querySelector("swiper-container");(o=n==null?void 0:n.swiper)==null||o.slideNext()},r=()=>{var o;const s=this.querySelector(".content-blocks__tab.is-active"),n=s==null?void 0:s.querySelector("swiper-container");(o=n==null?void 0:n.swiper)==null||o.slidePrev()};e&&e.addEventListener("click",s=>{s.preventDefault(),s.stopPropagation(),i()}),t&&t.addEventListener("click",s=>{s.preventDefault(),s.stopPropagation(),r()})}handleTriggerClick(e){var o,a,c;const t=e.target,i=t.getAttribute("data-tab"),r=t.getAttribute("data-colour-scheme");if(!i||t.classList.contains("is-active"))return;(o=this.triggers)==null||o.forEach(l=>{const d=l===t;l.classList.toggle("is-active",d),this.updateTabAriaState(l,d)}),(a=this.contents)==null||a.forEach(l=>{const d=l.getAttribute("data-tab")===i;l.classList.toggle("is-active",d),l.setAttribute("aria-hidden",(!d).toString())}),this.updateColourScheme(r);const s=((c=t.textContent)==null?void 0:c.trim())||i;this.announceTabChange(s);const n=this.querySelector(`[data-tab="${i}"]`);n instanceof HTMLElement&&n.focus(),this.dispatchEvent(new CustomEvent("contentBlocksTabChanged",{detail:{activeTab:i,colourScheme:r,tabElement:t,contentElement:n},bubbles:!0}))}updateColourScheme(e){!this.blocksContainer||!e||(this.blocksContainer.classList.forEach(t=>{var i;t.startsWith("colour-scheme--")&&((i=this.blocksContainer)==null||i.classList.remove(t))}),this.blocksContainer.classList.add(`colour-scheme--${e}`))}handleKeyDown(e,t){if(!this.triggers)return;let i=t;switch(e.key){case"ArrowLeft":e.preventDefault(),i=t>0?t-1:this.triggers.length-1;break;case"ArrowRight":e.preventDefault(),i=t<this.triggers.length-1?t+1:0;break;case"Home":e.preventDefault(),i=0;break;case"End":e.preventDefault(),i=this.triggers.length-1;break;case"Enter":case" ":e.preventDefault(),this.triggers[t].click();return;default:return}const r=this.triggers[i];r.focus(),r.click()}setActiveTab(e){this.triggers&&e>=0&&e<this.triggers.length&&this.triggers[e].click()}getActiveTabIndex(){return this.triggers?Array.from(this.triggers).findIndex(e=>e.classList.contains("is-active")):-1}getActiveTabId(){const e=this.getActiveTabIndex();return e===-1||!this.triggers?null:this.triggers[e].getAttribute("data-tab")}getActiveColourScheme(){const e=this.getActiveTabIndex();return e===-1||!this.triggers?null:this.triggers[e].getAttribute("data-colour-scheme")}async fetchRecommendations(){await this.handleDynamicRecommendations()}}customElements.define("uwp-content-blocks",u);
