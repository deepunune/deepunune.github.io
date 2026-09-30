/* Mobile navigation + graceful gallery placeholders. */
(function () {
  var btn = document.getElementById('navtoggle');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    var desktop = window.matchMedia('(min-width: 60rem)');
    function sync() {
      if (desktop.matches) { nav.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      else { nav.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    }
    sync();
    desktop.addEventListener('change', sync);
    btn.addEventListener('click', function () {
      var open = nav.hidden;
      nav.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  /* If a gallery photo has not been added yet, show a labelled placeholder
     instead of a broken image icon. Drop the named file into
     images/gallery/ and it appears automatically. */
  Array.prototype.forEach.call(document.querySelectorAll('.gallery img'), function (img) {
    img.addEventListener('error', function () {
      var ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = 'add images/gallery/' + (img.dataset.caption || 'photo.jpg');
      img.replaceWith(ph);
    });
  });
})();
