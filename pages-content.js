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

  function renderEngineering(data) {
    if (!data) return;
    setText('eng-hero-eyebrow', data.hero_eyebrow);
    setHtml('eng-hero-tagline', data.hero_tagline);
    var sections = data.sections || {};
    Object.keys(sections).forEach(function (key) {
      setText('eng-' + key + '-eyebrow', sections[key].eyebrow);
      setText('eng-' + key + '-heading', sections[key].heading);
    });
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
