chrome.action.onClicked.addListener(function (tab) {
  if (!tab || !tab.id || !tab.url || tab.url.indexOf('netflix.com') === -1) return;
  chrome.tabs.sendMessage(tab.id, { type: 'subfreeze-toggle' });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || msg.type !== 'subfreeze-translate') return;
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
    encodeURIComponent(msg.tl) + '&dt=t&q=' + encodeURIComponent(msg.word);
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      let out = '';
      if (data && data[0]) {
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i] && data[0][i][0]) out += data[0][i][0];
        }
      }
      sendResponse({ translation: out });
    })
    .catch(function () {
      sendResponse({ translation: '' });
    });
  return true;
});
