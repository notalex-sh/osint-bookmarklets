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
    div.style.cssText = 'padding:8px 0;border-bottom:1px solid #222;word-break:break-all';
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
    var body = makeWin('YOUTUBE ID');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'This bookmarklet must be run on youtube.com';
    body.appendChild(err);
    return;
  }

  var html = document.documentElement.innerHTML;

  var channelId = null;
  var channelName = null;
  var subscriberCount = null;
  var joinedDate = null;
  var description = null;

  var canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    var cMatch = canonicalEl.href.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (cMatch) channelId = cMatch[1];
  }

  if (!channelId) {
    var pathMatch = window.location.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (pathMatch) channelId = pathMatch[1];
  }

  if (!channelId) {
    var m = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
    if (m) channelId = m[1];
  }

  if (!channelId) {
    var m2 = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);
    if (m2) channelId = m2[1];
  }

  var nameMatch = html.match(/"author":"([^"]+)"/) ||
                  html.match(/"ownerChannelName":"([^"]+)"/);
  if (nameMatch) channelName = nameMatch[1];

  if (!channelName) {
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) channelName = ogTitle.content;
  }

  var subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/);
  if (subMatch) subscriberCount = subMatch[1];

  var joinMatch = html.match(/"joinedDateText":\{"simpleText":"Joined ([^"]+)"\}/);
  if (joinMatch) joinedDate = joinMatch[1];

  var descMatch = html.match(/"description":"((?:[^"\\]|\\.)*)"/);
  if (descMatch) {
    try { description = JSON.parse('"' + descMatch[1] + '"'); } catch(e) {}
  }

  var vanity = null;
  var vanityMatch = window.location.pathname.match(/^\/@([^/]+)/) ||
                    window.location.pathname.match(/\/c\/([^/]+)/);
  if (vanityMatch) vanity = vanityMatch[1];
  if (!vanity) {
    var vMatch = html.match(/"vanityChannelUrl":"https?:\/\/www\.youtube\.com\/@([^"]+)"/);
    if (vMatch) vanity = vMatch[1];
  }

  if (!channelId) {
    var body = makeWin('YOUTUBE ID');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'No channel ID found. Make sure you are on a YouTube channel or video page.';
    body.appendChild(err);
    return;
  }

  var body = makeWin('YOUTUBE ID');

  if (channelName) body.appendChild(row('Channel Name', channelName));
  if (vanity) body.appendChild(row('Handle', '@' + vanity));
  body.appendChild(row('Channel ID', channelId));
  body.appendChild(row('Channel URL', 'https://www.youtube.com/channel/' + channelId));
  if (subscriberCount) body.appendChild(row('Subscribers', subscriberCount));
  if (joinedDate) body.appendChild(row('Joined', joinedDate));
  if (description) {
    var short = description.length > 200 ? description.substring(0, 200) + '...' : description;
    body.appendChild(row('Description', short));
  }
  body.appendChild(row('Page URL', window.location.href));

})();
