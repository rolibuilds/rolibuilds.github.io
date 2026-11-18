/* Runs in <head>, before first paint: marks JS as available and applies a saved
   manual theme choice. Without a saved choice, the system preference applies via CSS. */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  /* Arm the reveal system before first paint (no flash). If main.js never boots, disarm so content is never stuck hidden. */
  if ('IntersectionObserver' in window && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    root.classList.add('reveal-ready');
    setTimeout(function () { if (!root.hasAttribute('data-reveal-booted')) root.classList.remove('reveal-ready'); }, 3000);
  }
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* storage unavailable: fall back to system preference */ }
})();
