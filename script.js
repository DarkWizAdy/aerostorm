const defaultConfig = {
  team_name: 'AEROSTORM racing',
  hero_tagline: 'Engineering the future of motorsport through science, technology, and relentless innovation.',
  about_heading: 'Built on Science. Driven by Speed.',
  about_text: "We're a student-led F1 STEM racing team that merges engineering precision with competitive motorsport. Every component of our car is designed, tested, and refined through rigorous scientific methodology — from aerodynamic simulations to telemetry-driven performance tuning.",
  background_color: '#000000',
  surface_color: '#111111',
  text_color: '#e8e8e8',
  accent_color: '#e0d2b3',
  muted_color: '#636363',
  font_family: 'Outfit',
  font_size: 16
};

function applyConfig(config) {
  const c = { ...defaultConfig, ...config };
  
  // Update Nav Team Name while preserving image if it exists
  const navTeamName = document.getElementById('nav-team-name');
  if (navTeamName) {
    const parts = c.team_name.split(' ');
    const lastWord = parts.pop();
    const firstPart = parts.join(' ');
    
    const logoImg = navTeamName.querySelector('img');
    const racingSpan = navTeamName.querySelector('.font-racing');
    
    if (logoImg && racingSpan) {
      racingSpan.textContent = lastWord;
      // If we wanted to update the logo alt text, we could, but let's keep it simple
    } else {
      navTeamName.textContent = c.team_name;
    }
  }

  // Update Hero Title while preserving image and font-racing styling
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    const parts = c.team_name.split(' ');
    const lastWord = parts.pop();
    const firstPart = parts.join(' ');
    
    const logoImg = heroTitle.querySelector('img');
    const racingSpan = heroTitle.querySelector('.font-racing');
    
    if (logoImg && racingSpan) {
      racingSpan.textContent = lastWord;
    } else {
      heroTitle.innerHTML = firstPart + '<br>' + lastWord;
    }
  }

  document.getElementById('hero-tagline').textContent = c.hero_tagline;
  document.getElementById('about-heading').innerHTML = c.about_heading.replace('.', '.<br>');
  document.getElementById('about-text').textContent = c.about_text;
  document.body.style.backgroundColor = c.background_color;
  document.body.style.color = c.text_color;
  const fontStack = `${c.font_family}, sans-serif`;
  document.body.style.fontFamily = fontStack;
}

if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange: async (config) => { applyConfig(config); },
    mapToCapabilities: (config) => ({
      recolorables: [
        { get: () => config.background_color || defaultConfig.background_color, set: (v) => { config.background_color = v; window.elementSdk.setConfig({ background_color: v }); } },
        { get: () => config.accent_color || defaultConfig.accent_color, set: (v) => { config.accent_color = v; window.elementSdk.setConfig({ accent_color: v }); } },
        { get: () => config.text_color || defaultConfig.text_color, set: (v) => { config.text_color = v; window.elementSdk.setConfig({ text_color: v }); } },
      ],
      borderables: [],
      fontEditable: {
        get: () => config.font_family || defaultConfig.font_family,
        set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); }
      },
      fontSizeable: {
        get: () => config.font_size || defaultConfig.font_size,
        set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); }
      }
    }),
    mapToEditPanelValues: (config) => new Map([
      ['team_name', config.team_name || defaultConfig.team_name],
      ['hero_tagline', config.hero_tagline || defaultConfig.hero_tagline],
      ['about_heading', config.about_heading || defaultConfig.about_heading],
      ['about_text', config.about_text || defaultConfig.about_text],
    ])
  });
}

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});

function handleForm(formId, successId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const successEl = document.getElementById(successId);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:14px;height:14px;"></i> Sending...';
    lucide.createIcons(); // To show the loader
    
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        successEl.textContent = '✓ Message sent successfully';
        successEl.classList.remove('hidden');
        form.reset();
      } else {
        successEl.textContent = '✗ Failed to send. Please try again.';
        successEl.classList.remove('hidden');
      }
    } catch (error) {
      successEl.textContent = '✗ Error. Please try again.';
      successEl.classList.remove('hidden');
    }
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    lucide.createIcons();
    setTimeout(() => successEl.classList.add('hidden'), 5000);
  });
}

handleForm('sponsor-form', 'sponsor-success');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-section').forEach(s => observer.observe(s));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('mobile-menu').classList.add('hidden');
    }
  });
});

lucide.createIcons();
