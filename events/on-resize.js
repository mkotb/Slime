// this is injected into the introduction's page to notify it when the user has resized a window
// this is really hacky, but I have yet to find a better way

function callResizeEvent() {
    var script = document.createElement("script");

    script.innerHTML = `
        if (slimeIntegration && slimeIntegration.onStick) {
            slimeIntegration.onResize();
        }
    `;
    document.head.appendChild(script);

    setTimeout(() => {
        document.head.removeChild(script);
    }, 500);
}

callResizeEvent();