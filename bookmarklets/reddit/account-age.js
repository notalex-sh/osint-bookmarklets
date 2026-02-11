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

  var hostname = window.location.hostname;
  if (hostname.indexOf('reddit.com') === -1) {
    var body = makeWin('REDDIT ACCOUNT');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'This bookmarklet must be run on reddit.com';
    body.appendChild(err);
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
    var body = makeWin('REDDIT ACCOUNT');
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'Navigate to a Reddit user profile first (/user/username or /u/username).';
    body.appendChild(err);
    return;
  }

  var body = makeWin('REDDIT ACCOUNT');
  var statusEl = document.createElement('div');
  statusEl.style.cssText = 'padding:8px 0;color:#777';
  statusEl.textContent = 'Fetching account data for u/' + username + '...';
  body.appendChild(statusEl);

  fetch('https://www.reddit.com/user/' + encodeURIComponent(username) + '/about.json', {
    headers: { 'Accept': 'application/json' }
  })
  .then(function(res) {
    if (res.status === 404) throw new Error('User not found.');
    if (res.status === 403) throw new Error('Account is suspended or banned.');
    if (res.status === 429) throw new Error('Rate limited. Wait a moment and try again.');
    if (!res.ok) throw new Error('Request failed (status ' + res.status + ').');
    return res.json();
  })
  .then(function(json) {
    var data = json.data;
    if (!data) throw new Error('No user data in response.');

    statusEl.remove();

    body.appendChild(row('Username', 'u/' + data.name));
    if (data.subreddit && data.subreddit.title) {
      body.appendChild(row('Display Name', data.subreddit.title));
    }
    body.appendChild(row('User ID', data.id || 'Unknown'));

    if (data.created_utc) {
      var created = new Date(data.created_utc * 1000);
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var diffMs = Date.now() - created.getTime();
      var totalDays = Math.floor(diffMs / 86400000);
      var years = Math.floor(totalDays / 365);
      var remainingDays = totalDays % 365;
      var months = Math.floor(remainingDays / 30);
      var days = remainingDays % 30;
      var ageStr = '';
      if (years > 0) ageStr += years + 'y ';
      if (months > 0) ageStr += months + 'mo ';
      ageStr += days + 'd';

      body.appendChild(row('Account Age', ageStr.trim()));
      body.appendChild(row('Created (' + tz + ')', created.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZoneName: 'short'
      })));
      body.appendChild(row('Created (UTC)', created.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC'
      }) + ' UTC'));
      body.appendChild(row('Created (ISO)', created.toISOString()));
    }

    if (data.total_karma !== undefined) {
      body.appendChild(row('Total Karma', data.total_karma.toLocaleString()));
    }
    if (data.link_karma !== undefined) {
      body.appendChild(row('Post Karma', data.link_karma.toLocaleString()));
    }
    if (data.comment_karma !== undefined) {
      body.appendChild(row('Comment Karma', data.comment_karma.toLocaleString()));
    }

    var flags = [];
    if (data.is_gold) flags.push('Premium');
    if (data.is_mod) flags.push('Moderator');
    if (data.verified) flags.push('Verified');
    if (data.has_verified_email) flags.push('Email Verified');
    if (flags.length > 0) body.appendChild(row('Flags', flags.join(', ')));
  })
  .catch(function(err) {
    statusEl.textContent = err.message || 'Failed to fetch account data.';
    statusEl.style.color = '#fff';
  });

})();
