(function () {
  const SF = window.__SubFreeze;

  function ttmlTime(value) {
    if (!value) return 0;
    const t = String(value).trim();
    if (t.indexOf(':') !== -1) {
      const parts = t.split(':');
      const h = parseFloat(parts[0]) || 0;
      const m = parseFloat(parts[1]) || 0;
      const s = parseFloat(parts[2]) || 0;
      return h * 3600 + m * 60 + s;
    }
    const num = parseFloat(t);
    if (isNaN(num)) return 0;
    return num / 10000000;
  }

  function extractText(node) {
    let out = '';
    const kids = node.childNodes;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.nodeType === 1) {
        if (n.nodeName.toLowerCase() === 'br') out += '\n';
        else out += extractText(n);
      } else if (n.nodeType === 3) {
        out += n.nodeValue;
      }
    }
    return out;
  }

  SF.parseTTML = function (xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    const ps = xml.getElementsByTagName('p');
    const cues = [];
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const start = ttmlTime(p.getAttribute('begin'));
      const end = ttmlTime(p.getAttribute('end'));
      const text = extractText(p)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
      if (!text) continue;
      cues.push({ start: start, end: end, text: text });
    }
    cues.sort(function (a, b) {
      return a.start - b.start;
    });
    return cues;
  };

  SF.findCue = function (cues, time) {
    for (let i = 0; i < cues.length; i++) {
      if (time >= cues[i].start && time <= cues[i].end) return cues[i].text;
    }
    return '';
  };
})();
