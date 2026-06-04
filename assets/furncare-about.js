(function () {
  if (window.FurncareAboutPageLoaded) {
    if (typeof window.FurncareAboutPageInit === 'function') {
      window.FurncareAboutPageInit(document);
    }
    return;
  }

  window.FurncareAboutPageLoaded = true;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealObserver = null;
  var parallaxSections = [];
  var ticking = false;

  document.documentElement.classList.add('fa-js-ready');

  function setupRevealObserver() {
    if (revealObserver || !('IntersectionObserver' in window) || reduceMotion) return;

    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  }

  function initReveals(root) {
    var items = root.querySelectorAll ? root.querySelectorAll('.fa-reveal:not([data-fa-reveal-ready])') : [];

    Array.prototype.forEach.call(items, function (item, index) {
      item.setAttribute('data-fa-reveal-ready', 'true');
      item.style.transitionDelay = Math.min(index % 8, 7) * 70 + 'ms';

      if (reduceMotion || !revealObserver) {
        item.classList.add('is-visible');
      } else {
        revealObserver.observe(item);
      }
    });
  }

  function initRotators(root) {
    var rotators = root.querySelectorAll ? root.querySelectorAll('[data-fa-rotator]:not([data-fa-rotator-ready])') : [];

    Array.prototype.forEach.call(rotators, function (rotator) {
      var words = Array.prototype.slice.call(rotator.querySelectorAll('.fa-rotator__word'));
      if (!words.length) return;

      rotator.setAttribute('data-fa-rotator-ready', 'true');
      words.forEach(function (word) { word.classList.remove('is-active'); });
      words[0].classList.add('is-active');

      if (reduceMotion || words.length < 2) return;

      var index = 0;
      window.setInterval(function () {
        words[index].classList.remove('is-active');
        index = (index + 1) % words.length;
        words[index].classList.add('is-active');
      }, 1500);
    });
  }

  function updateParallax() {
    ticking = false;

    if (reduceMotion || !parallaxSections.length) return;

    parallaxSections.forEach(function (section) {
      var media = section.querySelector('[data-fa-parallax-target]');
      if (!media) return;

      var rect = section.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      var progress = Math.min(Math.max((0 - rect.top) / Math.max(rect.height, 1), 0), 1);
      var y = progress * 110;
      var scale = 1 + progress * 0.10;
      media.style.transform = 'translateY(' + y + 'px) scale(' + scale + ')';
    });
  }

  function requestParallaxUpdate() {
    if (ticking || reduceMotion) return;
    ticking = true;
    window.requestAnimationFrame(updateParallax);
  }

  function initParallax(root) {
    var items = root.querySelectorAll ? root.querySelectorAll('[data-fa-parallax]:not([data-fa-parallax-ready])') : [];

    Array.prototype.forEach.call(items, function (section) {
      section.setAttribute('data-fa-parallax-ready', 'true');
      parallaxSections.push(section);
    });

    if (items.length && !reduceMotion) {
      requestParallaxUpdate();
    }
  }

  window.FurncareAboutPageInit = function (root) {
    setupRevealObserver();
    initReveals(root || document);
    initRotators(root || document);
    initParallax(root || document);
  };

  if (!reduceMotion) {
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.FurncareAboutPageInit(document);
    });
  } else {
    window.FurncareAboutPageInit(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    window.FurncareAboutPageInit(event.target);
  });
})();
