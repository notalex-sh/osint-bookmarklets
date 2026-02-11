(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  var pageSource = document.documentElement.outerHTML;

  function decodeUnicode(str) {
    return str.replace(/\\u[\dA-Fa-f]{4}/g, function(match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/, ''), 16));
    });
  }

  function extractValues(regex, source) {
    var matches = [];
    var match;
    while ((match = regex.exec(source)) !== null) {
      matches.push(decodeUnicode(match[1]));
    }
    return matches;
  }

  var displayNames = extractValues(/"full_name":"([^"]+)"/g, pageSource);
  var threadsIds = extractValues(/"pk":"(\d+)"/g, pageSource);
  var bios = extractValues(/"biography":"([^"]+)"/g, pageSource);
  var users = extractValues(/"username":"([^"]+)"/g, pageSource);

  var username = users[1] || null;
  var displayName = displayNames[0] || null;
  var threadsId = threadsIds[0] || null;

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
  titleEl.textContent = 'THREADS ID';
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

  body.appendChild(row('Username', username || 'Not found \u2014 try refreshing the page'));
  if (displayName) body.appendChild(row('Display Name', displayName));
  body.appendChild(row('Threads ID', threadsId || 'Not found \u2014 try refreshing the page'));
  body.appendChild(row('URL', window.location.href));

  if (bios.length > 0) {
    for (var i = 0; i < bios.length; i++) {
      var bioDiv = document.createElement('div');
      bioDiv.style.cssText = 'padding:8px 0;border-bottom:1px solid #222;word-break:break-word';
      var bioLbl = document.createElement('span');
      bioLbl.textContent = 'Bio';
      bioLbl.style.cssText = 'color:#777';
      var bioVal = document.createElement('span');
      bioVal.textContent = '  ' + bios[i].replace(/\\n/g, ' ');
      bioVal.style.cssText = 'color:#fff;font-weight:700';
      bioDiv.appendChild(bioLbl);
      bioDiv.appendChild(bioVal);
      body.appendChild(bioDiv);
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
