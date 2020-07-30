// TODO: Replace the following with your app's Firebase project configuration
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
        console.log(details.url);
        chrome.tabs.executeScript(null, { file: "content.js" });
        // get the ID of the video from URL and check if there is an entry for that video

        // USING DUMMY DATA FOR NOW:
        let videoID = "S07vxvKvk40";
        let key = "videos/" + videoID;
        console.log(key);

        // get the value fot that key from the database
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