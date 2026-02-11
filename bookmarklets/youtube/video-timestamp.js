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
    return body;
  }

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

  if (window.location.hostname.indexOf('youtube.com') === -1) {
    var body = makeWin('YOUTUBE TIMESTAMP');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'This bookmarklet must be run on youtube.com';
    body.appendChild(err);
    return;
  }

  var html = document.documentElement.innerHTML;

  var videoId = null;
  var params = new URLSearchParams(window.location.search);
  videoId = params.get('v');

  if (!videoId) {
    var shortMatch = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) videoId = shortMatch[1];
  }

  if (!videoId) {
    var liveMatch = window.location.pathname.match(/\/live\/([a-zA-Z0-9_-]+)/);
    if (liveMatch) videoId = liveMatch[1];
  }

  var uploadDate = null;
  var publishDate = null;

  var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (var i = 0; i < ldScripts.length; i++) {
    try {
      var ld = JSON.parse(ldScripts[i].textContent);
      if (ld.uploadDate) uploadDate = ld.uploadDate;
      if (ld.datePublished) publishDate = ld.datePublished;
    } catch(e) {}
  }

  if (!uploadDate) {
    var m = html.match(/"uploadDate":"([^"]+)"/);
    if (m) uploadDate = m[1];
  }

  if (!publishDate) {
    var m2 = html.match(/"publishDate":"([^"]+)"/);
    if (m2) publishDate = m2[1];
  }

  var dateText = null;
  var dtMatch = html.match(/"dateText":\{"simpleText":"([^"]+)"\}/);
  if (dtMatch) dateText = dtMatch[1];

  var title = null;
  var titleMatch = html.match(/"title":\{"text":"((?:[^"\\]|\\.)*)"\}/);
  if (titleMatch) {
    try { title = JSON.parse('"' + titleMatch[1] + '"'); } catch(e) {}
  }
  if (!title) {
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) title = ogTitle.content;
  }

  var channelName = null;
  var cnMatch = html.match(/"ownerChannelName":"([^"]+)"/);
  if (cnMatch) channelName = cnMatch[1];

  if (!videoId) {
    var body = makeWin('YOUTUBE TIMESTAMP');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'No video found. Open a YouTube video, short, or live stream.';
    body.appendChild(err);
    return;
  }

  var dateStr = uploadDate || publishDate;

  if (!dateStr) {
    var body = makeWin('YOUTUBE TIMESTAMP');
    body.appendChild(row('Video ID', videoId));
    if (title) body.appendChild(row('Title', title));
    if (channelName) body.appendChild(row('Channel', channelName));
    if (dateText) body.appendChild(row('Date (display)', dateText));
    var note = document.createElement('div');
    note.style.cssText = 'padding:8px 0;color:#777;font-size:11px';
    note.textContent = 'No precise timestamp found in page data. The display date above may be approximate.';
    body.appendChild(note);
    return;
  }

  var date = new Date(dateStr);
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var diffMs = Date.now() - date.getTime();
  var days = Math.floor(diffMs / 86400000);
  var hours = Math.floor(diffMs / 3600000);
  var mins = Math.floor(diffMs / 60000);
  var ago;
  if (days > 0) ago = days + 'd ago';
  else if (hours > 0) ago = hours + 'h ago';
  else ago = mins + 'm ago';

  var body = makeWin('YOUTUBE TIMESTAMP');

  body.appendChild(row('Video ID', videoId));
  if (title) body.appendChild(row('Title', title));
  if (channelName) body.appendChild(row('Channel', channelName));
  body.appendChild(row('Age', ago));
  body.appendChild(row('Local (' + tz + ')', date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short'
  })));
  body.appendChild(row('UTC', date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC'));
  body.appendChild(row('ISO', date.toISOString()));
  body.appendChild(row('Unix', Math.floor(date.getTime() / 1000).toString()));
  if (dateText) body.appendChild(row('Display Date', dateText));

})();
