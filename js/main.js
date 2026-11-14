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
const triggers = [...document.querySelectorAll('.wordmark, .site-header .nav a, .hero > a')];
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

// ---------- Scroll-built image ----------
// Progress 0..1 across the pinned section drives a cross-fade through the
// layers, the active caption and the progress line.
const build = document.querySelector('.build');
if (build) {
  const layers = [...build.querySelectorAll('.build-layer')];
  const captions = [...build.querySelectorAll('.build-caption')];
  const bar = build.querySelector('.build-progress span');
  const HOLD = 0.3; // share of each stage spent resting on a finished image
  let ticking = false;

  const renderBuild = () => {
    ticking = false;
    const travel = build.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -build.getBoundingClientRect().top / travel));
    const pos = p * (layers.length - 1);
    layers.forEach((layer, i) => {
      if (i === 0) return;
      const local = (pos - (i - 1) - HOLD / 2) / (1 - HOLD);
      layer.style.opacity = Math.min(1, Math.max(0, local));
    });
    const active = Math.round(pos);
    captions.forEach((c, i) => c.classList.toggle('is-active', i === active));
    bar.style.transform = `scaleX(${p})`;
  };
  const requestBuild = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(renderBuild); }
  };
  window.addEventListener('scroll', requestBuild, { passive: true });
  window.addEventListener('resize', requestBuild);
  renderBuild();
}

// ---------- Enquiry form (not connected to a backend yet) ----------
document.querySelector('.enquire').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('button').textContent = 'Form not connected yet';
});

document.getElementById('year').textContent = new Date().getFullYear();
