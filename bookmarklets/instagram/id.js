(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  var html = document.body.innerHTML;
  var url = window.location.href;

  var username = null;
  var pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && pathParts[0] !== 'p' && pathParts[0] !== 'reel' &&
      pathParts[0] !== 'stories' && pathParts[0] !== 'explore') {
    username = pathParts[0];
  }

  var instagramId = null;
  var idMatch = html.match(/profilePage_(\d+)/);
  if (idMatch) instagramId = idMatch[1];
  if (!instagramId) {
    var idMatch2 = html.match(/"user_id":"(\d+)"/);
    if (idMatch2) instagramId = idMatch2[1];
  }
  if (!instagramId) {
    var idMatch3 = html.match(/"id":"(\d+)","username"/);
    if (idMatch3) instagramId = idMatch3[1];
  }

  var displayName = null;
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    var content = metaDesc.getAttribute('content');
    if (content) {
      var nameMatch = content.match(/ - (.*?) on Instagram/);
      if (nameMatch) {
        var userStr = nameMatch[1];
        var parts = userStr.match(/(.*?)\s*\(?@(.+?)\)?$/);
        if (parts) displayName = parts[1].trim();
      }
    }
  }

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
  titleEl.textContent = 'INSTAGRAM ID';
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

  function row(label, value) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:8px 0;border-bottom:1px solid #222';
    var lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.cssText = 'color:#777';
    var val = document.createElement('span');
    val.textContent = '  ' + value;
    val.style.cssText = 'color:#fff;font-weight:700';
    div.appendChild(lbl);
    div.appendChild(val);
    return div;
  }

  if (username) body.appendChild(row('Username', username));
  if (displayName) body.appendChild(row('Name', displayName));
  body.appendChild(row('ID', instagramId || 'Not found — try refreshing the page'));
  body.appendChild(row('URL', url));
  if (instagramId) {
    var uidRow = document.createElement('div');
    uidRow.style.cssText = 'padding:8px 0;word-break:break-all;border-bottom:1px solid #222';
    var uidLbl = document.createElement('span');
    uidLbl.textContent = 'UID URL';
    uidLbl.style.cssText = 'color:#777';
    var uidVal = document.createElement('span');
    uidVal.textContent = '  instagram.com/uid/' + instagramId;
    uidVal.style.cssText = 'color:#fff;font-weight:700';
    uidRow.appendChild(uidLbl);
    uidRow.appendChild(uidVal);
    body.appendChild(uidRow);
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
