// Renders About/Stats/Team/Season on index.html from homepage-content.json.
// Same resilience pattern as site-chrome.js: only overwrites a container on
// fetch success, so today's hardcoded markup is the fallback if this ever
// fails to load. Contact (email/phones) moved to pages-content.js/json —
// it's Contact-page content, not homepage content.
(function () {
  function renderAbout(about) {
    var heading = document.getElementById('about-heading');
    var text = document.getElementById('about-text');
    if (heading && about.heading) heading.innerHTML = about.heading;
    if (text && about.text) text.textContent = about.text;
  }

  function renderStats(stats) {
    var grid = document.getElementById('stats-grid');
    if (!grid || !Array.isArray(stats)) return;
    grid.innerHTML = stats.map(function (s) {
      return '<div class="bg-[#1e1e1e] rounded-sm p-6 card-hover border border-[#2c2c2c]">' +
        '<i data-lucide="' + s.icon + '" style="width:28px;height:28px;color:#e0d2b3;"></i>' +
        '<h3 class="text-white font-bold mt-4 text-sm uppercase tracking-wide">' + s.title + '</h3>' +
        '<p class="text-[#727272] text-xs mt-2 leading-relaxed">' + s.description + '</p>' +
        '</div>';
    }).join('');
  }

  function renderTeam(team) {
    var grid = document.getElementById('team-grid');
    if (!grid || !Array.isArray(team)) return;
    grid.innerHTML = team.map(function (m) {
      return '<div class="group relative bg-[#111111] rounded-sm overflow-hidden card-hover border border-[#1e1e1e]">' +
        '<div class="aspect-square bg-gradient-to-br from-[' + m.gradient_from + '] to-[' + m.gradient_to + '] flex items-center justify-center">' +
        '<span class="text-4xl font-black text-[' + m.text_color + ']">' + m.initials + '</span>' +
        '</div>' +
        '<div class="p-4">' +
        '<div class="text-white font-bold text-sm">' + m.name + '</div>' +
        '<div class="text-[#d0bd92] text-xs font-mono mt-1">' + m.role + '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function renderSeason(season) {
    var statusEl = document.getElementById('season-status-text');
    if (statusEl && season.status_text) statusEl.textContent = season.status_text;

    var races = document.getElementById('season-races');
    if (races && Array.isArray(season.races)) {
      races.innerHTML = season.races.map(function (r) {
        return '<div class="flex items-center gap-6 py-5 border-b border-[#1e1e1e] hover:bg-[#111111]/50 transition-colors px-4 rounded-sm group">' +
          '<div class="font-mono text-sm text-[#636363] w-24 shrink-0">' + r.date + '</div>' +
          '<div class="w-2 h-2 rounded-full bg-[#e0d2b3] shrink-0"></div>' +
          '<div class="flex-1"><span class="text-white font-semibold">' + r.name + '</span> <span class="text-[#636363] text-sm ml-3">— ' + r.subtitle + '</span></div>' +
          '<span class="font-mono text-xs text-[#d0bd92] group-hover:text-white transition-colors">' + r.status + '</span>' +
          '</div>';
      }).join('');
    }
  }

  fetch('homepage-content.json')
    .then(function (res) { return res.json(); })
    .then(function (content) {
      if (content.about) renderAbout(content.about);
      if (content.stats) renderStats(content.stats);
      if (content.team) renderTeam(content.team);
      if (content.season) renderSeason(content.season);
      if (window.lucide) lucide.createIcons();
    })
    .catch(function (err) { console.error('homepage-content: failed to load', err); });
})();
