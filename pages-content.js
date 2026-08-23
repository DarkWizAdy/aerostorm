// Renders hero eyebrow/tagline (and a few section headings) on
// Engineering/Sponsorship/Updates/Gallery/Contact from pages-content.json.
// Same resilience pattern as site-chrome.js: only overwrites a container on
// fetch success, so today's hardcoded markup is the fallback if this fails.
(function () {
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  // For fields edited via the admin's WYSIWYG (Quill) editor — stored as
  // HTML, rendered as HTML. Safe here because this HTML only ever comes
  // from the admin's own rich-text editor, never from a visitor.
  function setHtml(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.innerHTML = value;
  }

  function setImg(id, src) {
    var el = document.getElementById(id);
    if (el && src) el.src = src;
  }

  function iconBox(icon, size) {
    return '<div class="w-10 h-10 rounded-sm bg-[#e0d2b3]/10 flex items-center justify-center shrink-0"><i data-lucide="' + icon + '" style="width:' + size + 'px;height:' + size + 'px;color:#e0d2b3;"></i></div>';
  }

  // Evolution's two comparison cards (icon/label/title + bullet list)
  function renderEvolutionCards(id, cards) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(cards)) return;
    el.innerHTML = cards.map(function (c, i) {
      var borderClass = i === 0 ? 'border-[#2c2c2c]' : 'border-[#e0d2b3]/30';
      var labelClass = i === 0 ? 'text-[#636363]' : 'text-[#d0bd92]';
      var itemsColor = i === 0 ? 'text-[#727272]' : 'text-[#bababa]';
      var items = (c.items || []).map(function (item) {
        return '<li class="flex gap-2"><span class="text-[#e0d2b3] shrink-0">—</span>' + item + '</li>';
      }).join('');
      return '<div class="relative bg-[#111111] border ' + borderClass + ' rounded-sm p-8 card-hover">' +
        '<div class="flex items-center gap-3 mb-5">' + iconBox(c.icon || 'circle', 20) +
        '<div><span class="font-mono text-[10px] tracking-[0.2em] ' + labelClass + ' uppercase">' + (c.label || '') + '</span>' +
        '<h3 class="text-white font-bold text-lg">' + (c.title || '') + '</h3></div></div>' +
        '<ul class="space-y-3 ' + itemsColor + ' text-sm leading-relaxed">' + items + '</ul></div>';
    }).join('');
  }

  // Icon + bold lead-in + text rows (Aerodynamics, Manufacturing)
  function renderIconRows(id, rows) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(rows)) return;
    el.innerHTML = rows.map(function (r) {
      return '<div class="flex gap-4">' + iconBox(r.icon || 'circle', 20) +
        '<p class="text-[#bababa] text-sm leading-relaxed"><span class="text-white font-semibold">' + (r.lead || '') + '</span> ' + (r.text || '') + '</p></div>';
    }).join('');
  }

  // Icon + title + text cards (CAD, Track Testing)
  function renderIconTextCards(id, cards) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(cards)) return;
    el.innerHTML = cards.map(function (c) {
      return '<div class="relative bg-[#111111] border border-[#2c2c2c] rounded-sm p-8 card-hover">' +
        '<div class="w-10 h-10 rounded-sm bg-[#e0d2b3]/10 flex items-center justify-center mb-5"><i data-lucide="' + (c.icon || 'circle') + '" style="width:20px;height:20px;color:#e0d2b3;"></i></div>' +
        '<h3 class="text-white font-bold text-lg mb-3">' + (c.title || '') + '</h3>' +
        '<p class="text-[#727272] text-sm leading-relaxed">' + (c.text || '') + '</p></div>';
    }).join('');
  }

  // Icon + formula + text cards (Physics)
  function renderFormulaCards(id, cards) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(cards)) return;
    el.innerHTML = cards.map(function (c) {
      return '<div class="relative bg-[#0a0a0a] border border-[#2c2c2c] rounded-sm p-8 card-hover">' +
        '<div class="w-10 h-10 rounded-sm bg-[#e0d2b3]/10 flex items-center justify-center mb-5"><i data-lucide="' + (c.icon || 'circle') + '" style="width:20px;height:20px;color:#e0d2b3;"></i></div>' +
        '<p class="font-mono text-[#e0d2b3] text-lg mb-3">' + (c.formula || '') + '</p>' +
        '<p class="text-[#727272] text-sm leading-relaxed">' + (c.text || '') + '</p></div>';
    }).join('');
  }

  function renderMaterials(id, materials) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(materials)) return;
    el.innerHTML = materials.map(function (m) {
      return '<div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-[#e0d2b3] shrink-0"></div><p class="text-[#bababa] text-sm">' + m + '</p></div>';
    }).join('');
  }

  function renderEngineering(data) {
    if (!data) return;
    setText('eng-hero-eyebrow', data.hero_eyebrow);
    setHtml('eng-hero-tagline', data.hero_tagline);
    setImg('eng-hero-image', data.hero_image);
    setText('eng-hero-image-label', data.hero_image_label);
    setText('eng-hero-image-caption', data.hero_image_caption);

    var sections = data.sections || {};
    Object.keys(sections).forEach(function (key) {
      var s = sections[key];
      setText('eng-' + key + '-eyebrow', s.eyebrow);
      setText('eng-' + key + '-heading', s.heading);
    });

    var evo = sections.evolution || {};
    setHtml('eng-evolution-body', evo.body);
    renderEvolutionCards('eng-evolution-cards', evo.cards);
    setImg('eng-evolution-image', evo.image);

    var aero = sections.aerodynamics || {};
    setImg('eng-aerodynamics-image', aero.image);
    renderIconRows('eng-aerodynamics-rows', aero.rows);

    var cad = sections.cad || {};
    renderIconTextCards('eng-cad-cards', cad.cards);
    setText('eng-cad-materials-label', cad.materials_label);
    renderMaterials('eng-cad-materials', cad.materials);

    var physics = sections.physics || {};
    renderFormulaCards('eng-physics-cards', physics.cards);

    var manu = sections.manufacturing || {};
    renderIconRows('eng-manufacturing-rows', manu.rows);
    setImg('eng-manufacturing-image', manu.image);

    var track = sections.track_testing || {};
    renderIconTextCards('eng-track_testing-cards', track.cards);
  }

  function renderSponsorship(data) {
    if (!data) return;
    setText('spon-hero-eyebrow', data.hero_eyebrow);
    setText('spon-hero-tagline', data.hero_tagline);
    setText('spon-sponsors-eyebrow', data.sponsors_eyebrow);
    setText('spon-sponsors-heading', data.sponsors_heading);
    setText('spon-sponsors-text', data.sponsors_text);
    setText('spon-partner-eyebrow', data.partner_eyebrow);
    setText('spon-partner-heading', data.partner_heading);
    setText('spon-partner-text', data.partner_text);
  }

  function renderUpdates(data) {
    if (!data) return;
    setText('upd-hero-eyebrow', data.hero_eyebrow);
    setText('upd-hero-tagline', data.hero_tagline);
  }

  function renderPitWall(data) {
    if (!data) return;
    setText('pw-gallery-eyebrow', data.gallery_eyebrow);
    setText('pw-gallery-heading', data.gallery_heading);
    setHtml('pw-gallery-description', data.gallery_description);
  }

  function renderJoinTheGrid(data) {
    if (!data) return;
    setText('jtg-hero-eyebrow', data.hero_eyebrow);
    setHtml('jtg-hero-tagline', data.hero_tagline);
    setText('jtg-success-heading', data.success_heading);
    setText('jtg-success-text', data.success_text);
  }

  function renderContact(data) {
    if (!data) return;
    setText('con-hero-eyebrow', data.hero_eyebrow);
    setHtml('con-hero-tagline', data.hero_tagline);
    setText('con-quickchat-heading', data.quick_chat_heading);
    setHtml('con-quickchat-text', data.quick_chat_text);

    var email = document.getElementById('contact-email');
    if (email && data.email) email.textContent = data.email;

    var phones = document.getElementById('contact-phones');
    if (phones && Array.isArray(data.phones)) {
      phones.innerHTML = data.phones.map(function (p) {
        var tag = p.name ? ' <span class="text-[#636363]">— ' + p.name + '</span>' : '';
        return '<div class="flex items-center gap-3 text-[#727272]"><i data-lucide="phone" style="width:18px;height:18px;color:#e0d2b3;"></i> <span class="text-sm">' + p.number + tag + '</span></div>';
      }).join('');
    }
  }

  fetch('pages-content.json')
    .then(function (res) { return res.json(); })
    .then(function (content) {
      renderEngineering(content.engineering);
      renderSponsorship(content.sponsorship);
      renderUpdates(content.updates);
      renderPitWall(content.pitwall);
      renderJoinTheGrid(content.jointhegrid);
      renderContact(content.contact);
      if (window.lucide) lucide.createIcons();
    })
    .catch(function (err) { console.error('pages-content: failed to load', err); });
})();
