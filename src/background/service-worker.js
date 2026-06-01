chrome.action.onClicked.addListener(function (tab) {
  if (!tab || !tab.id || !tab.url || tab.url.indexOf('netflix.com') === -1) return;
  chrome.tabs.sendMessage(tab.id, { type: 'subfreeze-toggle' });
});
