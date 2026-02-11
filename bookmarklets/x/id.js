(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  var ogUrl = document.querySelector('meta[property="og:url"]');
  var pageUrl = ogUrl ? ogUrl.content : window.location.href;
  var urlObj = new URL(pageUrl);
  var parts = urlObj.pathname.split('/').filter(Boolean);
  var handleFromURL = parts[0] || '';

  var spans = document.querySelectorAll('div[data-testid="UserName"] span, div[data-testid="User-Name"] span');
  var displayName = '';
  for (var i = 0; i < spans.length; i++) {
    var txt = spans[i].textContent.trim();
    if (txt && txt.charAt(0) !== '@') { displayName = txt; break; }
  }

  function findIdentifier() {
    var hn = (handleFromURL || '').toLowerCase();
    var escRe = function(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var rx = [
      new RegExp('"identifier":"(\\d+)"[\\s\\S]{0,15000}"screen_name":"' + escRe(hn) + '"', 'i'),
      new RegExp('"screen_name":"' + escRe(hn) + '"[\\s\\S]{0,15000}"identifier":"(\\d+)"', 'i')
    ];
    function scan(txt) {
      if (!txt || txt.indexOf('"identifier"') === -1) return '';
      for (var r = 0; r < rx.length; r++) {
        var m = txt.match(rx[r]);
        if (m) return m[1];
      }
      var m2 = txt.match(/"identifier":"(\d{5,})"/);
      return m2 ? m2[1] : '';
    }
    var scripts = document.querySelectorAll('script');
    for (var s = 0; s < scripts.length; s++) {
      var id = scan(scripts[s].textContent || '');
      if (id) return id;
    }
    return scan(document.documentElement.innerHTML) || '';
  }

  var identifier = findIdentifier();
  var userIdURL = identifier ? 'https://x.com/i/user/' + identifier : '';

  function findCreateISO() {
    var scripts = document.querySelectorAll('script');
    for (var s = 0; s < scripts.length; s++) {
      var x = scripts[s].textContent || '';
      var m = x.match(/"dateCreated":"([^"]+)"/) ||
              x.match(/"created_at":"([^"]+)"/) ||
              x.match(/"createdAt":"([^"]+)"/);
      if (m) {
        var d = new Date(m[1]);
        if (!isNaN(d)) return d.toISOString();
      }
    }
    var joinedEl = document.querySelector('[data-testid="UserJoinDate"] span');
    var joined = joinedEl ? joinedEl.textContent : '';
    var jm = joined.match(/Joined\s+([A-Za-z]+)\s+(\d{4})/);
    if (jm) {
      var d2 = new Date(jm[1] + ' 1, ' + jm[2] + ' 00:00:00Z');
      if (!isNaN(d2)) return d2.toISOString();
    }
    return '';
  }

  var createdISO = findCreateISO();

  var bannerImg = '';
  var bannerEl = document.querySelector('img[src*="pbs.twimg.com/profile_banners/"]');
  if (bannerEl) bannerImg = bannerEl.src;

  function parseBannerUpload(src) {
    if (!src) return '';
    try {
      var clean = src.split('?')[0];
      var m = clean.match(/\/profile_banners\/\d+\/(\d+)/);
      if (!m) return '';
      var token = m[1];
      var ms = NaN;
      if (/^\d{10}$/.test(token)) ms = parseInt(token, 10) * 1000;
      else if (/^\d{13}$/.test(token)) ms = parseInt(token, 10);
      if (!isNaN(ms)) {
        var d = new Date(ms);
        if (!isNaN(d)) return d.toISOString();
      }
      return '';
    } catch(e) { return ''; }
  }

  var bannerUploadDate = parseBannerUpload(bannerImg);

  function findProfileImg() {
    try {
      var hn = handleFromURL || '';
      var a = document.querySelector('div[data-testid="primaryColumn"] a[href="/' + hn + '/photo"]') ||
              document.querySelector('a[href="/' + hn + '/photo"]');
      if (a) {
        var im = a.querySelector('img[src*="pbs.twimg.com/profile_images/"]');
        if (im) return im.src;
      }
      var og = document.querySelector('meta[property="og:image"]');
      var ogContent = og ? og.content : '';
      if (ogContent && /pbs\.twimg\.com\/profile_images\//i.test(ogContent)) return ogContent;
      var any = document.querySelector('div[data-testid="primaryColumn"] img[src*="pbs.twimg.com/profile_images/"]');
      if (any) return any.src;
      return '';
    } catch(e) { return ''; }
  }

  var profileImg = findProfileImg();
  if (profileImg) {
    profileImg = profileImg.replace('_normal', '');
    if (profileImg.indexOf('name=') > -1)
      profileImg = profileImg.replace(/([?&])name=[^&]*/, '$1name=orig');
  }

  var profileURL = 'https://x.com/' + handleFromURL;

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
  titleEl.textContent = 'X PROFILE';
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

  function linkRow(label, href) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:8px 0;border-bottom:1px solid #222;word-break:break-all';
    var lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.cssText = 'color:#777';
    var val = document.createElement('span');
    val.textContent = '  ' + href;
    val.style.cssText = 'color:#fff;font-weight:700';
    div.appendChild(lbl);
    div.appendChild(val);
    return div;
  }

  body.appendChild(row('X ID', identifier || 'Not found \u2014 try refreshing the page'));
  body.appendChild(linkRow('User ID URL', userIdURL || 'N/A'));
  body.appendChild(linkRow('Profile URL', profileURL));
  body.appendChild(row('Username', '@' + (handleFromURL || 'unknown')));
  if (displayName) body.appendChild(row('Display Name', displayName));
  body.appendChild(row('Created', createdISO || 'Not found'));

  if (bannerImg) {
    body.appendChild(linkRow('Banner Image', bannerImg));
    body.appendChild(row('Banner Upload', bannerUploadDate || 'Unknown'));
  }
  if (profileImg) {
    body.appendChild(linkRow('Profile Image', profileImg));
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
