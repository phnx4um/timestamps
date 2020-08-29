// regex for youtube watch page
const regWatch = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?+/gm;

var firebaseConfig = {
    apiKey: "AIzaSyAOHWshJ0sUoAkqdG-1AmJFcJDOdQyiAfc",
    authDomain: "timeline-62fb9.firebaseapp.com",
    databaseURL: "https://timeline-62fb9.firebaseio.com",
    projectId: "timeline-62fb9",
    storageBucket: "timeline-62fb9.appspot.com",
    messagingSenderId: "957475293099",
    appId: "1:957475293099:web:568dd3e7aa053e656934ee",
    measurementId: "G-LCYC0D75ZT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// firebase.analytics();
const database = firebase.firestore();

// chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
//     console.log(details);
//     // match if its youtube watch page
//     if ((details.url).match(regWatch)) {
//         // let videoID;
//         console.log(details.url);
//         chrome.tabs.executeScript(null, { file: "content.js" });

//         // videoID = getID(details.url);
//         // console.log(videoID);

//         // let key = "videos/" + videoID;
//         // console.log(key);
//         // get the value for that key from the database
//         // let videoRef = database.ref(key);
//         // videoRef.once('value')
//         //     .then(function(snapshot) {
//         //         var value = snapshot.val();
//         //         console.log(value);
//         //         // send the data to content script..
//         //         chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//         //             chrome.tabs.sendMessage(tabs[0].id, value);
//         //         });
//         //     })
//         //     .catch(e => {
//         //         console.log(e);
//         //     });

//     } else {
//         // any other website except youtube or
//         // any other youtube page except the one with watch in the URL
//         console.log("NO need to run the script");
//     }
// });


chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    console.log(details);
    if (!details.frameId) {
        console.log(details.url);
        chrome.tabs.executeScript(details.tabId, { file: 'content.js' });
    }
}, {
    url: [
        { hostEquals: 'youtu.be' },
        { hostEquals: 'www.youtube.com', pathPrefix: '/watch' },
    ],
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.data) {
            //get id
            let id = getID(sender.tab.url);
            let key = id;
            console.log(key);
            // query firebase
            let videoRef = database.collection("videos").doc(key);
            videoRef.get()
                .then(function(doc) {
                    var value = doc.data();
                    console.log(value);
                    if (value === undefined) {
                        value = false;
                    }
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