let regWatch = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?+/gm;

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    console.log(details);
    // match if its youtube watch page
    if ((details.url).match(regWatch)) {
        chrome.tabs.executeScript(null, { file: "content.js" });
    } else {
        // any other website except youtube or
        // any other youtube page except the one with watch in the URL
        console.log("NO need to run the script");
    }

});