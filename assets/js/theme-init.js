/* Runs in <head>, before first paint: marks JS as available and applies a saved
   manual theme choice. Without a saved choice, the system preference applies via CSS. */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* storage unavailable: fall back to system preference */ }
})();
