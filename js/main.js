// ---------- Stacking steps ----------
// Each .step is position: sticky and docks one row below the previous one.
// Sticky boxes are released when their margin box reaches the end of their
// container, so we give every step a bottom margin (cancelled by a negative
// top margin on the next step) that makes all of them release at the same
// moment. The finished stack then scrolls away as a single block.
const stackQuery = window.matchMedia('(max-width: 991px), (max-height: 640px)');

function layoutStacks() {
  document.querySelectorAll('.process').forEach((section) => {
    const steps = [...section.querySelectorAll('.step')];
    const intro = section.querySelector('.process-intro');
    steps.forEach((s) => { s.style.marginTop = ''; s.style.marginBottom = ''; });
    intro.style.marginBottom = '';
    if (stackQuery.matches || !steps.length) return;

    const row = parseFloat(getComputedStyle(section).getPropertyValue('--row'));
    const last = steps.length - 1;
    const lastH = steps[last].offsetHeight;
    let carry = 0;
    steps.forEach((s, i) => {
      const mb = (last - i) * row + lastH - s.offsetHeight;
      s.style.marginTop = `${-carry}px`;
      s.style.marginBottom = `${mb}px`;
      carry = mb;
    });
    // Keep the intro pinned for as long as the stack is.
    const stackH = last * row + lastH;
    intro.style.marginBottom = `${Math.max(0, stackH - intro.offsetHeight)}px`;
  });
}

layoutStacks();
window.addEventListener('resize', layoutStacks);
window.addEventListener('load', layoutStacks);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutStacks);

// ---------- Mobile menu ----------
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('mobile-menu');

function setMenu(open) {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  document.body.classList.toggle('menu-open', open);
}
toggle.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
stackQuery.addEventListener('change', () => setMenu(false));

// ---------- Hero slideshow ----------
// The image changes on three things only:
//   1. the pointer lands on (or a click hits) the studio name,
//   2. the pointer moves onto a different menu item or hero category,
//   3. the visitor starts scrolling down from the top of the page.
// Touch screens have no pointer, so there the images also change on a timer.
const slides = [...document.querySelectorAll('.hero .slide')];
const heroEl = document.querySelector('.hero');
const TOUCH_MS = 5500;
let current = 0;

function nextSlide() {
  if (slides.length < 2) return;
  slides[current].classList.remove('is-active');
  current = (current + 1) % slides.length;
  slides[current].classList.add('is-active');
}
const heroInView = () => window.scrollY < heroEl.offsetHeight;

// 1 + 2: studio name, menu items, hero categories
const triggers = [...document.querySelectorAll('.wordmark, .site-header .nav a, .hero-link')];
let lastTrigger = null;
triggers.forEach((el) => {
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || el === lastTrigger || !heroInView()) return;
    lastTrigger = el;
    nextSlide();
  });
});
document.querySelector('.wordmark').addEventListener('click', () => {
  if (heroInView()) nextSlide();
});

// 3: one change when scrolling down from the top; re-armed back at the top
let scrollArmed = window.scrollY <= 8;
window.addEventListener('scroll', () => {
  if (scrollArmed && window.scrollY > 8) { scrollArmed = false; nextSlide(); }
  else if (window.scrollY <= 8) scrollArmed = true;
}, { passive: true });

if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  setInterval(() => { if (!document.hidden && heroInView()) nextSlide(); }, TOUCH_MS);
}

// Header is clear while it sits over the hero, solid afterwards
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
function updateHeader() {
  header.classList.toggle('over-hero', window.scrollY < hero.offsetHeight - header.offsetHeight);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);

