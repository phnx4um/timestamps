// regex for youtube watch page
const regWatch = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?+/gm;


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
console.log(firebase);
var database = firebase.database();
console.log(database);


chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    console.log(details);
    // match if its youtube watch page
    if ((details.url).match(regWatch)) {
        let videoID;
        console.log(details.url);
        chrome.tabs.executeScript(null, { file: "content.js" });

        videoID = getID(details.url);
        console.log(videoID);

        let key = "videos/" + videoID;
        console.log(key);

        // get the value for that key from the database
        let videoRef = database.ref(key);
        videoRef.once('value')
            .then(function(snapshot) {
                var value = snapshot.val();
                console.log(value);
                // send the data to content script..
                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, value);
                });
            })
            .catch(e => {
                console.log(e);
            });

    } else {
        // any other website except youtube or
        // any other youtube page except the one with watch in the URL
        console.log("NO need to run the script");
    }

});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.data) {
            //get id
            let id = getID(sender.tab.url);
            let key = "videos/" + id;
            console.log(key);
            // query firebase
            let videoRef = database.ref(key);
            videoRef.once('value')
                .then(function(snapshot) {
                    var value = snapshot.val();
                    console.log(value);
                    // send the data to content script..
                    sendResponse({ data: value });
                })
                .catch(e => {
                    console.log(e);
                });
        }
        return true;
    }
);

function getID(url) {
    // get videoID from the URL
    var video_id = url.split('v=')[1];
    var ampersandPosition = video_id.indexOf('&');
    if (ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
    return video_id;
}