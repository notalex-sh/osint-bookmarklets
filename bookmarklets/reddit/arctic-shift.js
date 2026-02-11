(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  function makeWin(title) {
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
    titleEl.textContent = title;
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
    return { win: win, body: body };
  }

  var hostname = window.location.hostname;
  if (hostname.indexOf('reddit.com') === -1) {
    var w = makeWin('ARCTIC SHIFT');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'This bookmarklet must be run on reddit.com';
    w.body.appendChild(err);
    return;
  }

  var pathParts = window.location.pathname.split('/').filter(Boolean);
  var username = null;
  for (var i = 0; i < pathParts.length; i++) {
    if ((pathParts[i] === 'user' || pathParts[i] === 'u') && pathParts[i + 1]) {
      username = pathParts[i + 1];
      break;
    }
  }

  if (!username) {
    var w = makeWin('ARCTIC SHIFT');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'Navigate to a Reddit user profile first (/user/username or /u/username).';
    w.body.appendChild(err);
    return;
  }

  var url = 'https://arctic-shift.photon-reddit.com/search?fun=posts_search&author=' +
    encodeURIComponent(username) + '&limit=100&sort=desc';

  var w = makeWin('ARCTIC SHIFT');

  var userRow = document.createElement('div');
  userRow.style.cssText = 'padding:8px 0;border-bottom:1px solid #222';
  var lbl = document.createElement('span');
  lbl.textContent = 'User';
  lbl.style.cssText = 'color:#777';
  var val = document.createElement('span');
  val.textContent = '  u/' + username;
  val.style.cssText = 'color:#fff;font-weight:700';
  userRow.appendChild(lbl);
  userRow.appendChild(val);
  w.body.appendChild(userRow);

  var urlRow = document.createElement('div');
  urlRow.style.cssText = 'padding:8px 0;word-break:break-all;color:#777;font-size:11px';
  urlRow.textContent = url;
  w.body.appendChild(urlRow);

  var actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;padding:12px;border-top:1px solid #222';

  var openBtn = document.createElement('button');
  openBtn.textContent = 'Open Arctic Shift';
  openBtn.style.cssText = 'flex:1;background:#fff;color:#000;border:none;padding:6px 0;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer';
  openBtn.onmouseover = function() { openBtn.style.opacity = '0.7'; };
  openBtn.onmouseout = function() { openBtn.style.opacity = '1'; };
  openBtn.onclick = function() { window.open(url, '_blank'); };
  actions.appendChild(openBtn);

  w.win.appendChild(actions);

})();