// ---------- Scroll-built room ----------
// Progress 0..1 across the pinned section drives the reveal of each layer
// over the one before it, the active caption, the progress line and the
// leader line that points from the caption card to the relevant part.
const build = document.querySelector('.build');
if (build) {
  const pin = build.querySelector('.build-pin');
  const layers = [...build.querySelectorAll('.build-layer')];
  const captions = [...build.querySelectorAll('.build-caption')];
  const bar = build.querySelector('.build-progress span');
  const card = build.querySelector('.build-card');
  const leader = build.querySelector('.build-leader');
  const line = leader.querySelector('line');
  const dot = leader.querySelector('circle');
  const HOLD = 0.3; // share of each stage spent resting on a finished image
  let ticking = false;
  let shown = -1;

  const box = build.querySelector('.build-layers');

  // Where a point of the photo lands inside the pinned area
  const targetPoint = (caption) => {
    const p = pin.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    return {
      x: r.left - p.left + parseFloat(caption.dataset.x) * r.width,
      y: r.top - p.top + parseFloat(caption.dataset.y) * r.height,
    };
  };

  const drawLeader = (index, animate) => {
    const t = targetPoint(captions[index]);
    const p = pin.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const left = c.left - p.left;
    const right = c.right - p.left;
    const top = c.top - p.top;
    let x1;
    let y1;
    if (t.x > right) {
      // Caption beside the image: start at the caption's title
      x1 = right; y1 = top + 44;
    } else {
      // Caption below the image: start from its top edge
      x1 = Math.min(right, Math.max(left + 24, t.x)); y1 = top - 6;
    }
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', t.x); line.setAttribute('y2', t.y);
    dot.setAttribute('cx', t.x); dot.setAttribute('cy', t.y);
    if (animate) {
      leader.classList.remove('is-drawn');
      void leader.getBoundingClientRect(); // restart the draw animation
    }
    leader.classList.add('is-drawn');
  };

  const renderBuild = () => {
    ticking = false;
    const travel = build.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -build.getBoundingClientRect().top / travel));
    const pos = p * (layers.length - 1);
    layers.forEach((layer, i) => {
      if (i === 0) return;
      const local = (pos - (i - 1) - HOLD / 2) / (1 - HOLD);
      layer.style.setProperty('--r', Math.min(1, Math.max(0, local)).toFixed(4));
    });
    const active = Math.round(pos);
    if (active !== shown) {
      captions.forEach((c, i) => c.classList.toggle('is-active', i === active));
      drawLeader(active, true);
      shown = active;
    }
    bar.style.transform = `scaleX(${p})`;
  };
  const requestBuild = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(renderBuild); }
  };
  window.addEventListener('scroll', requestBuild, { passive: true });
  window.addEventListener('resize', () => { if (shown >= 0) drawLeader(shown, false); requestBuild(); });
  layers[0].addEventListener('load', () => { if (shown >= 0) drawLeader(shown, false); });
  renderBuild();
}

// ---------- Full portfolio (folder view) ----------
// Opened by anything marked data-gallery (the menu link and the More button).
// First level: the category folders. Second level: the images of one category.
const gallery = document.getElementById('gallery');
if (gallery) {
  const title = gallery.querySelector('.gallery-title');
  const folders = gallery.querySelector('.gallery-folders');
  const sets = [...gallery.querySelectorAll('.gallery-set')];
  const back = gallery.querySelector('.gallery-back');
  const close = gallery.querySelector('.gallery-close');
  let opener = null;

  const showFolders = () => {
    sets.forEach((s) => { s.hidden = true; });
    folders.hidden = false;
    back.hidden = true;
    title.textContent = 'Portfolio';
    gallery.scrollTop = 0;
  };
  const showSet = (name) => {
    const set = sets.find((s) => s.dataset.set === name);
    if (!set) return;
    folders.hidden = true;
    sets.forEach((s) => { s.hidden = s !== set; });
    back.hidden = false;
    title.textContent = set.dataset.name;
    gallery.scrollTop = 0;
  };
  const openGallery = (from) => {
    opener = from || null;
    if (typeof setMenu === 'function') setMenu(false);
    showFolders();
    gallery.hidden = false;
    document.body.style.overflow = 'hidden';
    close.focus();
  };
  const closeGallery = () => {
    gallery.hidden = true;
    document.body.style.overflow = '';
    if (opener) opener.focus();
  };

  document.querySelectorAll('[data-gallery]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); openGallery(el); });
  });
  folders.addEventListener('click', (e) => {
    const folder = e.target.closest('.folder');
    if (folder) showSet(folder.dataset.open);
  });
  back.addEventListener('click', showFolders);
  close.addEventListener('click', closeGallery);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || gallery.hidden) return;
    if (back.hidden) closeGallery(); else showFolders();
  });
}

// ---------- Enquiry form (not connected to a backend yet) ----------
document.querySelector('.enquire').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('button').textContent = 'Form not connected yet';
});

document.getElementById('year').textContent = new Date().getFullYear();
