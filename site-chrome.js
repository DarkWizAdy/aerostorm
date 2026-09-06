// Renders the nav link list, footer, announcement ticker, favicon, logo,
// and tracking snippet from site-config.json / nav.json.
//
// Important: the <nav>/<footer> HTML skeleton (including #mobile-menu-btn
// and #mobile-menu, which script.js wires up synchronously) stays exactly
// as hardcoded on every page. This file only overwrites the *contents* of
// specific containers, and only after a successful fetch — so if the fetch
// fails (e.g. opened without the server running), today's hardcoded links
// keep working untouched.
(function () {
  function currentPage() {
    var file = location.pathname.split('/').pop();
    return (!file || file === 'index.html') ? '/' : file;
  }

  function navLinkHtml(entry, page, mobile) {
    var isSamePage = entry.page === page;
    var href = entry.anchor ? (isSamePage ? '#' + entry.anchor : entry.page + '#' + entry.anchor) : entry.page;
    var active = isSamePage && !entry.anchor;
    var color = active ? 'text-[#e0d2b3]' : 'text-[#bababa]';
    if (mobile) {
      return '<a href="' + href + '" class="text-sm ' + color + ' hover:text-[#e0d2b3]">' + entry.label + '</a>';
    }
    return '<a href="' + href + '" class="nav-link text-sm font-medium ' + color + ' tracking-wide uppercase">' + entry.label + '</a>';
  }

  function renderNav(nav) {
    var page = currentPage();
    var desktop = document.getElementById('nav-link-list');
    var mobile = document.getElementById('mobile-menu');
    if (!desktop && !mobile) return;

    var visible = nav.filter(function (entry) {
      return !(entry.exclude_pages || []).includes(page);
    });

    if (desktop) {
      desktop.innerHTML = visible.map(function (e) { return navLinkHtml(e, page, false); }).join(' ');
    }
    if (mobile) {
      mobile.innerHTML = visible.map(function (e) { return navLinkHtml(e, page, true); }).join(' ');
    }
  }

  function renderFooter(config) {
    var copyright = document.getElementById('footer-copyright');
    if (copyright && config.copyright_text) {
      copyright.textContent = config.copyright_text;
    }

    var socials = document.getElementById('footer-social-links');
    if (socials && Array.isArray(config.footer_social_links)) {
      socials.innerHTML = config.footer_social_links.map(function (link) {
        return '<a href="' + link.url + '" target="_blank" rel="noopener" ' +
          'class="w-8 h-8 rounded-sm bg-[#1e1e1e] border border-[#2c2c2c] flex items-center justify-center hover:border-[#e0d2b3] transition-colors">' +
          '<i data-lucide="' + link.icon + '" style="width:14px;height:14px;color:#bababa;"></i></a>';
      }).join('');
    }
  }

  function renderAnnouncement(config) {
    var ticker = document.getElementById('announcement-ticker');
    if (!ticker) return;
    if (config.announcement && config.announcement.enabled && config.announcement.text) {
      ticker.textContent = config.announcement.text;
      ticker.classList.remove('hidden');
    }
  }

  function renderFaviconAndLogo(config) {
    var favicon = document.getElementById('site-favicon');
    if (favicon && config.favicon) {
      favicon.setAttribute('href', config.favicon);
    }
    if (config.logo) {
      document.querySelectorAll('[data-role="site-logo"]').forEach(function (img) {
        img.setAttribute('src', config.logo);
      });
    }
  }

  function renderTrackingSnippet(config) {
    if (config.tracking_snippet) {
      document.head.insertAdjacentHTML('beforeend', config.tracking_snippet);
    }
  }

  fetch('nav.json', { cache: 'no-store' })
    .then(function (res) { return res.json(); })
    .then(function (nav) {
      renderNav(nav);
      if (window.lucide) lucide.createIcons();
    })
    .catch(function (err) { console.error('site-chrome: failed to load nav.json', err); });

  fetch('site-config.json', { cache: 'no-store' })
    .then(function (res) { return res.json(); })
    .then(function (config) {
      renderFooter(config);
      renderAnnouncement(config);
      renderFaviconAndLogo(config);
      renderTrackingSnippet(config);
      if (window.lucide) lucide.createIcons();
    })
    .catch(function (err) { console.error('site-chrome: failed to load site-config.json', err); });
})();
