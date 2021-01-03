let tab = null;
let video = null;
let pip = false;
let initialResize = true;

function startPip() {
  findCurrentTab();

  chrome.tabCapture.capture({
    video: true,
    videoConstraints: {
      mandatory: {
        minWidth: 400,
        minHeight: 400,
        maxWidth: screen.availWidth,
        maxHeight: screen.availHeight,
        minFrameRate: 10,
        maxFrameRate: 60
      }
    }
  }, (stream) => {
    setupVideo(stream);
  });
}

function setupVideo(stream) {
  video = document.createElement('video');
  video.srcObject = stream;
  initialResize = true;

  video.addEventListener('enterpictureinpicture', () => {
    pip = true;
  });

  video.addEventListener('leavepictureinpicture', () => {
    initialResize = false;
    pip = false;
    stream.getTracks().forEach(t => t.stop());
    notifyTab();
    focusOnTab();
  });
  

  video.addEventListener('loadedmetadata', () => {
    video.requestPictureInPicture()
      .then((window) => {
        if (shouldSendEventsToTab()) {
          window.addEventListener('resize', onResize);
        }
      });

    video.play();
  });

  stream.addEventListener('inactive', () => {
    if (pip) {
      document.exitPictureInPicture();
      video = null;
    }
  });
}

function onResize(event) {
  if (!initialResize) {
    sendEventToPage('on-resize.js');
  }

  initialResize = false;
}

function findCurrentTab() {
  chrome.tabs.query (
    {
      active: true, 
      currentWindow: true
    },
    (tabs) => {
      if (tabs && tabs[0]) {
        tab = tabs[0];
        notifyTab();
      } else {
        tab = null;
      }
    }
  );
}

function notifyTab() {
  sendEventToPage('on-stick.js');
}

function shouldSendEventsToTab() {
  return tab.url.indexOf('https://mkotb.github.io/Slime-Demo/') >= 0;
}

function sendEventToPage(file) {
  if (shouldSendEventsToTab()) {
    chrome.tabs.executeScript({
      file: 'events/' + file
    });
  }
}

function focusOnTab() {
  if (!tab) {
    return;
  }

  chrome.windows.update (
    tab.windowId,
    { focused: true },
    (window) => {
      chrome.tabs.update (
        tab.id,
        { active: true },
        (t) => {}
      );
    }
  );
}

function stopPip() {
  document.exitPictureInPicture();
  video = null;
}

function togglePip() {
  if (pip) {
    stopPip();
  } else {
    startPip();
  }
}

chrome.browserAction.onClicked.addListener(() => {
  togglePip();
});

chrome.commands.onCommand.addListener((command) => {
  togglePip();
});

chrome.runtime.onInstalled.addListener((event) => {
  if (event.reason !== 'install') {
    return;
  }

  chrome.tabs.create({
    url: 'https://mkotb.github.io/Slime-Demo/'
  });
});
