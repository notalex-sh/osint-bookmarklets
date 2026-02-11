(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  var counts = {};
  var totalWords = 0;

  function walk(node) {
    var tag = node.tagName;
    if (node.nodeType === 3) {
      var words = node.data.toLowerCase().split(/[\s\(\)\:\,\.;\<\>\&\'\"\!\?\[\]\{\}\|\\\/\n\r\t]+/);
      for (var i = 0; i < words.length; i++) {
        var w = words[i].trim();
        if (w.length > 0) {
          counts[w] = (counts[w] || 0) + 1;
          totalWords++;
        }
      }
    }
    if (tag !== 'SCRIPT' && tag !== 'STYLE') {
      for (var c = 0; c < node.childNodes.length; c++) {
        walk(node.childNodes[c]);
      }
    }
  }

  walk(document.body);

  var sorted = [];
  for (var word in counts) {
    sorted.push([counts[word], word]);
  }
  sorted.sort(function(a, b) {
    var diff = b[0] - a[0];
    return diff !== 0 ? diff : (a[1] < b[1] ? -1 : 1);
  });

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
  titleEl.textContent = 'WORD FREQUENCY';
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

  var summary = document.createElement('div');
  summary.style.cssText = 'padding:8px 0;border-bottom:1px solid #222';
  var sumLbl = document.createElement('span');
  sumLbl.textContent = 'Total words';
  sumLbl.style.cssText = 'color:#777';
  var sumVal = document.createElement('span');
  sumVal.textContent = '  ' + totalWords + ' (' + sorted.length + ' unique)';
  sumVal.style.cssText = 'color:#fff;font-weight:700';
  summary.appendChild(sumLbl);
  summary.appendChild(sumVal);
  body.appendChild(summary);

  var maxShow = Math.min(sorted.length, 200);
  for (var k = 0; k < maxShow; k++) {
    var entry = document.createElement('div');
    entry.style.cssText = 'padding:4px 0;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between';

    var wordEl = document.createElement('span');
    wordEl.textContent = sorted[k][1];
    wordEl.style.cssText = 'color:#fff';

    var countEl = document.createElement('span');
    countEl.textContent = sorted[k][0];
    countEl.style.cssText = 'color:#777';

    entry.appendChild(wordEl);
    entry.appendChild(countEl);
    body.appendChild(entry);
  }

  if (sorted.length > maxShow) {
    var more = document.createElement('div');
    more.style.cssText = 'padding:8px 0;color:#555;font-size:10px;text-align:center';
    more.textContent = '... and ' + (sorted.length - maxShow) + ' more words';
    body.appendChild(more);
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
