import { CelestialScene } from './celestial.js';
import { styles } from './style-data.js';
import { applySiteTheme, initialTheme } from './site-theme.js';

const themeButton = document.querySelector('.theme-toggle');
const motionButton = document.querySelector('.motion-toggle');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#mobile-nav');
let theme = initialTheme;
let scene;
try {
  scene = new CelestialScene(document.querySelector('.celestial-scene'));
} catch (error) {
  console.warn('Using the static background.', error);
  motionButton.hidden = true;
}

function syncTheme() {
  applySiteTheme(theme);
  themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
  themeButton.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  scene?.setTheme(theme);
}

let themeTransition;
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
themeButton.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  themeTransition?.skipTransition();
  if (document.startViewTransition && !reduceMotion.matches && document.visibilityState === 'visible') {
    const bounds = themeButton.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('native-theme-transition');
    const transition = document.startViewTransition(syncTheme);
    themeTransition = transition;
    transition.ready.then(() => root.animate([
      { clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
    ], { duration: 850, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)', fill: 'both' }).finished).catch(() => {});
    transition.finished.catch(() => {}).finally(() => {
      if (themeTransition === transition) {
        root.classList.remove('native-theme-transition');
        themeTransition = undefined;
      }
    });
  } else {
    syncTheme();
  }
  try { localStorage.setItem('vellire-theme', theme); } catch { /* Optional preference. */ }
});
syncTheme();

if (scene) {
  const syncMotion = () => {
    motionButton.setAttribute('aria-pressed', String(scene.stopped));
    motionButton.disabled = scene.reduced;
    motionButton.querySelector('span').textContent = scene.reduced ? 'Reduced motion' : scene.paused ? 'Play animation' : 'Pause animation';
    motionButton.querySelector('use').setAttribute('href', scene.stopped ? '#i-play' : '#i-pause');
  };
  scene.onStateChange = syncMotion;
  motionButton.addEventListener('click', () => { scene.toggle(); syncMotion(); });
  syncMotion();
}

function showMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
menuButton.addEventListener('click', () => showMenu(menu.hidden));
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => showMenu(false)));
const mobileLayout = matchMedia('(max-width: 760px)');
mobileLayout.addEventListener('change', event => { if (!event.matches) showMenu(false); });
document.addEventListener('pointerdown', event => {
  if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) showMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) {
    showMenu(false);
    menuButton.focus();
  }
});

const sample = document.querySelector('#sample');
const output = document.querySelector('#styled');
const styleButtons = [...document.querySelectorAll('[data-style]')];
const outputCopy = document.querySelector('[data-copy="styled"]');
const styleSelect = document.querySelector('#style-select');
const styleById = new Map(styles.map(([id, , , mapping]) => [id, mapping]));
const categories = new Map();
styleSelect.replaceChildren();
for (const [id, label, category] of styles) {
  if (!categories.has(category)) {
    const group = document.createElement('optgroup');
    group.label = category;
    categories.set(category, group);
    styleSelect.append(group);
  }
  categories.get(category).append(new Option(label, id));
}

function updatePreview() {
  const style = styleSelect.value;
  const mapping = styleById.get(style);
  output.textContent = Array.from(sample.value, character => mapping[character] ?? character).join('');
  outputCopy.disabled = !output.textContent;
  styleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.style === style)));
}

sample.addEventListener('input', updatePreview);
styleSelect.addEventListener('change', updatePreview);
styleButtons.forEach(button => button.addEventListener('click', () => {
  styleSelect.value = button.dataset.style;
  updatePreview();
}));
styleSelect.value = 'bold';
updatePreview();

const copyStatus = document.querySelector('#copy-status');
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const target = document.getElementById(button.dataset.copy);
  try {
    await navigator.clipboard.writeText(target.textContent);
    copyStatus.textContent = 'Copied to clipboard.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = 'Text selected. Use your copy shortcut.';
  }
}));
