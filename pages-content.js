// Renders hero eyebrow/tagline (and a few section headings) on
// Engineering/Sponsorship/Updates/Gallery/Contact from pages-content.json.
// Same resilience pattern as site-chrome.js: only overwrites a container on
// fetch success, so today's hardcoded markup is the fallback if this fails.
(function () {
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function renderEngineering(data) {
    if (!data) return;
    setText('eng-hero-eyebrow', data.hero_eyebrow);
    setText('eng-hero-tagline', data.hero_tagline);
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
  }

  function renderContact(data) {
    if (!data) return;
    setText('con-hero-eyebrow', data.hero_eyebrow);
    setText('con-hero-tagline', data.hero_tagline);
    setText('con-quickchat-heading', data.quick_chat_heading);
    setText('con-quickchat-text', data.quick_chat_text);
  }

  fetch('pages-content.json')
    .then(function (res) { return res.json(); })
    .then(function (content) {
      renderEngineering(content.engineering);
      renderSponsorship(content.sponsorship);
      renderUpdates(content.updates);
      renderPitWall(content.pitwall);
      renderContact(content.contact);
    })
    .catch(function (err) { console.error('pages-content: failed to load', err); });
})();
