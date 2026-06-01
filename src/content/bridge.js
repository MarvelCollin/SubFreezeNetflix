chrome.runtime.onMessage.addListener(function (msg) {
  if (msg && msg.type === 'subfreeze-toggle') {
    window.postMessage({ __subfreeze: true, action: 'toggle' }, '*');
  }
});

window.addEventListener('message', function (e) {
  if (e.source !== window) return;
  const d = e.data;
  if (d && d.__subfreeze && d.action === 'translate') {
    chrome.runtime.sendMessage({ type: 'subfreeze-translate', word: d.word, tl: d.tl }, function (resp) {
      window.postMessage({
        __subfreeze: true,
        action: 'translated',
        id: d.id,
        translation: resp ? resp.translation : ''
      }, '*');
    });
  }
});
