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
const slides = [...document.querySelectorAll('.hero .slide')];
const SLIDE_MS = 5500;
if (slides.length > 1) {
  let current = 0;
  setInterval(() => {
    if (document.hidden) return;
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, SLIDE_MS);
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

// ---------- Enquiry form (not connected to a backend yet) ----------
document.querySelector('.enquire').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('button').textContent = 'Form not connected yet';
});

document.getElementById('year').textContent = new Date().getFullYear();
