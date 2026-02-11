(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  // Remove previous highlights
  var oldMarks = document.querySelectorAll('._osint_hl');
  for (var r = 0; r < oldMarks.length; r++) {
    var parent = oldMarks[r].parentNode;
    parent.replaceChild(document.createTextNode(oldMarks[r].textContent), oldMarks[r]);
    parent.normalize();
  }

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
  titleEl.textContent = 'FIND ON PAGE';
  titleEl.style.cssText = 'font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#777';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00d7';
  closeBtn.style.cssText = 'background:none;border:none;color:#777;font-size:18px;cursor:pointer;padding:0;line-height:1;font-family:inherit';
  closeBtn.onmouseover = function() { closeBtn.style.color = '#fff'; };
  closeBtn.onmouseout = function() { closeBtn.style.color = '#777'; };
  closeBtn.onclick = function() {
    // Clean up highlights on close
    var marks = document.querySelectorAll('._osint_hl');
    for (var i = 0; i < marks.length; i++) {
      var p = marks[i].parentNode;
      p.replaceChild(document.createTextNode(marks[i].textContent), marks[i]);
      p.normalize();
    }
    win.remove();
  };

  bar.appendChild(titleEl);
  bar.appendChild(closeBtn);

  var searchBar = document.createElement('div');
  searchBar.style.cssText = 'display:flex;gap:8px;padding:8px 12px;border-bottom:1px solid #222';

  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search text...';
  input.style.cssText = 'flex:1;background:#111;border:1px solid #333;color:#fff;padding:6px 8px;font-family:inherit;font-size:12px;outline:none';

  var searchBtn = document.createElement('button');
  searchBtn.textContent = 'Find';
  searchBtn.style.cssText = 'background:#fff;color:#000;border:none;padding:6px 12px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer';
  searchBtn.onmouseover = function() { searchBtn.style.opacity = '0.7'; };
  searchBtn.onmouseout = function() { searchBtn.style.opacity = '1'; };

  searchBar.appendChild(input);
  searchBar.appendChild(searchBtn);

  var body = document.createElement('div');
  body.style.cssText = 'overflow-y:auto;padding:12px';

  var statusEl = document.createElement('div');
  statusEl.style.cssText = 'padding:4px 0;color:#777;font-size:11px';
  statusEl.textContent = 'Enter a search term above.';
  body.appendChild(statusEl);

  var resultList = document.createElement('div');
  body.appendChild(resultList);

  function doSearch() {
    var query = input.value.trim();
    if (!query) return;

    // Remove old highlights
    var old = document.querySelectorAll('._osint_hl');
    for (var i = 0; i < old.length; i++) {
      var p = old[i].parentNode;
      p.replaceChild(document.createTextNode(old[i].textContent), old[i]);
      p.normalize();
    }
    resultList.innerHTML = '';

    var regex;
    try {
      regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    } catch(e) { return; }

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (node.parentNode.closest('#_osint_win')) return NodeFilter.FILTER_REJECT;
        if (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    var matches = [];
    for (var t = 0; t < textNodes.length; t++) {
      var node = textNodes[t];
      if (!regex.test(node.textContent)) continue;
      regex.lastIndex = 0;

      var frag = document.createDocumentFragment();
      var lastIdx = 0;
      var m;
      while ((m = regex.exec(node.textContent)) !== null) {
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(node.textContent.slice(lastIdx, m.index)));
        }
        var mark = document.createElement('span');
        mark.className = '_osint_hl';
        mark.style.cssText = 'background:#ff0;color:#000;font-weight:bold;padding:1px 2px';
        mark.textContent = m[1];
        frag.appendChild(mark);
        matches.push(mark);
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < node.textContent.length) {
        frag.appendChild(document.createTextNode(node.textContent.slice(lastIdx)));
      }
      node.parentNode.replaceChild(frag, node);
    }

    statusEl.textContent = matches.length + ' matches found.';

    for (var mi = 0; mi < matches.length; mi++) {
      var entry = document.createElement('div');
      entry.style.cssText = 'padding:4px 0;border-bottom:1px solid #222;cursor:pointer;color:#777;font-size:11px';
      var context = matches[mi].parentNode ? matches[mi].parentNode.textContent.trim() : '';
      if (context.length > 80) context = context.substring(0, 80) + '...';
      entry.textContent = (mi + 1) + '. ' + context;
      (function(mark) {
        entry.onmouseover = function() { entry.style.color = '#fff'; };
        entry.onmouseout = function() { entry.style.color = '#777'; };
        entry.onclick = function() {
          mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
          mark.style.outline = '2px solid #fff';
          setTimeout(function() { mark.style.outline = ''; }, 2000);
        };
      })(matches[mi]);
      resultList.appendChild(entry);
    }
  }

  searchBtn.onclick = doSearch;
  input.onkeydown = function(e) { if (e.key === 'Enter') doSearch(); };

  win.appendChild(bar);
  win.appendChild(searchBar);
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
  input.focus();

})();
