(function() {

  var existing = document.getElementById('_osint_win');
  if (existing) existing.remove();

  function makeErrWin(msg) {
    var w = document.createElement('div');
    w.id = '_osint_win';
    w.style.cssText = [
      'position:fixed',
      'top:48px',
      'right:48px',
      'width:420px',
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
    var b = document.createElement('div');
    b.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'padding:8px 12px',
      'background:#000',
      'border-bottom:1px solid #222'
    ].join(';');
    var t = document.createElement('span');
    t.textContent = 'INSTAGRAM COLLAB FINDER';
    t.style.cssText = 'font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#777';
    var x = document.createElement('button');
    x.textContent = '\u00d7';
    x.style.cssText = 'background:none;border:none;color:#777;font-size:18px;cursor:pointer;padding:0;line-height:1;font-family:inherit';
    x.onmouseover = function() { x.style.color = '#fff'; };
    x.onmouseout = function() { x.style.color = '#777'; };
    x.onclick = function() { w.remove(); };
    b.appendChild(t);
    b.appendChild(x);
    var bd = document.createElement('div');
    bd.style.cssText = 'padding:12px';
    var m = document.createElement('div');
    m.style.cssText = 'padding:8px 0;color:#777';
    m.textContent = msg;
    bd.appendChild(m);
    w.appendChild(b);
    w.appendChild(bd);
    document.body.appendChild(w);
  }

  if (window.location.hostname.indexOf('instagram.com') === -1) {
    makeErrWin('This bookmarklet must be run on instagram.com');
    return;
  }

  var pathParts = window.location.pathname.split('/').filter(Boolean);
  var username = pathParts[0] || '';

  if (!username || /^(p|reel|stories|explore|direct|accounts|reels)$/i.test(username)) {
    makeErrWin('Navigate to an Instagram profile page first.');
    return;
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
  titleEl.textContent = 'INSTAGRAM COLLAB FINDER';
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

  var statusEl = document.createElement('div');
  statusEl.style.cssText = 'padding:8px 0;color:#777';
  statusEl.textContent = 'Fetching profile data for @' + username + '...';
  body.appendChild(statusEl);

  win.appendChild(bar);
  win.appendChild(body);

  // Drag logic
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

  fetch('/api/v1/users/web_profile_info/?username=' + encodeURIComponent(username), {
    method: 'GET',
    headers: { 'X-IG-App-ID': '936619743392459' },
    credentials: 'omit'
  })
  .then(function(res) {
    if (res.status === 404) throw new Error('User not found.');
    if (res.status === 429) throw new Error('Rate limited. Wait a moment and try again.');
    if (!res.ok) throw new Error('Request failed (status ' + res.status + ').');
    return res.text();
  })
  .then(function(text) {
    var json;
    try {
      json = JSON.parse(text);
    } catch(e) {
      // Show first 200 chars of response for debugging
      throw new Error('Invalid JSON response. Response starts with: ' + text.substring(0, 200));
    }

    // Try multiple possible response shapes
    var user = null;
    if (json.data && json.data.user) {
      user = json.data.user;
    } else if (json.user) {
      user = json.user;
    } else if (json.graphql && json.graphql.user) {
      user = json.graphql.user;
    }

    if (!user) {
      throw new Error('No user data in response. Keys: ' + Object.keys(json).join(', '));
    }

    statusEl.textContent = '';

    body.appendChild(row('Username', '@' + (user.username || username)));
    if (user.full_name) body.appendChild(row('Name', user.full_name));
    body.appendChild(row('Account', user.is_private ? 'Private' : 'Public'));

    var followers = null;
    if (user.edge_followed_by) followers = user.edge_followed_by.count;
    else if (user.follower_count !== undefined) followers = user.follower_count;
    if (followers !== null) body.appendChild(row('Followers', followers.toLocaleString()));

    var following = null;
    if (user.edge_follow) following = user.edge_follow.count;
    else if (user.following_count !== undefined) following = user.following_count;
    if (following !== null) body.appendChild(row('Following', following.toLocaleString()));

    // Try multiple paths for timeline posts
    var edges = [];
    try { edges = user.edge_owner_to_timeline_media.edges; } catch(e) {}

    // v1 API may return media differently
    if (edges.length === 0 && user.media && user.media.items) {
      // Convert v1 format to edge format
      for (var mi = 0; mi < user.media.items.length; mi++) {
        edges.push({ node: user.media.items[mi] });
      }
    }

    body.appendChild(row('Posts fetched', edges.length.toString()));

    if (edges.length === 0) {
      var noPostsEl = document.createElement('div');
      noPostsEl.style.cssText = 'padding:8px 0;color:#777;font-size:11px';
      noPostsEl.textContent = user.is_private
        ? 'Private account \u2014 no posts accessible unless they have collabs with public accounts you can view.'
        : 'No posts found on this profile.';
      body.appendChild(noPostsEl);
      return;
    }

    var collabsFound = 0;

    var headerEl = document.createElement('div');
    headerEl.style.cssText = 'padding:12px 0 4px 0;color:#777;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #222';
    headerEl.textContent = 'Posts & Collaborators';
    body.appendChild(headerEl);

    for (var i = 0; i < edges.length; i++) {
      var node = edges[i].node;
      var shortcode = node.shortcode || node.code || '';
      var isVideo = node.is_video || (node.media_type === 2);
      var ownerUsername = '';
      try { ownerUsername = node.owner.username || node.owner.name; } catch(e) {}

      var tagged = [];
      // GraphQL format
      try {
        var tagEdges = node.edge_media_to_tagged_user.edges;
        for (var t = 0; t < tagEdges.length; t++) {
          tagged.push(tagEdges[t].node.user.username);
        }
      } catch(e) {}
      // v1 format
      try {
        if (node.usertags && node.usertags.in) {
          for (var ut = 0; ut < node.usertags.in.length; ut++) {
            var uname = node.usertags.in[ut].user.username;
            if (tagged.indexOf(uname) === -1) tagged.push(uname);
          }
        }
      } catch(e) {}

      var coauthors = [];
      try {
        if (node.coauthor_producers) {
          for (var c = 0; c < node.coauthor_producers.length; c++) {
            coauthors.push(node.coauthor_producers[c].username);
          }
        }
      } catch(e) {}
      try {
        if (node.invited_coauthor_producers) {
          for (var ic = 0; ic < node.invited_coauthor_producers.length; ic++) {
            coauthors.push(node.invited_coauthor_producers[ic].username);
          }
        }
      } catch(e) {}

      var allCollabs = tagged.concat(coauthors);
      var seen = {};
      var uniqueCollabs = [];
      for (var u = 0; u < allCollabs.length; u++) {
        if (!seen[allCollabs[u]]) {
          seen[allCollabs[u]] = true;
          uniqueCollabs.push(allCollabs[u]);
        }
      }

      if (uniqueCollabs.length > 0) collabsFound++;

      var postDiv = document.createElement('div');
      postDiv.style.cssText = 'padding:8px 0;border-bottom:1px solid #1a1a1a';

      var postLink = document.createElement('div');
      postLink.style.cssText = 'color:#fff;font-size:11px;cursor:pointer';
      postLink.textContent = (isVideo ? 'Reel' : 'Post') + '  /' + (isVideo ? 'reel' : 'p') + '/' + shortcode + '/';
      postLink.title = 'Click to open';
      (function(sc, vid) {
        postLink.onclick = function() {
          window.open('https://www.instagram.com/' + (vid ? 'reel' : 'p') + '/' + sc + '/', '_blank');
        };
      })(shortcode, isVideo);
      postLink.onmouseover = function() { this.style.color = '#aaa'; };
      postLink.onmouseout = function() { this.style.color = '#fff'; };
      postDiv.appendChild(postLink);

      if (ownerUsername && ownerUsername !== username) {
        var ownerEl = document.createElement('div');
        ownerEl.style.cssText = 'color:#555;font-size:10px;margin-top:2px';
        ownerEl.textContent = 'owner: @' + ownerUsername;
        postDiv.appendChild(ownerEl);
      }

      if (uniqueCollabs.length > 0) {
        for (var uc = 0; uc < uniqueCollabs.length; uc++) {
          var collabEl = document.createElement('div');
          collabEl.style.cssText = 'color:#777;font-size:11px;margin-top:2px;cursor:pointer';
          collabEl.textContent = '\u2192 @' + uniqueCollabs[uc];
          collabEl.title = 'Click to open profile';
          (function(name) {
            collabEl.onclick = function() {
              window.open('https://www.instagram.com/' + name + '/', '_blank');
            };
            collabEl.onmouseover = function() { this.style.color = '#fff'; };
            collabEl.onmouseout = function() { this.style.color = '#777'; };
          })(uniqueCollabs[uc]);
          postDiv.appendChild(collabEl);
        }
      } else {
        var noneEl = document.createElement('div');
        noneEl.style.cssText = 'color:#333;font-size:10px;margin-top:2px';
        noneEl.textContent = 'no tagged users';
        postDiv.appendChild(noneEl);
      }

      body.appendChild(postDiv);
    }

    var summaryEl = document.createElement('div');
    summaryEl.style.cssText = 'padding:8px 0;color:#555;font-size:10px;margin-top:4px';
    summaryEl.textContent = collabsFound + ' of ' + edges.length + ' posts have tagged/collab users. Only the most recent posts are returned by the API.';
    body.appendChild(summaryEl);

  })
  .catch(function(err) {
    statusEl.textContent = err.message || 'Failed to fetch profile data.';
    statusEl.style.color = '#fff';
  });

})();
