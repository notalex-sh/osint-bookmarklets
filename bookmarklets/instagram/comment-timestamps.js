(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();
  window._osint_abort = false;

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
  titleEl.textContent = 'COMMENT TIMESTAMPS';
  titleEl.style.cssText = 'font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#777';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00d7';
  closeBtn.style.cssText = 'background:none;border:none;color:#777;font-size:18px;cursor:pointer;padding:0;line-height:1;font-family:inherit';
  closeBtn.onmouseover = function() { closeBtn.style.color = '#fff'; };
  closeBtn.onmouseout = function() { closeBtn.style.color = '#777'; };
  closeBtn.onclick = function() {
    window._osint_abort = true;
    win.remove();
  };

  bar.appendChild(titleEl);
  bar.appendChild(closeBtn);

  var body = document.createElement('div');
  body.style.cssText = 'overflow-y:auto;padding:12px';

  var log = document.createElement('div');
  log.style.cssText = 'color:#777;font-size:11px;line-height:1.8';
  body.appendChild(log);

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

  function msg(text) {
    var line = document.createElement('div');
    line.textContent = text;
    log.insertBefore(line, log.firstChild);
  }

  function findByRegex(patterns) {
    var els = document.querySelectorAll(
      'button, div[role="button"], span[role="button"]'
    );
    var found = [];
    for (var i = 0; i < els.length; i++) {
      if (els[i].closest('#_osint_win')) continue;
      var txt = els[i].textContent.trim();
      for (var j = 0; j < patterns.length; j++) {
        if (patterns[j].test(txt)) {
          found.push(els[i]);
          break;
        }
      }
    }
    return found;
  }

  function clickAll(elements, label, delay, callback) {
    var count = elements.length;
    if (count === 0) return callback();
    msg('Clicking ' + count + ' ' + label);
    var i = 0;
    function next() {
      if (window._osint_abort || i >= elements.length) return callback();
      try {
        elements[i].scrollIntoView({ block: 'center', behavior: 'instant' });
        elements[i].click();
      } catch(e) {}
      i++;
      setTimeout(next, delay);
    }
    next();
  }

  var MAX_ROUNDS = 30;

  function expandLoop(finderFn, label, round, callback) {
    if (window._osint_abort) return callback();
    if (round >= MAX_ROUNDS) {
      msg('Max rounds for ' + label);
      return callback();
    }
    var els = finderFn();
    if (els.length === 0) return callback();
    clickAll(els, label + ' (round ' + (round + 1) + ')', 300, function() {
      setTimeout(function() {
        expandLoop(finderFn, label, round + 1, callback);
      }, 1000);
    });
  }

  function findCommentLoaders() {
    return findByRegex([
      /^View all \d+ comment/i,
      /^Load more comment/i,
      /^View more comment/i,
      /^\+$/
    ]);
  }

  function findReplyLoaders() {
    return findByRegex([
      /^View \d+ repl/i,
      /^View all \d+ repl/i,
      /^View more repl/i,
      /^View repl/i,
      /^\d+ repl/i,
      /replied.*\d+ repl/i
    ]);
  }

  function addTimestampBadges() {
    var timeEls = document.querySelectorAll('time[datetime]');
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var count = 0;

    for (var i = 0; i < timeEls.length; i++) {
      var timeEl = timeEls[i];
      if (timeEl.querySelector('._osint_ts')) continue;

      var datetime = timeEl.getAttribute('datetime');
      if (!datetime) continue;

      var date = new Date(datetime);
      var now = Date.now();
      var diffMs = now - date.getTime();
      var days = Math.floor(diffMs / 86400000);
      var hours = Math.floor(diffMs / 3600000);
      var mins = Math.floor(diffMs / 60000);

      var ago;
      if (days > 0) ago = days + 'd';
      else if (hours > 0) ago = hours + 'h';
      else ago = mins + 'm';

      var localStr = date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      var utcStr = date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'UTC'
      }) + ' UTC';

      var badge = document.createElement('span');
      badge.className = '_osint_ts';
      badge.style.cssText = [
        'display:inline-block',
        'margin-left:6px',
        'padding:3px 8px',
        'background:#000',
        'border:1px solid #333',
        'color:#fff',
        'font-family:"SF Mono","Cascadia Mono","Fira Mono",Consolas,monospace',
        'font-size:10px',
        'line-height:1.4',
        'vertical-align:middle',
        'white-space:nowrap'
      ].join(';');
      badge.textContent = ago + ' \u00b7 ' + localStr + ' (' + tz + ')';
      badge.title = utcStr + '\n' + date.toISOString();

      timeEl.style.position = 'relative';
      timeEl.appendChild(badge);
      count++;
    }

    return count;
  }

  function run() {
    msg('Starting...');

    expandLoop(findCommentLoaders, 'comment loaders', 0, function() {
      if (window._osint_abort) return msg('Stopped');
      msg('Comments loaded');

      expandLoop(findReplyLoaders, 'reply loaders', 0, function() {
        if (window._osint_abort) return msg('Stopped');
        msg('Replies loaded');

        var count = addTimestampBadges();
        msg('Done \u2014 ' + count + ' timestamps added');
      });
    });
  }

  setTimeout(run, 500);

})();
