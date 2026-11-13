import { CelestialScene } from './celestial.js';
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

themeButton.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  syncTheme();
  try { localStorage.setItem('wellnile-theme', theme); } catch { /* Optional preference. */ }
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
const ranges = { bold: [0x1d400, 0x1d41a, 0x1d7ce], italic: [0x1d434, 0x1d44e], mono: [0x1d670, 0x1d68a, 0x1d7f6] };
const boldPunctuation = {
  '.': '．', '!': '！', '?': '？', ':': '：', ';': '；', ',': '❟',
  "'": '❜', '’': '❜', '‘': '❛', '"': '❞', '”': '❞', '“': '❝',
};
let style = 'bold';

function transform(char) {
  const range = ranges[style];
  if (!range) return char;
  if (style === 'italic' && char === 'h') return 'ℎ';
  if (char >= 'A' && char <= 'Z') return String.fromCodePoint(range[0] + char.charCodeAt(0) - 65);
  if (char >= 'a' && char <= 'z') return String.fromCodePoint(range[1] + char.charCodeAt(0) - 97);
  if (range[2] && char >= '0' && char <= '9') return String.fromCodePoint(range[2] + char.charCodeAt(0) - 48);
  return style === 'bold' ? boldPunctuation[char] ?? char : char;
}

function updatePreview() {
  output.textContent = Array.from(sample.value, transform).join('');
  outputCopy.disabled = !output.textContent;
}

sample.addEventListener('input', updatePreview);
styleButtons.forEach(button => button.addEventListener('click', () => {
  style = button.dataset.style;
  styleButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  updatePreview();
}));
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
