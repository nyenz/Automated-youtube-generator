/* TRENDS — free sources for topic ideas.
   Wikipedia (no key), Hacker News (no key), YouTube Data API (free key, 10,000 units/day). */
(function () {
  var TR = {}; window.TRENDS = TR;
  function j(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json() }) }
  function pad(n) { return (n < 10 ? '0' : '') + n }

  TR.wikipedia = function (lang) {
    var d = new Date(Date.now() - 36e5 * 30);
    var url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/' + (lang || 'en') + '.wikipedia/all-access/' + d.getUTCFullYear() + '/' + pad(d.getUTCMonth() + 1) + '/' + pad(d.getUTCDate());
    return j(url).then(function (r) {
      return r.items[0].articles.map(function (a) { return a.article.replace(/_/g, ' ') })
        .filter(function (t) { return !/^(Main Page|Special:|Wikipedia:|File:|Portal:|Help:|Talk:|Category:|Template:)/.test(t) && !/^(Search|Undefined|XXX)/i.test(t) }).slice(0, 40);
    });
  };
  TR.hackerNews = function () {
    return j('https://hacker-news.firebaseio.com/v0/topstories.json').then(function (ids) {
      return Promise.all(ids.slice(0, 20).map(function (id) { return j('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').catch(function () { return null }) }));
    }).then(function (items) { return items.filter(Boolean).map(function (x) { return x.title }) });
  };
  var CAT = { any: '', film: '1', autos: '2', music: '10', pets: '15', sports: '17', travel: '19', gaming: '20', people: '22', comedy: '23', entertainment: '24', news: '25', howto: '26', education: '27', science: '28' };
  TR.CATEGORIES = Object.keys(CAT);
  TR.youtube = function (key, region, cat) {
    if (!key) return Promise.reject(new Error('Add a free YouTube API key first.'));
    var u = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=40&regionCode=' + (region || 'US') + (CAT[cat] ? '&videoCategoryId=' + CAT[cat] : '') + '&key=' + encodeURIComponent(key);
    return j(u).then(function (r) { return (r.items || []).map(function (v) { return v.snippet.title + ' — ' + v.snippet.channelTitle + ' (' + fmt(v.statistics.viewCount) + ' views)' }) });
  };
  /* a channel's most viewed videos (by @handle) — costs ~101 units */
  TR.channelTop = function (key, handle) {
    if (!key) return Promise.reject(new Error('Add a free YouTube API key first.'));
    handle = String(handle || '').trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, '').replace(/\/.*$/, '');
    if (!handle) return Promise.reject(new Error('Type the channel handle, like @zackdfilms'));
    if (handle[0] !== '@') handle = '@' + handle;
    return j('https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' + encodeURIComponent(handle) + '&key=' + encodeURIComponent(key)).then(function (r) {
      if (!r.items || !r.items.length) throw new Error('Channel ' + handle + ' not found.');
      return j('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&maxResults=40&channelId=' + r.items[0].id + '&key=' + encodeURIComponent(key));
    }).then(function (r) { return (r.items || []).map(function (v) { return v.snippet.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') }) });
  };
  function fmt(n) { n = +n || 0; return n > 1e6 ? (n / 1e6).toFixed(1) + 'M' : n > 1e3 ? Math.round(n / 1e3) + 'K' : '' + n }
})();
