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

  function sectionHeader(text) {
    var el = document.createElement('div');
    el.style.cssText = 'padding:12px 0 4px 0;color:#777;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #222';
    el.textContent = text;
    return el;
  }

  function showTimestamps(body, creationUs, modificationUs) {
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

    var createdMs = parseInt(creationUs, 10) / 1000;
    var created = new Date(createdMs);

    var diffMs = Date.now() - created.getTime();
    var days = Math.floor(diffMs / 86400000);
    var hours = Math.floor(diffMs / 3600000);
    var mins = Math.floor(diffMs / 60000);
    var ago;
    if (days > 0) ago = days + 'd ago';
    else if (hours > 0) ago = hours + 'h ago';
    else ago = mins + 'm ago';

    body.appendChild(sectionHeader('Created'));
    body.appendChild(row('Age', ago));
    body.appendChild(row('Local (' + tz + ')', created.toLocaleString('en-US', localOpts)));
    body.appendChild(row('UTC', created.toLocaleString('en-US', utcOpts) + ' UTC'));
    body.appendChild(row('ISO', created.toISOString()));
    body.appendChild(row('Unix', Math.floor(created.getTime() / 1000).toString()));

    if (modificationUs && modificationUs !== creationUs) {
      var modMs = parseInt(modificationUs, 10) / 1000;
      var modified = new Date(modMs);

      body.appendChild(sectionHeader('Modified'));
      body.appendChild(row('Local (' + tz + ')', modified.toLocaleString('en-US', localOpts)));
      body.appendChild(row('UTC', modified.toLocaleString('en-US', utcOpts) + ' UTC'));
      body.appendChild(row('ISO', modified.toISOString()));
    }
  }

  if (window.location.hostname.indexOf('google.com') === -1) {
    var body = makeWin('REVIEW TIMESTAMP');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'This bookmarklet must be run on google.com/maps';
    body.appendChild(err);
    return;
  }

  function tryAppState() {
    try {
      if (typeof APP_INITIALIZATION_STATE !== 'undefined') {
        var dataStr = JSON.stringify(APP_INITIALIZATION_STATE);
        var pattern = /(\d{16})(?:,(\d{16}))?(?:,\[null,null,\[\\?"https:)/;
        var match = dataStr.match(pattern);
        if (match && match[1]) {
          return { creation: match[1], modification: match[2] || match[1] };
        }
      }
    } catch(e) {}
    return null;
  }

  function tryApiFallback(onSuccess, onError) {
    try {
      var url = window.location.href;
      var contributorMatch = url.match(/contrib\/(\d+)/);
      if (!contributorMatch) { onError('Could not extract contributor ID from URL.'); return; }
      var contributorId = contributorMatch[1];

      var placeMatch = url.match(/place\/(ChI[a-zA-Z0-9_-]+)/);
      if (!placeMatch) { onError('Could not extract place ID from URL.'); return; }
      var placeId = placeMatch[1];

      var reviewId = null;
      try {
        if (typeof APP_INITIALIZATION_STATE !== 'undefined') {
          var dataStr = JSON.stringify(APP_INITIALIZATION_STATE);
          var reviewIdMatch = dataStr.match(/"([a-zA-Z0-9_-]{40,})"/);
          if (reviewIdMatch) reviewId = reviewIdMatch[1];
        }
      } catch(e) {}

      if (!reviewId) { onError('Could not extract review ID. Make sure you have a review open.'); return; }

      var apiUrl = 'https://www.google.com/maps/timeline/_rpc/pc?authuser=0&hl=en&gl=us&pb=' +
        '!1s' + contributorId + '!2s' + placeId +
        '!3m2!1s' + reviewId + '!7e81!5m3!1b1!9m1!1e3' +
        '!6m55!1m48!1m4!1m3!1e3!1e2!1e4!3m5!2m4!3m3!1m2!1i260!2i365' +
        '!4m1!3i20!10b1!11m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2' +
        '!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3' +
        '!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2' +
        '!2b1!2m5!1e1!1e4!1e3!1e5!1e2!7m0';

      fetch(apiUrl)
        .then(function(res) { return res.text(); })
        .then(function(text) {
          var tsPattern = /,null,(\d{16}),(\d{16}),\[null,null,\["https:/;
          var match = text.match(tsPattern);
          if (!match) { onError('Could not find timestamps in API response.'); return; }
          onSuccess(match[1], match[2]);
        })
        .catch(function(e) { onError('API request failed: ' + e.message); });
    } catch(e) {
      onError('Error: ' + e.message);
    }
  }

  var body = makeWin('REVIEW TIMESTAMP');
  var statusEl = document.createElement('div');
  statusEl.style.cssText = 'padding:8px 0;color:#777';
  statusEl.textContent = 'Extracting review timestamp...';
  body.appendChild(statusEl);

  var result = tryAppState();
  if (result) {
    statusEl.remove();
    showTimestamps(body, result.creation, result.modification);
  } else {
    statusEl.textContent = 'Trying API fallback...';
    tryApiFallback(
      function(creation, modification) {
        statusEl.remove();
        showTimestamps(body, creation, modification);
      },
      function(errMsg) {
        statusEl.textContent = errMsg;
        statusEl.style.color = '#fff';
      }
    );
  }

})();
