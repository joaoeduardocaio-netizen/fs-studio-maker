(() => {
  const section = document.getElementById('home-gallery');
  const track = document.getElementById('home-gallery-track');
  const picker = document.getElementById('language-select');
  if (!section || !track) return;

  const labels = {
    it: ['ALTRE CREAZIONI', 'Scopri le nostre creazioni'],
    pt: ['MAIS CRIAÇÕES', 'Conheça nossas criações'],
    en: ['MORE CREATIONS', 'Explore our creations'],
    es: ['MÁS CREACIONES', 'Descubre nuestras creaciones'],
    de: ['WEITERE KREATIONEN', 'Entdecke unsere Kreationen']
  };
  const language = () => picker?.value || localStorage.getItem('fs-language') || 'it';

  const items = [];
  let index = 0;
  let visible = false;
  let interacting = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function updateLanguage() {
    const lang = language();
    const [kicker, title] = labels[lang] || labels.it;
    document.getElementById('home-gallery-kicker').textContent = kicker;
    document.getElementById('home-gallery-title').textContent = title;
    section.setAttribute('aria-label', title);
    track.querySelectorAll('figure').forEach((card, i) => {
      const product = items[i].product;
      const name = product.translations?.[lang]?.title?.trim() || product.title;
      card.querySelector('figcaption').textContent = name;
      card.querySelector('img').alt = items[i].image.alt_text || name;
    });
  }

  function activeIndex() {
    const cards = [...track.children];
    return cards.reduce((best, card, i) => Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - track.scrollLeft) ? i : best, 0);
  }

  async function load() {
    let response;
    try {response=await fetch('https://fs-studio-maker.pages.dev/api/public/catalog',{cache:'no-store'});if(!response.ok)throw new Error('pending');}
    catch {response=await fetch('catalog-snapshot.json?v=20261021-leve');}
    if(!response.ok)return;
    const {products:data}=await response.json();
    for (const product of data || []) {
      for (const image of (product.creation_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))) {
        if (!image.storage_path || /\.(mp4|webm)(?:$|\?)/i.test(image.storage_path)) continue;
        items.push({ product, image });
        const card = document.createElement('figure');
        card.className = 'home-gallery-card';
        const photo = document.createElement('img');
        photo.src = image.storage_path;
        photo.loading = items.length <= 3 ? 'eager' : 'lazy';
        photo.decoding = 'async';
        const caption = document.createElement('figcaption');
        card.append(photo, caption);
        track.append(card);
      }
    }
    if (!items.length) return;
    updateLanguage();
    section.hidden = false;
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0.15 }).observe(section);
    // Navegação manual evita baixar toda a galeria automaticamente.

  }

  track.addEventListener('pointerenter', () => { interacting = true; });
  track.addEventListener('pointerleave', () => { interacting = false; });
  track.addEventListener('focusin', () => { interacting = true; });
  track.addEventListener('focusout', () => { interacting = false; });
  track.addEventListener('touchstart', () => { interacting = true; }, { passive: true });
  track.addEventListener('touchend', () => { window.setTimeout(() => { interacting = false; }, 5500); }, { passive: true });
  picker?.addEventListener('change', updateLanguage);
  load().catch(error => console.warn('Não foi possível carregar a galeria:', error));
})();

