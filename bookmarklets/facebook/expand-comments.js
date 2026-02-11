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
  titleEl.textContent = 'EXPAND COMMENTS';
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

  function findByRegex(patterns) {
    var els = document.querySelectorAll('div[role="button"], span[role="button"]');
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

  function switchToAllComments(callback) {
    var mostRelevant = findByRegex([/^Most relevant$/i]);
    var newest = findByRegex([/^Newest$/i]);
    var allComments = findByRegex([/^All comments$/i]);

    if (allComments.length > 0) {
      msg('Already showing all comments');
      return callback();
    }

    var filterBtn = mostRelevant.length > 0 ? mostRelevant[0] :
                    newest.length > 0 ? newest[0] : null;

    if (!filterBtn) {
      msg('No comment filter found');
      return callback();
    }

    msg('Opening comment filter...');
    filterBtn.click();

    setTimeout(function() {
      var candidates = document.querySelectorAll(
        'div[role="menuitem"], div[role="menuitemradio"], div[role="option"], [role="dialog"] span, [role="menu"] span, [role="listbox"] span'
      );
      var allBtn = null;
      for (var i = 0; i < candidates.length; i++) {
        var txt = candidates[i].textContent.trim();
        if (/^All comments$/i.test(txt)) {
          allBtn = candidates[i];
          break;
        }
      }
      if (allBtn) {
        msg('Switching to all comments');
        allBtn.click();
        setTimeout(callback, 2000);
      } else {
        msg('Could not find "All comments" option');
        document.body.click();
        setTimeout(callback, 500);
      }
    }, 1000);
  }

  function findMoreComments() {
    return findByRegex([
      /^View more comment/i,
      /^View \d+ more comment/i,
      /^View previous comment/i,
      /^View \d+ previous comment/i
    ]);
  }

  function findReplyLoaders() {
    return findByRegex([
      /^View \d+ repl/i,
      /^View all \d+ repl/i,
      /^View more repl/i,
      /^View previous repl/i,
      /^\d+ repl/i
    ]);
  }

  function findSeeMore() {
    return findByRegex([/^See more$/i]);
  }

  var MAX_ROUNDS = 50;

  function expandLoop(finderFn, label, round, callback) {
    if (window._osint_abort) return callback();
    if (round >= MAX_ROUNDS) {
      msg('Max rounds reached for ' + label);
      return callback();
    }
    var els = finderFn();
    if (els.length === 0) return callback();
    clickAll(els, label + ' (round ' + (round + 1) + ')', 300, function() {
      setTimeout(function() {
        expandLoop(finderFn, label, round + 1, callback);
      }, 1500);
    });
  }

  function run() {
    msg('Starting...');

    switchToAllComments(function() {
      if (window._osint_abort) return msg('Stopped');

      expandLoop(findMoreComments, 'comment loaders', 0, function() {
        if (window._osint_abort) return msg('Stopped');
        msg('Comments done');

        expandLoop(findReplyLoaders, 'reply loaders', 0, function() {
          if (window._osint_abort) return msg('Stopped');
          msg('Replies done');

          clickAll(findSeeMore(), '"See more"', 100, function() {
            if (window._osint_abort) return msg('Stopped');

            var comments = document.querySelectorAll('div[role="article"]');
            msg('Done \u2014 ' + comments.length + ' items visible');
          });
        });
      });
    });
  }

  setTimeout(run, 500);

})();
