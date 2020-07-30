// TODO: Replace the following with your app's Firebase project configuration
let regWatch = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?+/gm;


var firebaseConfig = {
    apiKey: "AIzaSyDoOvv_JnPMGjl2yrVGvCOEDT-mIb1iNeY",
    authDomain: "time-line-a2ea3.firebaseapp.com",
    databaseURL: "https://time-line-a2ea3.firebaseio.com",
    projectId: "time-line-a2ea3",
    storageBucket: "time-line-a2ea3.appspot.com",
    messagingSenderId: "202568583915",
    appId: "1:202568583915:web:2e5fcbedc8706ed3bb8cae",
    measurementId: "G-K8LPNLPBHB"
};

firebase.initializeApp(firebaseConfig);
console.log(firebase)


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