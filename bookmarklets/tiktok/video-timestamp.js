(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  var url = window.location.href;
  var vidIdMatch = url.match(/\/(\d+)\/?(\?|$)/);

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
  titleEl.textContent = 'TIKTOK VIDEO TIMESTAMP';
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

  if (!vidIdMatch) {
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'No video ID found in URL. Make sure you are on a TikTok video page with a numeric ID.';
    body.appendChild(err);
  } else {
    var vidId = vidIdMatch[1];
    var asBinary = BigInt(vidId).toString(2);
    var first31Chars = asBinary.slice(0, 31);
    var timestamp = parseInt(first31Chars, 2);
    var date = new Date(timestamp * 1000);

    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var localOpts = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short'
    };
    var utcOpts = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'UTC'
    };

    var now = Date.now();
    var diffMs = now - date.getTime();
    var days = Math.floor(diffMs / 86400000);
    var hours = Math.floor(diffMs / 3600000);
    var mins = Math.floor(diffMs / 60000);
    var ago;
    if (days > 0) ago = days + 'd ago';
    else if (hours > 0) ago = hours + 'h ago';
    else ago = mins + 'm ago';

    body.appendChild(row('Video ID', vidId));
    body.appendChild(row('Age', ago));
    body.appendChild(row('Local (' + tz + ')', date.toLocaleString('en-US', localOpts)));
    body.appendChild(row('UTC', date.toLocaleString('en-US', utcOpts) + ' UTC'));
    body.appendChild(row('ISO', date.toISOString()));
    body.appendChild(row('Unix', timestamp.toString()));

    var note = document.createElement('div');
    note.style.cssText = 'padding:8px 0;color:#555;font-size:10px';
    note.textContent = 'Timestamp extracted from video ID using Bellingcat method (Snowflake ID bit shifting).';
    body.appendChild(note);
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
