(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  var images = document.images;
  var srcs = [];
  for (var i = 0; i < images.length; i++) {
    var src = images[i].src;
    if (src && srcs.indexOf(src) === -1) srcs.push(src);
  }

  var bgImages = [];
  var allEls = document.querySelectorAll('*');
  for (var j = 0; j < allEls.length; j++) {
    var bg = getComputedStyle(allEls[j]).backgroundImage;
    if (bg && bg !== 'none') {
      var match = bg.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/i);
      if (match && srcs.indexOf(match[1]) === -1 && bgImages.indexOf(match[1]) === -1) {
        bgImages.push(match[1]);
      }
    }
  }

  var allSrcs = srcs.concat(bgImages);

  var win = document.createElement('div');
  win.id = '_osint_win';
  win.style.cssText = [
    'position:fixed',
    'top:48px',
    'right:48px',
    'width:420px',
    'max-height:70vh',
    'background:#0a0a0a',
    'border:1px solid #222',
    'color:#eee',
    'font-family:"SF Mono","Cascadia Mono","Fira Mono",Consolas,monospace',
    'font-size:12px',
    'z-index:2147483647',
    'display:flex',
    'flex-direction:column',
    'box-shadow:0 0 0 1px #000'
  ].join(';');

  var bar = document.createElement('div');
  bar.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'padding:8px 12px',
    'background:#000',
    'border-bottom:1px solid #222',
    'cursor:grab',
    'user-select:none',
    '-webkit-user-select:none'
  ].join(';');

  var titleEl = document.createElement('span');
  titleEl.textContent = 'ALL IMAGES (' + allSrcs.length + ')';
  titleEl.style.cssText = 'font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#777';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00d7';
  closeBtn.style.cssText = 'background:none;border:none;color:#777;font-size:18px;cursor:pointer;padding:0;line-height:1;font-family:inherit';
  closeBtn.onmouseover = function() { closeBtn.style.color = '#fff'; };
  closeBtn.onmouseout = function() { closeBtn.style.color = '#777'; };
  closeBtn.onclick = function() { win.remove(); };

  bar.appendChild(titleEl);
  bar.appendChild(closeBtn);

  var body = document.createElement('div');
  body.style.cssText = 'overflow-y:auto;padding:12px';

  if (allSrcs.length === 0) {
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'No images found on this page.';
    body.appendChild(err);
  } else {
    for (var k = 0; k < allSrcs.length; k++) {
      var item = document.createElement('div');
      item.style.cssText = 'padding:8px 0;border-bottom:1px solid #222';

      var thumb = document.createElement('img');
      thumb.src = allSrcs[k];
      thumb.style.cssText = 'max-width:100%;max-height:120px;display:block;margin-bottom:4px;background:#111';

      var urlText = document.createElement('div');
      urlText.style.cssText = 'color:#777;font-size:10px;word-break:break-all;cursor:pointer';
      urlText.textContent = allSrcs[k];
      urlText.title = 'Click to open in new tab';
      (function(src) {
        urlText.onclick = function() { window.open(src, '_blank'); };
      })(allSrcs[k]);

      item.appendChild(thumb);
      item.appendChild(urlText);
      body.appendChild(item);
    }
  }

  win.appendChild(bar);
  win.appendChild(body);

  var dx = 0, dy = 0, sx = 0, sy = 0;
  bar.onmousedown = function(e) {
    e.preventDefault();
    sx = e.clientX;
    sy = e.clientY;
    bar.style.cursor = 'grabbing';
    document.onmousemove = function(e) {
      dx = sx - e.clientX;
      dy = sy - e.clientY;
      sx = e.clientX;
      sy = e.clientY;
      win.style.top = (win.offsetTop - dy) + 'px';
      win.style.left = (win.offsetLeft - dx) + 'px';
      win.style.right = 'auto';
    };
    document.onmouseup = function() {
      document.onmousemove = null;
      document.onmouseup = null;
      bar.style.cursor = 'grab';
    };
  };

  document.body.appendChild(win);

})();
