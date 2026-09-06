(function () {
  var loginView = document.getElementById('login-view');
  var dashboardView = document.getElementById('dashboard-view');

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) return '';
    var parts = isoDate.split('-');
    var months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    var y = parts[0], m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
    if (isNaN(m) || isNaN(d)) return isoDate;
    return months[m] + ' ' + d + ', ' + y;
  }

  // -- API helpers --------------------------------------------------------

  function apiGet(path) {
    return fetch(path, { credentials: 'same-origin' }).then(function (res) { return res.json(); });
  }

  function apiPost(path, body) {
    return fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); });
  }

  function apiPut(path, body) {
    return fetch(path, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); });
  }

  function fetchJsonFile(name) {
    return fetch(name, { cache: 'no-store' }).then(function (res) { return res.json(); });
  }

  // -- Auth / session -------------------------------------------------

  function showLogin() {
    sessionActive = false;
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    document.getElementById('login-form').reset();
  }

  // Ends the session the moment the tab is closed (or refreshed/navigated
  // away) rather than leaving it valid until it naturally expires.
  // sendBeacon fires reliably even as the page is being torn down.
  window.addEventListener('pagehide', function () {
    if (sessionActive) navigator.sendBeacon('/api/admin/logout');
  });

  var sessionActive = false;

  function showDashboard(email) {
    sessionActive = true;
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    document.getElementById('admin-email').textContent = email;
    loadSettings();
    loadHomepageContent();
    loadPagesContent();
    loadMenu();
    loadUpdates();
    loadSponsors();
    loadGallery();
    loadAuditLog();
    if (window.lucide) lucide.createIcons();
  }

  function checkSession() {
    apiGet('/api/admin/session').then(function (data) {
      if (data.authenticated) {
        showDashboard(data.email);
      } else {
        showLogin();
      }
    });
  }

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    var errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');

    apiPost('/api/admin/login', { email: email, password: password }).then(function (result) {
      if (result.ok) {
        showDashboard(result.data.email);
      } else {
        errorEl.textContent = result.data.error || 'Login failed';
        errorEl.classList.remove('hidden');
      }
    });
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    apiPost('/api/admin/logout').then(function () { showLogin(); });
  });

  // -- Tabs -------------------------------------------------------------

  document.getElementById('pages-toggle-btn').addEventListener('click', function () {
    document.getElementById('pages-subtab-list').classList.toggle('hidden');
  });

  document.getElementById('tab-list').addEventListener('click', function (e) {
    var btn = e.target.closest('.admin-tab-btn');
    if (!btn || btn.id === 'pages-toggle-btn' || !btn.dataset.tab) return;
    document.querySelectorAll('.admin-tab-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.add('hidden'); });
    document.getElementById('panel-' + btn.dataset.tab).classList.remove('hidden');
    if (btn.dataset.tab === 'audit') loadAuditLog();
    if (btn.dataset.tab === 'contact') loadContacts();
    if (btn.dataset.tab === 'wallphotos') loadWallPhotos();
  });

  // -- Site Settings ------------------------------------------------------

  function renderSocialLinkRow(link) {
    link = link || { platform: '', url: '', icon: '' };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-[7rem_1fr_6rem_auto] gap-2 sm:items-center social-link-row';
    row.innerHTML =
      '<input type="text" class="social-platform w-full bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm px-3 py-2 text-white text-xs" placeholder="platform" value="' + escapeHtml(link.platform) + '">' +
      '<input type="text" class="social-url w-full bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm px-3 py-2 text-white text-xs" placeholder="https://..." value="' + escapeHtml(link.url) + '">' +
      '<input type="text" class="social-icon w-full bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm px-3 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(link.icon) + '">' +
      '<button type="button" class="remove-social-link text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-social-link').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-social-link').addEventListener('click', function () {
    document.getElementById('social-links-list').appendChild(renderSocialLinkRow());
  });

  function loadSettings() {
    fetchJsonFile('site-config.json').then(function (config) {
      document.getElementById('settings-site_title').value = config.site_title || '';
      document.getElementById('settings-logo').value = config.logo || '';
      document.getElementById('settings-tagline').value = config.tagline || '';
      document.getElementById('settings-favicon').value = config.favicon || '';
      document.getElementById('settings-copyright_text').value = config.copyright_text || '';
      document.getElementById('settings-announcement-enabled').checked = !!(config.announcement && config.announcement.enabled);
      document.getElementById('settings-announcement-text').value = (config.announcement && config.announcement.text) || '';
      document.getElementById('settings-tracking_snippet').value = config.tracking_snippet || '';

      var list = document.getElementById('social-links-list');
      list.innerHTML = '';
      (config.footer_social_links || []).forEach(function (link) { list.appendChild(renderSocialLinkRow(link)); });
    });
  }

  document.getElementById('settings-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var socialLinks = Array.from(document.querySelectorAll('.social-link-row')).map(function (row) {
      return {
        platform: row.querySelector('.social-platform').value.trim(),
        url: row.querySelector('.social-url').value.trim(),
        icon: row.querySelector('.social-icon').value.trim(),
      };
    }).filter(function (l) { return l.url; });

    var config = {
      site_title: document.getElementById('settings-site_title').value.trim(),
      logo: document.getElementById('settings-logo').value.trim(),
      tagline: document.getElementById('settings-tagline').value.trim(),
      favicon: document.getElementById('settings-favicon').value.trim(),
      copyright_text: document.getElementById('settings-copyright_text').value.trim(),
      footer_social_links: socialLinks,
      announcement: {
        enabled: document.getElementById('settings-announcement-enabled').checked,
        text: document.getElementById('settings-announcement-text').value.trim(),
      },
      tracking_snippet: document.getElementById('settings-tracking_snippet').value,
    };

    apiPut('/api/admin/content/site-config', config).then(function (result) {
      if (result.ok) {
        flashSaved('settings-saved-msg');
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  });

  function flashSaved(id) {
    var el = document.getElementById(id);
    el.classList.remove('hidden');
    setTimeout(function () { el.classList.add('hidden'); }, 3000);
  }

  // -- Menu -----------------------------------------------------------

  function renderMenuItemRow(item) {
    item = item || { id: '', label: '', page: '', anchor: '', exclude_pages: [] };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-[6rem_1fr_1fr_8rem_1fr_auto] gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 menu-item-row';
    row.innerHTML =
      '<input type="text" class="menu-id w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="id" value="' + escapeHtml(item.id) + '">' +
      '<input type="text" class="menu-label w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Label" value="' + escapeHtml(item.label) + '">' +
      '<input type="text" class="menu-page w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Target page" value="' + escapeHtml(item.page) + '">' +
      '<input type="text" class="menu-anchor w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="anchor (optional)" value="' + escapeHtml(item.anchor || '') + '">' +
      '<input type="text" class="menu-exclude w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="exclude pages, comma-separated" value="' + escapeHtml((item.exclude_pages || []).join(', ')) + '">' +
      '<button type="button" class="remove-menu-item text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-menu-item').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-menu-item').addEventListener('click', function () {
    document.getElementById('menu-list').appendChild(renderMenuItemRow());
  });

  function loadMenu() {
    fetchJsonFile('nav.json').then(function (nav) {
      var list = document.getElementById('menu-list');
      list.innerHTML = '';
      nav.forEach(function (item) { list.appendChild(renderMenuItemRow(item)); });
    });
  }

  document.getElementById('save-menu-btn').addEventListener('click', function () {
    var nav = Array.from(document.querySelectorAll('.menu-item-row')).map(function (row) {
      var excludeRaw = row.querySelector('.menu-exclude').value.trim();
      return {
        id: row.querySelector('.menu-id').value.trim() || slugify(row.querySelector('.menu-label').value),
        label: row.querySelector('.menu-label').value.trim(),
        page: row.querySelector('.menu-page').value.trim(),
        anchor: row.querySelector('.menu-anchor').value.trim() || null,
        exclude_pages: excludeRaw ? excludeRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [],
      };
    });

    apiPut('/api/admin/content/nav', nav).then(function (result) {
      if (result.ok) {
        flashSaved('menu-saved-msg');
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  });

  // -- Updates ----------------------------------------------------------

  function renderUpdateCard(update) {
    update = update || { id: '', date: '', displayDate: '', title: '', category: '', summary: '', icon: '', image: null, pdf: null };
    var card = document.createElement('div');
    card.className = 'bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-4 space-y-2 update-item-card';
    card.innerHTML =
      '<div class="grid sm:grid-cols-3 gap-2">' +
      '<input type="text" class="update-id bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="id (auto from title)" value="' + escapeHtml(update.id) + '">' +
      '<input type="date" class="update-date bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" value="' + escapeHtml(update.date) + '">' +
      '<input type="text" class="update-category bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Category" value="' + escapeHtml(update.category) + '">' +
      '</div>' +
      '<input type="text" class="update-title w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-sm" placeholder="Title" value="' + escapeHtml(update.title) + '">' +
      '<textarea class="update-summary w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" rows="2" placeholder="Summary">' + escapeHtml(update.summary) + '</textarea>' +
      '<div class="grid sm:grid-cols-3 gap-2">' +
      '<input type="text" class="update-icon bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(update.icon || '') + '">' +
      '<input type="text" class="update-image bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="image path" value="' + escapeHtml(update.image || '') + '">' +
      '<input type="text" class="update-pdf bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="pdf path/link" value="' + escapeHtml(update.pdf || '') + '">' +
      '</div>' +
      '<button type="button" class="remove-update-item text-[#e8412f] text-xs">✕ Remove</button>';
    card.querySelector('.remove-update-item').addEventListener('click', function () { card.remove(); });
    return card;
  }

  document.getElementById('add-update-item').addEventListener('click', function () {
    document.getElementById('updates-list').prepend(renderUpdateCard());
  });

  function loadUpdates() {
    fetchJsonFile('updates.json').then(function (updates) {
      var list = document.getElementById('updates-list');
      list.innerHTML = '';
      updates.forEach(function (u) { list.appendChild(renderUpdateCard(u)); });
    });
  }

  document.getElementById('save-updates-btn').addEventListener('click', function () {
    var updates = Array.from(document.querySelectorAll('.update-item-card')).map(function (card) {
      var title = card.querySelector('.update-title').value.trim();
      var date = card.querySelector('.update-date').value;
      var image = card.querySelector('.update-image').value.trim();
      var pdf = card.querySelector('.update-pdf').value.trim();
      return {
        id: card.querySelector('.update-id').value.trim() || slugify(title),
        date: date,
        displayDate: formatDisplayDate(date),
        title: title,
        category: card.querySelector('.update-category').value.trim(),
        summary: card.querySelector('.update-summary').value.trim(),
        icon: card.querySelector('.update-icon').value.trim() || null,
        image: image || null,
        pdf: pdf || null,
      };
    });

    apiPut('/api/admin/content/updates', updates).then(function (result) {
      if (result.ok) {
        flashSaved('updates-saved-msg');
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  });

  // -- Homepage Content -------------------------------------------------

  function renderStatRow(stat) {
    stat = stat || { icon: '', title: '', description: '' };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-[8rem_10rem_1fr_auto] gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 stat-item-row';
    row.innerHTML =
      '<input type="text" class="stat-icon w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(stat.icon) + '">' +
      '<input type="text" class="stat-title w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Title" value="' + escapeHtml(stat.title) + '">' +
      '<input type="text" class="stat-description w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Description" value="' + escapeHtml(stat.description) + '">' +
      '<button type="button" class="remove-stat-item text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-stat-item').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-stat-item').addEventListener('click', function () {
    document.getElementById('hp-stats-list').appendChild(renderStatRow());
  });

  function renderTeamRow(member) {
    member = member || { initials: '', name: '', role: '', gradient_from: '#e0d2b3', gradient_to: '#c4a76a', text_color: '#000000' };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-2 sm:grid-cols-7 gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 team-item-row';
    row.innerHTML =
      '<input type="text" class="team-initials w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Initials" value="' + escapeHtml(member.initials) + '">' +
      '<input type="text" class="team-name w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Name" value="' + escapeHtml(member.name) + '">' +
      '<input type="text" class="team-role w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs col-span-2 sm:col-span-1" placeholder="Role" value="' + escapeHtml(member.role) + '">' +
      '<input type="text" class="team-gradient-from w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="#gradient from" value="' + escapeHtml(member.gradient_from) + '">' +
      '<input type="text" class="team-gradient-to w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="#gradient to" value="' + escapeHtml(member.gradient_to) + '">' +
      '<input type="text" class="team-text-color w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="#text color" value="' + escapeHtml(member.text_color) + '">' +
      '<button type="button" class="remove-team-item text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-team-item').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-team-item').addEventListener('click', function () {
    document.getElementById('hp-team-list').appendChild(renderTeamRow());
  });

  function renderRaceRow(race) {
    race = race || { date: '', name: '', subtitle: '', status: '' };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-2 sm:grid-cols-5 gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 race-item-row';
    row.innerHTML =
      '<input type="text" class="race-date w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Date (e.g. MAY 9-10)" value="' + escapeHtml(race.date) + '">' +
      '<input type="text" class="race-name w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Event name" value="' + escapeHtml(race.name) + '">' +
      '<input type="text" class="race-subtitle w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Subtitle / location" value="' + escapeHtml(race.subtitle) + '">' +
      '<input type="text" class="race-status w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Status" value="' + escapeHtml(race.status) + '">' +
      '<button type="button" class="remove-race-item text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-race-item').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-race-item').addEventListener('click', function () {
    document.getElementById('hp-races-list').appendChild(renderRaceRow());
  });

  function renderPhoneRow(phone) {
    phone = phone || { number: '', name: '' };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 sm:items-center phone-item-row';
    row.innerHTML =
      '<input type="text" class="phone-number w-full bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm px-3 py-2 text-white text-xs" placeholder="Phone number" value="' + escapeHtml(phone.number || '') + '">' +
      '<input type="text" class="phone-name w-full bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm px-3 py-2 text-white text-xs" placeholder="Name tag, e.g. Sponsorship" value="' + escapeHtml(phone.name || '') + '">' +
      '<button type="button" class="remove-phone-item text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-phone-item').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-con-phone-item').addEventListener('click', function () {
    document.getElementById('pg-con-phones-list').appendChild(renderPhoneRow());
  });

  function loadHomepageContent() {
    fetchJsonFile('homepage-content.json').then(function (content) {
      document.getElementById('hp-about-heading').value = (content.about && content.about.heading) || '';
      document.getElementById('hp-about-text').value = (content.about && content.about.text) || '';

      var statsList = document.getElementById('hp-stats-list');
      statsList.innerHTML = '';
      (content.stats || []).forEach(function (s) { statsList.appendChild(renderStatRow(s)); });

      var teamList = document.getElementById('hp-team-list');
      teamList.innerHTML = '';
      (content.team || []).forEach(function (m) { teamList.appendChild(renderTeamRow(m)); });

      document.getElementById('hp-season-status').value = (content.season && content.season.status_text) || '';
      var racesList = document.getElementById('hp-races-list');
      racesList.innerHTML = '';
      ((content.season && content.season.races) || []).forEach(function (r) { racesList.appendChild(renderRaceRow(r)); });
    });
  }

  document.getElementById('save-homepage-btn').addEventListener('click', function () {
    var content = {
      about: {
        heading: document.getElementById('hp-about-heading').value.trim(),
        text: document.getElementById('hp-about-text').value.trim(),
      },
      stats: Array.from(document.querySelectorAll('.stat-item-row')).map(function (row) {
        return {
          icon: row.querySelector('.stat-icon').value.trim(),
          title: row.querySelector('.stat-title').value.trim(),
          description: row.querySelector('.stat-description').value.trim(),
        };
      }),
      team: Array.from(document.querySelectorAll('.team-item-row')).map(function (row) {
        return {
          initials: row.querySelector('.team-initials').value.trim(),
          name: row.querySelector('.team-name').value.trim(),
          role: row.querySelector('.team-role').value.trim(),
          gradient_from: row.querySelector('.team-gradient-from').value.trim(),
          gradient_to: row.querySelector('.team-gradient-to').value.trim(),
          text_color: row.querySelector('.team-text-color').value.trim(),
        };
      }),
      season: {
        status_text: document.getElementById('hp-season-status').value.trim(),
        races: Array.from(document.querySelectorAll('.race-item-row')).map(function (row) {
          return {
            date: row.querySelector('.race-date').value.trim(),
            name: row.querySelector('.race-name').value.trim(),
            subtitle: row.querySelector('.race-subtitle').value.trim(),
            status: row.querySelector('.race-status').value.trim(),
          };
        }),
      },
    };

    apiPut('/api/admin/content/homepage-content', content).then(function (result) {
      if (result.ok) {
        flashSaved('homepage-saved-msg');
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  });

  // -- Pages Content ------------------------------------------------

  var PAGES_ENGINEERING_SECTIONS = ['evolution', 'aerodynamics', 'cad', 'physics', 'manufacturing', 'track_testing'];

  // WYSIWYG (Quill) fields — prose content on Contact/Engineering/Join the
  // Grid/Pit Wall, per the user's explicit ask. Short labels/headings on
  // these same pages (and everything on Sponsorship/Updates) stay plain
  // text inputs — a one-line heading doesn't need rich formatting.
  var QUILL_TOOLBAR = [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']];
  var quillEditors = {};
  ['pg-eng-hero-tagline', 'pg-eng-evolution-body', 'pg-con-hero-tagline', 'pg-con-quickchat-text', 'pg-pw-gallery-description', 'pg-jtg-hero-tagline'].forEach(function (id) {
    quillEditors[id] = new Quill('#' + id + '-editor', { theme: 'snow', modules: { toolbar: QUILL_TOOLBAR } });
  });

  function setQuillHtml(id, value) {
    quillEditors[id].root.innerHTML = value || '';
  }

  function getQuillHtml(id) {
    var html = quillEditors[id].root.innerHTML;
    return html === '<p><br></p>' ? '' : html;
  }

  // -- Image fields (hero/section images on the Pages tab) --------------
  // A text input holding the path + a file input that uploads a
  // replacement via the same endpoint the Gallery tab uses, then fills
  // the text input and preview with the result. Delegated so it works for
  // any .image-upload-input added to the page, present or future.
  function setImagePreview(input) {
    var previewId = input.dataset.preview;
    var preview = previewId && document.getElementById(previewId);
    if (preview) preview.src = input.value;
  }

  document.querySelectorAll('.image-path-input').forEach(function (input) {
    setImagePreview(input);
    input.addEventListener('input', function () { setImagePreview(input); });
  });

  document.addEventListener('change', function (e) {
    if (!e.target.classList || !e.target.classList.contains('image-upload-input')) return;
    var file = e.target.files[0];
    if (!file) return;
    var targetInput = document.getElementById(e.target.dataset.target);
    var reader = new FileReader();
    reader.onload = function () {
      apiPost('/api/admin/upload-image', { filename: file.name, data: reader.result }).then(function (result) {
        if (result.ok) {
          targetInput.value = result.data.path;
          setImagePreview(targetInput);
        } else {
          alert('Upload failed: ' + (result.data.error || 'unknown error'));
        }
        e.target.value = '';
      });
    };
    reader.readAsDataURL(file);
  });

  // -- Generic Engineering-section row editors ---------------------------

  function renderIconLeadTextRow(row) {
    row = row || { icon: '', lead: '', text: '' };
    var el = document.createElement('div');
    el.className = 'grid grid-cols-1 sm:grid-cols-[6rem_1fr_2fr_auto] gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 icon-lead-text-row';
    el.innerHTML =
      '<input type="text" class="row-icon w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(row.icon) + '">' +
      '<input type="text" class="row-lead w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Bold lead-in" value="' + escapeHtml(row.lead) + '">' +
      '<textarea class="row-text w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" rows="2" placeholder="Rest of the text">' + escapeHtml(row.text) + '</textarea>' +
      '<button type="button" class="remove-row text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    el.querySelector('.remove-row').addEventListener('click', function () { el.remove(); });
    return el;
  }

  function renderIconTitleTextRow(row) {
    row = row || { icon: '', title: '', text: '' };
    var el = document.createElement('div');
    el.className = 'grid grid-cols-1 sm:grid-cols-[6rem_1fr_2fr_auto] gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 icon-title-text-row';
    el.innerHTML =
      '<input type="text" class="row-icon w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(row.icon) + '">' +
      '<input type="text" class="row-title w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Title" value="' + escapeHtml(row.title) + '">' +
      '<textarea class="row-text w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" rows="2" placeholder="Text">' + escapeHtml(row.text) + '</textarea>' +
      '<button type="button" class="remove-row text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    el.querySelector('.remove-row').addEventListener('click', function () { el.remove(); });
    return el;
  }

  function renderIconFormulaTextRow(row) {
    row = row || { icon: '', formula: '', text: '' };
    var el = document.createElement('div');
    el.className = 'grid grid-cols-1 sm:grid-cols-[6rem_1fr_2fr_auto] gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 icon-formula-text-row';
    el.innerHTML =
      '<input type="text" class="row-icon w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(row.icon) + '">' +
      '<input type="text" class="row-formula w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Formula" value="' + escapeHtml(row.formula) + '">' +
      '<textarea class="row-text w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" rows="2" placeholder="Text">' + escapeHtml(row.text) + '</textarea>' +
      '<button type="button" class="remove-row text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    el.querySelector('.remove-row').addEventListener('click', function () { el.remove(); });
    return el;
  }

  function renderEvolutionCardRow(card) {
    card = card || { icon: '', label: '', title: '', items: [] };
    var el = document.createElement('div');
    el.className = 'bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 space-y-2 evolution-card-row';
    el.innerHTML =
      '<div class="grid sm:grid-cols-3 gap-2">' +
      '<input type="text" class="row-icon bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="lucide icon" value="' + escapeHtml(card.icon) + '">' +
      '<input type="text" class="row-label bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Small label above title" value="' + escapeHtml(card.label) + '">' +
      '<input type="text" class="row-title bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Card title" value="' + escapeHtml(card.title) + '">' +
      '</div>' +
      '<textarea class="row-items w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" rows="3" placeholder="Bullet points, one per line">' + escapeHtml((card.items || []).join('\n')) + '</textarea>' +
      '<button type="button" class="remove-row text-[#e8412f] text-xs">✕ Remove</button>';
    el.querySelector('.remove-row').addEventListener('click', function () { el.remove(); });
    return el;
  }

  function renderSimpleTextRow(value) {
    var el = document.createElement('div');
    el.className = 'flex gap-2 items-center simple-text-row';
    el.innerHTML =
      '<input type="text" class="row-value flex-1 bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm px-3 py-2 text-white text-xs" value="' + escapeHtml(value || '') + '">' +
      '<button type="button" class="remove-row text-[#e8412f] text-xs px-2">✕</button>';
    el.querySelector('.remove-row').addEventListener('click', function () { el.remove(); });
    return el;
  }

  function wireAddButton(btnId, listId, renderFn) {
    document.getElementById(btnId).addEventListener('click', function () {
      document.getElementById(listId).appendChild(renderFn());
    });
  }
  wireAddButton('add-eng-evolution-card', 'pg-eng-evolution-cards-list', renderEvolutionCardRow);
  wireAddButton('add-eng-aerodynamics-row', 'pg-eng-aerodynamics-rows-list', renderIconLeadTextRow);
  wireAddButton('add-eng-cad-card', 'pg-eng-cad-cards-list', renderIconTitleTextRow);
  wireAddButton('add-eng-cad-material', 'pg-eng-cad-materials-list', renderSimpleTextRow);
  wireAddButton('add-eng-physics-card', 'pg-eng-physics-cards-list', renderIconFormulaTextRow);
  wireAddButton('add-eng-manufacturing-row', 'pg-eng-manufacturing-rows-list', renderIconLeadTextRow);
  wireAddButton('add-eng-track_testing-card', 'pg-eng-track_testing-cards-list', renderIconTitleTextRow);

  function readIconLeadTextRows(listId) {
    return Array.from(document.querySelectorAll('#' + listId + ' .icon-lead-text-row')).map(function (row) {
      return {
        icon: row.querySelector('.row-icon').value.trim(),
        lead: row.querySelector('.row-lead').value.trim(),
        text: row.querySelector('.row-text').value.trim(),
      };
    });
  }

  function readIconTitleTextRows(listId) {
    return Array.from(document.querySelectorAll('#' + listId + ' .icon-title-text-row')).map(function (row) {
      return {
        icon: row.querySelector('.row-icon').value.trim(),
        title: row.querySelector('.row-title').value.trim(),
        text: row.querySelector('.row-text').value.trim(),
      };
    });
  }

  function readIconFormulaTextRows(listId) {
    return Array.from(document.querySelectorAll('#' + listId + ' .icon-formula-text-row')).map(function (row) {
      return {
        icon: row.querySelector('.row-icon').value.trim(),
        formula: row.querySelector('.row-formula').value.trim(),
        text: row.querySelector('.row-text').value.trim(),
      };
    });
  }

  function readEvolutionCards(listId) {
    return Array.from(document.querySelectorAll('#' + listId + ' .evolution-card-row')).map(function (row) {
      return {
        icon: row.querySelector('.row-icon').value.trim(),
        label: row.querySelector('.row-label').value.trim(),
        title: row.querySelector('.row-title').value.trim(),
        items: row.querySelector('.row-items').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      };
    });
  }

  function readSimpleTextRows(listId) {
    return Array.from(document.querySelectorAll('#' + listId + ' .simple-text-row .row-value')).map(function (input) {
      return input.value.trim();
    }).filter(Boolean);
  }

  function setImagePathField(id, value) {
    var input = document.getElementById(id);
    if (!input) return;
    input.value = value || '';
    setImagePreview(input);
  }

  function loadPagesContent() {
    fetchJsonFile('pages-content.json').then(function (content) {
      var eng = content.engineering || {};
      document.getElementById('pg-eng-hero-eyebrow').value = eng.hero_eyebrow || '';
      setQuillHtml('pg-eng-hero-tagline', eng.hero_tagline);
      setImagePathField('pg-eng-hero-image', eng.hero_image);
      document.getElementById('pg-eng-hero-image-label').value = eng.hero_image_label || '';
      document.getElementById('pg-eng-hero-image-caption').value = eng.hero_image_caption || '';

      var engSections = eng.sections || {};
      PAGES_ENGINEERING_SECTIONS.forEach(function (key) {
        var section = engSections[key] || {};
        document.getElementById('pg-eng-' + key + '-eyebrow').value = section.eyebrow || '';
        document.getElementById('pg-eng-' + key + '-heading').value = section.heading || '';
      });

      var evo = engSections.evolution || {};
      setQuillHtml('pg-eng-evolution-body', evo.body);
      var evoCardsList = document.getElementById('pg-eng-evolution-cards-list');
      evoCardsList.innerHTML = '';
      (evo.cards || []).forEach(function (c) { evoCardsList.appendChild(renderEvolutionCardRow(c)); });
      setImagePathField('pg-eng-evolution-image', evo.image);

      var aero = engSections.aerodynamics || {};
      setImagePathField('pg-eng-aerodynamics-image', aero.image);
      var aeroRowsList = document.getElementById('pg-eng-aerodynamics-rows-list');
      aeroRowsList.innerHTML = '';
      (aero.rows || []).forEach(function (r) { aeroRowsList.appendChild(renderIconLeadTextRow(r)); });

      var cad = engSections.cad || {};
      var cadCardsList = document.getElementById('pg-eng-cad-cards-list');
      cadCardsList.innerHTML = '';
      (cad.cards || []).forEach(function (c) { cadCardsList.appendChild(renderIconTitleTextRow(c)); });
      document.getElementById('pg-eng-cad-materials-label').value = cad.materials_label || '';
      var cadMaterialsList = document.getElementById('pg-eng-cad-materials-list');
      cadMaterialsList.innerHTML = '';
      (cad.materials || []).forEach(function (m) { cadMaterialsList.appendChild(renderSimpleTextRow(m)); });

      var physics = engSections.physics || {};
      var physicsCardsList = document.getElementById('pg-eng-physics-cards-list');
      physicsCardsList.innerHTML = '';
      (physics.cards || []).forEach(function (c) { physicsCardsList.appendChild(renderIconFormulaTextRow(c)); });

      var manu = engSections.manufacturing || {};
      var manuRowsList = document.getElementById('pg-eng-manufacturing-rows-list');
      manuRowsList.innerHTML = '';
      (manu.rows || []).forEach(function (r) { manuRowsList.appendChild(renderIconLeadTextRow(r)); });
      setImagePathField('pg-eng-manufacturing-image', manu.image);

      var track = engSections.track_testing || {};
      var trackCardsList = document.getElementById('pg-eng-track_testing-cards-list');
      trackCardsList.innerHTML = '';
      (track.cards || []).forEach(function (c) { trackCardsList.appendChild(renderIconTitleTextRow(c)); });

      var spon = content.sponsorship || {};
      document.getElementById('pg-spon-hero-eyebrow').value = spon.hero_eyebrow || '';
      document.getElementById('pg-spon-hero-tagline').value = spon.hero_tagline || '';
      document.getElementById('pg-spon-sponsors-eyebrow').value = spon.sponsors_eyebrow || '';
      document.getElementById('pg-spon-sponsors-heading').value = spon.sponsors_heading || '';
      document.getElementById('pg-spon-sponsors-text').value = spon.sponsors_text || '';
      document.getElementById('pg-spon-partner-eyebrow').value = spon.partner_eyebrow || '';
      document.getElementById('pg-spon-partner-heading').value = spon.partner_heading || '';
      document.getElementById('pg-spon-partner-text').value = spon.partner_text || '';

      var upd = content.updates || {};
      document.getElementById('pg-upd-hero-eyebrow').value = upd.hero_eyebrow || '';
      document.getElementById('pg-upd-hero-tagline').value = upd.hero_tagline || '';

      var pw = content.pitwall || {};
      document.getElementById('pg-pw-gallery-eyebrow').value = pw.gallery_eyebrow || '';
      document.getElementById('pg-pw-gallery-heading').value = pw.gallery_heading || '';
      setQuillHtml('pg-pw-gallery-description', pw.gallery_description);

      var jtg = content.jointhegrid || {};
      document.getElementById('pg-jtg-hero-eyebrow').value = jtg.hero_eyebrow || '';
      setQuillHtml('pg-jtg-hero-tagline', jtg.hero_tagline);
      document.getElementById('pg-jtg-success-heading').value = jtg.success_heading || '';
      document.getElementById('pg-jtg-success-text').value = jtg.success_text || '';

      var con = content.contact || {};
      document.getElementById('pg-con-hero-eyebrow').value = con.hero_eyebrow || '';
      setQuillHtml('pg-con-hero-tagline', con.hero_tagline);
      document.getElementById('pg-con-quickchat-heading').value = con.quick_chat_heading || '';
      setQuillHtml('pg-con-quickchat-text', con.quick_chat_text);
      document.getElementById('pg-con-email').value = con.email || '';
      var conPhonesList = document.getElementById('pg-con-phones-list');
      conPhonesList.innerHTML = '';
      (con.phones || []).forEach(function (p) { conPhonesList.appendChild(renderPhoneRow(p)); });
    });
  }

  function savePagesContent(msgEl) {
    var sections = {};
    PAGES_ENGINEERING_SECTIONS.forEach(function (key) {
      sections[key] = {
        eyebrow: document.getElementById('pg-eng-' + key + '-eyebrow').value.trim(),
        heading: document.getElementById('pg-eng-' + key + '-heading').value.trim(),
      };
    });
    sections.evolution.body = getQuillHtml('pg-eng-evolution-body');
    sections.evolution.cards = readEvolutionCards('pg-eng-evolution-cards-list');
    sections.evolution.image = document.getElementById('pg-eng-evolution-image').value.trim();

    sections.aerodynamics.image = document.getElementById('pg-eng-aerodynamics-image').value.trim();
    sections.aerodynamics.rows = readIconLeadTextRows('pg-eng-aerodynamics-rows-list');

    sections.cad.cards = readIconTitleTextRows('pg-eng-cad-cards-list');
    sections.cad.materials_label = document.getElementById('pg-eng-cad-materials-label').value.trim();
    sections.cad.materials = readSimpleTextRows('pg-eng-cad-materials-list');

    sections.physics.cards = readIconFormulaTextRows('pg-eng-physics-cards-list');

    sections.manufacturing.rows = readIconLeadTextRows('pg-eng-manufacturing-rows-list');
    sections.manufacturing.image = document.getElementById('pg-eng-manufacturing-image').value.trim();

    sections.track_testing.cards = readIconTitleTextRows('pg-eng-track_testing-cards-list');

    var content = {
      engineering: {
        hero_eyebrow: document.getElementById('pg-eng-hero-eyebrow').value.trim(),
        hero_tagline: getQuillHtml('pg-eng-hero-tagline'),
        hero_image: document.getElementById('pg-eng-hero-image').value.trim(),
        hero_image_label: document.getElementById('pg-eng-hero-image-label').value.trim(),
        hero_image_caption: document.getElementById('pg-eng-hero-image-caption').value.trim(),
        sections: sections,
      },
      sponsorship: {
        hero_eyebrow: document.getElementById('pg-spon-hero-eyebrow').value.trim(),
        hero_tagline: document.getElementById('pg-spon-hero-tagline').value.trim(),
        sponsors_eyebrow: document.getElementById('pg-spon-sponsors-eyebrow').value.trim(),
        sponsors_heading: document.getElementById('pg-spon-sponsors-heading').value.trim(),
        sponsors_text: document.getElementById('pg-spon-sponsors-text').value.trim(),
        partner_eyebrow: document.getElementById('pg-spon-partner-eyebrow').value.trim(),
        partner_heading: document.getElementById('pg-spon-partner-heading').value.trim(),
        partner_text: document.getElementById('pg-spon-partner-text').value.trim(),
      },
      updates: {
        hero_eyebrow: document.getElementById('pg-upd-hero-eyebrow').value.trim(),
        hero_tagline: document.getElementById('pg-upd-hero-tagline').value.trim(),
      },
      pitwall: {
        gallery_eyebrow: document.getElementById('pg-pw-gallery-eyebrow').value.trim(),
        gallery_heading: document.getElementById('pg-pw-gallery-heading').value.trim(),
        gallery_description: getQuillHtml('pg-pw-gallery-description'),
      },
      jointhegrid: {
        hero_eyebrow: document.getElementById('pg-jtg-hero-eyebrow').value.trim(),
        hero_tagline: getQuillHtml('pg-jtg-hero-tagline'),
        success_heading: document.getElementById('pg-jtg-success-heading').value.trim(),
        success_text: document.getElementById('pg-jtg-success-text').value.trim(),
      },
      contact: {
        hero_eyebrow: document.getElementById('pg-con-hero-eyebrow').value.trim(),
        hero_tagline: getQuillHtml('pg-con-hero-tagline'),
        quick_chat_heading: document.getElementById('pg-con-quickchat-heading').value.trim(),
        quick_chat_text: getQuillHtml('pg-con-quickchat-text'),
        email: document.getElementById('pg-con-email').value.trim(),
        phones: Array.from(document.querySelectorAll('#pg-con-phones-list .phone-item-row')).map(function (row) {
          return {
            number: row.querySelector('.phone-number').value.trim(),
            name: row.querySelector('.phone-name').value.trim(),
          };
        }).filter(function (p) { return p.number; }),
      },
    };

    apiPut('/api/admin/content/pages-content', content).then(function (result) {
      if (result.ok) {
        msgEl.classList.remove('hidden');
        setTimeout(function () { msgEl.classList.add('hidden'); }, 3000);
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  }

  document.querySelectorAll('.save-pages-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { savePagesContent(btn.nextElementSibling); });
  });

  // -- Sponsors -----------------------------------------------------

  function renderSponsorRow(sponsor) {
    sponsor = sponsor || { id: '', name: '', logo: '', tier: 'gold' };
    var row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-[1fr_1fr_8rem_auto] gap-2 sm:items-center bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-3 sponsor-item-row';
    row.innerHTML =
      '<input type="text" class="sponsor-name w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Sponsor name" value="' + escapeHtml(sponsor.name) + '">' +
      '<input type="text" class="sponsor-logo w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs" placeholder="Logo path" value="' + escapeHtml(sponsor.logo) + '">' +
      '<select class="sponsor-tier w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-2 text-white text-xs">' +
      ['gold', 'silver', 'bronze'].map(function (t) {
        return '<option value="' + t + '"' + (sponsor.tier === t ? ' selected' : '') + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
      }).join('') +
      '</select>' +
      '<button type="button" class="remove-sponsor-item text-[#e8412f] text-xs px-2 justify-self-start sm:justify-self-auto">✕ Remove</button>';
    row.querySelector('.remove-sponsor-item').addEventListener('click', function () { row.remove(); });
    return row;
  }

  document.getElementById('add-sponsor-item').addEventListener('click', function () {
    document.getElementById('sponsors-list').appendChild(renderSponsorRow());
  });

  function loadSponsors() {
    fetchJsonFile('sponsors.json').then(function (sponsors) {
      var list = document.getElementById('sponsors-list');
      list.innerHTML = '';
      sponsors.forEach(function (s) { list.appendChild(renderSponsorRow(s)); });
    });
  }

  document.getElementById('save-sponsors-btn').addEventListener('click', function () {
    var sponsors = Array.from(document.querySelectorAll('.sponsor-item-row')).map(function (row) {
      var name = row.querySelector('.sponsor-name').value.trim();
      return {
        id: slugify(name),
        name: name,
        logo: row.querySelector('.sponsor-logo').value.trim(),
        tier: row.querySelector('.sponsor-tier').value,
      };
    });

    apiPut('/api/admin/content/sponsors', sponsors).then(function (result) {
      if (result.ok) {
        flashSaved('sponsors-saved-msg');
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  });

  // -- Bulk selection (shared by Gallery + Wall Photos) ------------------
  // Wires a "select all" checkbox + live "N selected" label + a bulk-action
  // button's visibility to a container of per-item checkboxes. Selection
  // state lives entirely in the checkboxes themselves (no separate JS
  // state to keep in sync) — getSelected() just reads the checked ones.

  function wireBulkSelection(opts) {
    var container = document.getElementById(opts.containerId);
    var selectAll = document.getElementById(opts.selectAllId);
    var countEl = document.getElementById(opts.countId);
    var actionBtn = document.getElementById(opts.actionBtnId);

    function refresh() {
      var boxes = container.querySelectorAll('.item-select');
      var checked = container.querySelectorAll('.item-select:checked');
      countEl.textContent = checked.length ? checked.length + ' selected' : '';
      actionBtn.classList.toggle('hidden', checked.length === 0);
      selectAll.checked = boxes.length > 0 && checked.length === boxes.length;
    }

    container.addEventListener('change', function (e) {
      if (e.target.classList.contains('item-select')) refresh();
    });
    selectAll.addEventListener('change', function () {
      container.querySelectorAll('.item-select').forEach(function (box) { box.checked = selectAll.checked; });
      refresh();
    });

    return {
      getSelectedItems: function () { return Array.from(container.querySelectorAll('.item-select:checked')).map(function (b) { return b.closest('.bulk-item'); }); },
      refresh: refresh,
    };
  }

  function uploadFilesSequentially(files, onEach) {
    var chain = Promise.resolve();
    Array.from(files).forEach(function (file) {
      chain = chain.then(function () {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            apiPost('/api/admin/upload-image', { filename: file.name, data: reader.result }).then(function (result) {
              onEach(file, result);
              resolve();
            });
          };
          reader.readAsDataURL(file);
        });
      });
    });
    return chain;
  }

  // -- Gallery ----------------------------------------------------------

  function renderGalleryItem(item) {
    item = item || { id: '', image: '', caption: '' };
    var card = document.createElement('div');
    card.className = 'relative bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm overflow-hidden gallery-item-card bulk-item';
    card.dataset.image = item.image;
    card.innerHTML =
      '<input type="checkbox" class="item-select absolute top-2 left-2 z-10 w-4 h-4">' +
      '<div class="bg-[#111111]">' +
      (item.image ? '<img src="' + item.image + '" class="w-full h-auto object-contain" alt="">' : '') +
      '</div>' +
      '<div class="p-2 space-y-2">' +
      '<input type="text" class="gallery-caption w-full bg-[#111111] border border-[#2c2c2c] rounded-sm px-2 py-1 text-white text-xs" placeholder="Caption" value="' + escapeHtml(item.caption || '') + '">' +
      '<button type="button" class="remove-gallery-item text-[#e8412f] text-xs">✕ Remove</button>' +
      '</div>';
    card.querySelector('.remove-gallery-item').addEventListener('click', function () { card.remove(); galleryBulk.refresh(); });
    return card;
  }

  function loadGallery() {
    fetchJsonFile('gallery.json').then(function (images) {
      var list = document.getElementById('gallery-list');
      list.innerHTML = '';
      images.forEach(function (img) { list.appendChild(renderGalleryItem(img)); });
      galleryBulk.refresh();
    });
  }

  var galleryBulk = wireBulkSelection({
    containerId: 'gallery-list', selectAllId: 'gallery-select-all',
    countId: 'gallery-selected-count', actionBtnId: 'gallery-delete-selected',
  });

  document.getElementById('gallery-delete-selected').addEventListener('click', function () {
    galleryBulk.getSelectedItems().forEach(function (item) { item.remove(); });
    galleryBulk.refresh();
  });

  document.getElementById('gallery-file-input').addEventListener('change', function (e) {
    var files = e.target.files;
    if (!files.length) return;
    var statusEl = document.getElementById('gallery-upload-status');
    statusEl.textContent = 'Uploading 0 / ' + files.length + '...';
    var done = 0;
    uploadFilesSequentially(files, function (file, result) {
      done++;
      if (result.ok) {
        document.getElementById('gallery-list').appendChild(renderGalleryItem({ image: result.data.path, caption: '' }));
      } else {
        statusEl.textContent = 'Failed on ' + file.name + ': ' + (result.data.error || 'unknown error');
      }
      statusEl.textContent = 'Uploaded ' + done + ' / ' + files.length;
    }).then(function () {
      galleryBulk.refresh();
      loadAuditLog();
      e.target.value = '';
    });
  });

  document.getElementById('save-gallery-btn').addEventListener('click', function () {
    var images = Array.from(document.querySelectorAll('.gallery-item-card')).map(function (card) {
      var image = card.dataset.image;
      return {
        id: slugify(image.split('/').pop()),
        image: image,
        caption: card.querySelector('.gallery-caption').value.trim(),
      };
    });

    apiPut('/api/admin/content/gallery', images).then(function (result) {
      if (result.ok) {
        flashSaved('gallery-saved-msg');
        loadAuditLog();
      } else if (result.status === 401) {
        showLogin();
      }
    });
  });

  // -- Wall Photos --------------------------------------------------------

  function renderWallPhotoItem(photo) {
    var card = document.createElement('div');
    card.className = 'relative bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm overflow-hidden bulk-item';
    card.dataset.id = photo.id;
    card.innerHTML =
      '<input type="checkbox" class="item-select absolute top-2 left-2 z-10 w-4 h-4">' +
      '<div class="bg-[#111111]"><img src="' + photo.image_path + '" class="w-full h-auto object-contain" alt=""></div>' +
      '<button type="button" class="remove-wallphoto-item absolute bottom-2 right-2 bg-[#000000]/80 text-[#e8412f] text-xs px-2 py-1 rounded-sm">✕ Remove</button>';
    card.querySelector('.remove-wallphoto-item').addEventListener('click', function () {
      fetch('/api/admin/wall-photos/' + photo.id, { method: 'DELETE', credentials: 'same-origin' })
        .then(function (res) { return res.json(); })
        .then(function () { card.remove(); wallPhotosBulk.refresh(); loadAuditLog(); });
    });
    return card;
  }

  function loadWallPhotos() {
    apiGet('/api/wall-photos').then(function (data) {
      var list = document.getElementById('wallphotos-list');
      var empty = document.getElementById('wallphotos-empty');
      var photos = data.photos || [];
      list.innerHTML = '';
      empty.classList.toggle('hidden', photos.length > 0);
      photos.forEach(function (p) { list.appendChild(renderWallPhotoItem(p)); });
      wallPhotosBulk.refresh();
    });
  }

  var wallPhotosBulk = wireBulkSelection({
    containerId: 'wallphotos-list', selectAllId: 'wallphotos-select-all',
    countId: 'wallphotos-selected-count', actionBtnId: 'wallphotos-delete-selected',
  });

  document.getElementById('wallphotos-delete-selected').addEventListener('click', function () {
    var items = wallPhotosBulk.getSelectedItems();
    Promise.all(items.map(function (item) {
      return fetch('/api/admin/wall-photos/' + item.dataset.id, { method: 'DELETE', credentials: 'same-origin' });
    })).then(function () { loadWallPhotos(); loadAuditLog(); });
  });

  document.getElementById('wallphotos-clear-all').addEventListener('click', function () {
    fetch('/api/wall-photos/clear', { method: 'POST' })
      .then(function () { loadWallPhotos(); loadAuditLog(); });
  });

  document.getElementById('wallphotos-file-input').addEventListener('change', function (e) {
    var files = e.target.files;
    if (!files.length) return;
    var statusEl = document.getElementById('wallphotos-upload-status');
    statusEl.textContent = 'Uploading 0 / ' + files.length + '...';
    var chain = Promise.resolve();
    var done = 0;
    Array.from(files).forEach(function (file) {
      chain = chain.then(function () {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            fetch('/api/wall-photos', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: reader.result }),
            }).then(function (res) { return res.json(); }).then(function (result) {
              done++;
              statusEl.textContent = result.ok
                ? 'Uploaded ' + done + ' / ' + files.length
                : 'Failed on ' + file.name + ': ' + (result.error || 'unknown error');
              resolve();
            });
          };
          reader.readAsDataURL(file);
        });
      });
    });
    chain.then(function () {
      loadWallPhotos();
      loadAuditLog();
      e.target.value = '';
    });
  });

  // -- Contact Data -------------------------------------------------

  function renderContactRow(submission) {
    var row = document.createElement('div');
    row.className = 'bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-4 space-y-2 contact-item-row';
    row.dataset.id = submission.id;
    var statusColor = submission.status === 'actioned' ? 'text-[#d0bd92]' : 'text-[#e0d2b3]';
    row.innerHTML =
      '<div class="flex items-center justify-between gap-2 flex-wrap">' +
      '<span class="font-mono text-xs text-[#636363]">' + escapeHtml(submission.timestamp) + '</span>' +
      '<span class="text-xs font-mono uppercase ' + statusColor + '">' + escapeHtml(submission.status) + '</span>' +
      '</div>' +
      '<div class="text-white text-sm font-semibold">' + escapeHtml(submission.name) + ' — <span class="text-[#bababa] font-normal">' + escapeHtml(submission.email) + '</span></div>' +
      '<p class="text-[#727272] text-sm">' + escapeHtml(submission.message) + '</p>' +
      '<div class="flex gap-3">' +
      '<button type="button" class="toggle-status-btn text-xs text-[#e0d2b3] hover:underline">' + (submission.status === 'actioned' ? 'Mark New' : 'Mark Actioned') + '</button>' +
      '<button type="button" class="delete-contact-btn text-xs text-[#e8412f] hover:underline">Delete</button>' +
      '</div>';

    row.querySelector('.toggle-status-btn').addEventListener('click', function () {
      var newStatus = submission.status === 'actioned' ? 'new' : 'actioned';
      apiPut('/api/admin/contact-submissions/' + submission.id, { status: newStatus }).then(function (result) {
        if (result.ok) { loadContacts(); loadAuditLog(); }
      });
    });
    row.querySelector('.delete-contact-btn').addEventListener('click', function () {
      fetch('/api/admin/contact-submissions/' + submission.id, { method: 'DELETE', credentials: 'same-origin' })
        .then(function (res) { return res.json(); })
        .then(function () { loadContacts(); loadAuditLog(); });
    });
    return row;
  }

  function loadContacts() {
    apiGet('/api/admin/contact-submissions').then(function (data) {
      var list = document.getElementById('contacts-list');
      var empty = document.getElementById('contacts-empty');
      var exportBtn = document.getElementById('export-contacts-btn');
      var entries = data.entries || [];
      list.innerHTML = '';
      exportBtn.disabled = entries.length === 0;
      exportBtn.classList.toggle('opacity-40', entries.length === 0);
      exportBtn.classList.toggle('cursor-not-allowed', entries.length === 0);
      if (entries.length === 0) {
        empty.classList.remove('hidden');
      } else {
        empty.classList.add('hidden');
        entries.forEach(function (s) { list.appendChild(renderContactRow(s)); });
      }
    });
  }

  document.getElementById('export-contacts-btn').addEventListener('click', function () {
    apiGet('/api/admin/contact-submissions').then(function (data) {
      var entries = data.entries || [];
      var header = ['id', 'timestamp', 'name', 'email', 'message', 'status'];
      var csvRows = [header.join(',')];
      entries.forEach(function (row) {
        csvRows.push(header.map(function (key) {
          var val = String(row[key] == null ? '' : row[key]);
          return '"' + val.replace(/"/g, '""') + '"';
        }).join(','));
      });
      var blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'contact-submissions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  // -- Audit log -----------------------------------------------------

  function loadAuditLog() {
    apiGet('/api/admin/audit-log?limit=50').then(function (data) {
      if (!data.entries) return;
      var body = document.getElementById('audit-log-body');
      body.innerHTML = data.entries.map(function (row) {
        return '<tr class="border-b border-[#1e1e1e]">' +
          '<td class="py-2 pr-4 font-mono text-xs text-[#636363]">' + escapeHtml(row.timestamp) + '</td>' +
          '<td class="py-2 pr-4">' + escapeHtml(row.user_email || '') + '</td>' +
          '<td class="py-2 pr-4">' + escapeHtml(row.action) + '</td>' +
          '<td class="py-2 pr-4 text-[#636363]">' + escapeHtml(row.target || '') + '</td>' +
          '</tr>';
      }).join('');
    });
  }

  checkSession();
})();
