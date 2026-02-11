(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  function findNextData() {
    var script = document.querySelector('script#__NEXT_DATA__');
    if (!script) return null;
    try { return JSON.parse(script.textContent); }
    catch(e) { return null; }
  }

  function extractImageId(url) {
    if (url.indexOf('bolt_web') !== -1) {
      try {
        var base64Part = url.split('/bolt_web/')[1].split('._RS')[0];
        var decoded = atob(base64Part);
        var match = decoded.match(/\/d\/([^/.?]+)/);
        return match ? match[1] : null;
      } catch(e) { return null; }
    }
    var match = url.match(/\/d\/([^/.?]+)/);
    return match ? match[1] : null;
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
  titleEl.textContent = 'SNAPCHAT TIMESTAMPS';
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

  var nextData = findNextData();
  if (!nextData) {
    var err = document.createElement('div');
    err.style.cssText = 'padding:8px 0;color:#777';
    err.textContent = 'No __NEXT_DATA__ found. Make sure you are on a Snapchat page.';
    body.appendChild(err);
  } else {
    var spotlightHighlights = (nextData.props && nextData.props.pageProps && nextData.props.pageProps.spotlightHighlights) || [];
    var curatedHighlights = (nextData.props && nextData.props.pageProps && nextData.props.pageProps.curatedHighlights) || [];

    if (spotlightHighlights.length === 0 && curatedHighlights.length === 0) {
      var err2 = document.createElement('div');
      err2.style.cssText = 'padding:8px 0;color:#777';
      err2.textContent = 'No Spotlight or Stories data found on this page.';
      body.appendChild(err2);
    } else {
      var spotlightTimestampMap = {};
      for (var i = 0; i < spotlightHighlights.length; i++) {
        var item = spotlightHighlights[i];
        var storyId = item.storyId && item.storyId.value;
        var snapList = item.snapList;
        if (storyId && snapList && snapList.length > 0) {
          var ts = snapList[0].timestampInSec && snapList[0].timestampInSec.value;
          if (ts) spotlightTimestampMap[storyId] = ts;
        }
      }

      var storyThumbnailTimestampMap = {};
      for (var j = 0; j < curatedHighlights.length; j++) {
        var highlight = curatedHighlights[j];
        var thumbnailUrl = highlight.thumbnailUrl && highlight.thumbnailUrl.value;
        var sList = highlight.snapList;
        if (thumbnailUrl && sList && sList.length > 0) {
          var thumbnailId = extractImageId(thumbnailUrl);
          if (thumbnailId) {
            var mostRecent = 0;
            for (var k = 0; k < sList.length; k++) {
              var snapTs = parseInt((sList[k].timestampInSec && sList[k].timestampInSec.value) || 0);
              if (snapTs > mostRecent) mostRecent = snapTs;
            }
            if (mostRecent > 0) storyThumbnailTimestampMap[thumbnailId] = mostRecent;
          }
        }
      }

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

      var addedCount = 0;
      var now = Date.now();

      var spotlightCards = document.querySelectorAll('[data-testid="spotlight-tile"]');
      for (var si = 0; si < spotlightCards.length; si++) {
        var card = spotlightCards[si];
        var link = card.querySelector('a[href*="/spotlight/"]');
        if (!link) continue;
        var href = link.getAttribute('href');
        var storyIdMatch = href.match(/\/spotlight\/([^?]+)/);
        if (!storyIdMatch) continue;
        var sid = storyIdMatch[1];
        if (!spotlightTimestampMap[sid]) continue;

        var oldBadge = card.querySelector('._osint_ts');
        if (oldBadge) oldBadge.remove();

        var epoch = parseInt(spotlightTimestampMap[sid]);
        var date = new Date(epoch * 1000);
        var diffMs = now - date.getTime();
        var days = Math.floor(diffMs / 86400000);
        var hours = Math.floor(diffMs / 3600000);
        var mins = Math.floor(diffMs / 60000);
        var ago;
        if (days > 0) ago = days + 'd ago';
        else if (hours > 0) ago = hours + 'h ago';
        else ago = mins + 'm ago';

        var badge = document.createElement('div');
        badge.className = '_osint_ts';
        badge.style.cssText = [
          'margin-top:6px',
          'padding:4px 8px',
          'background:#000',
          'border:1px solid #333',
          'color:#fff',
          'font-family:"SF Mono","Cascadia Mono","Fira Mono",Consolas,monospace',
          'font-size:10px',
          'line-height:1.4'
        ].join(';');
        badge.textContent = ago + ' \u00b7 ' + date.toLocaleString('en-US', localOpts);
        badge.title = date.toLocaleString('en-US', utcOpts) + ' UTC\n' + date.toISOString();
        card.appendChild(badge);
        addedCount++;
      }

      var storyCards = document.querySelectorAll('[data-testid="story-tile"]');
      for (var sti = 0; sti < storyCards.length; sti++) {
        var sCard = storyCards[sti];
        var img = sCard.querySelector('img[data-testid="image-tile-img"]');
        if (!img) continue;
        var imgSrc = img.getAttribute('src');
        var imageId = extractImageId(imgSrc);
        if (!imageId || !storyThumbnailTimestampMap[imageId]) continue;

        var oldBadge2 = sCard.querySelector('._osint_ts');
        if (oldBadge2) oldBadge2.remove();

        var epoch2 = parseInt(storyThumbnailTimestampMap[imageId]);
        var date2 = new Date(epoch2 * 1000);
        var diffMs2 = now - date2.getTime();
        var days2 = Math.floor(diffMs2 / 86400000);
        var hours2 = Math.floor(diffMs2 / 3600000);
        var mins2 = Math.floor(diffMs2 / 60000);
        var ago2;
        if (days2 > 0) ago2 = days2 + 'd ago';
        else if (hours2 > 0) ago2 = hours2 + 'h ago';
        else ago2 = mins2 + 'm ago';

        var badge2 = document.createElement('div');
        badge2.className = '_osint_ts';
        badge2.style.cssText = [
          'margin-top:6px',
          'padding:4px 8px',
          'background:#000',
          'border:1px solid #333',
          'color:#fff',
          'font-family:"SF Mono","Cascadia Mono","Fira Mono",Consolas,monospace',
          'font-size:10px',
          'line-height:1.4'
        ].join(';');
        badge2.textContent = ago2 + ' \u00b7 ' + date2.toLocaleString('en-US', localOpts);
        badge2.title = date2.toLocaleString('en-US', utcOpts) + ' UTC\n' + date2.toISOString();
        sCard.appendChild(badge2);
        addedCount++;
      }

      body.appendChild(row('Spotlight items', Object.keys(spotlightTimestampMap).length.toString()));
      body.appendChild(row('Story groups', Object.keys(storyThumbnailTimestampMap).length.toString()));
      body.appendChild(row('Badges added', addedCount.toString()));

      if (addedCount === 0) {
        var note = document.createElement('div');
        note.style.cssText = 'padding:8px 0;color:#777;font-size:11px';
        note.textContent = 'No matching cards found to add timestamps to.';
        body.appendChild(note);
      }
    }
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
