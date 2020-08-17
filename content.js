(function() {

    let l; // label
    let tr; // ratios
    let ts; // stamps in seconds

    // get the values from the chrome storage..if present
    // otherwise these are the default values
    let labelColor = "#0000FF";
    let timeStampColor = "#FF7F50";
    // let isPresentInDB = false;
    let simpleUI = false;

    let videoInfo;
    let holder;
    let ytPlayer;
    const regWatch = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?+/gm;

    // regex to get the timestamps // improved...
    const regex = /^(?:((?:\d{1,2})?(?::\d{1,2})?:\d{1,2}) *(.*)|(.*) ((?:\d{1,2})?(?::\d{1,2})?:\d{1,2}))$/gmi;

    if (!((location.href).match(regWatch))) return;

    // console.log(`ispresentDB ${isPresentInDB}`);
    // chrome.runtime.onMessage.addListener(
    //     function(request) {
    //         console.log(request);
    //         // check what the firebase sends if data is not found
    //         if (request) {
    //             isPresentInDB = true;
    //             console.log(`ispresentDB in eventlistener ${isPresentInDB}`);
    //             videoInfo = request;
    //             l = videoInfo["labels"];
    //             tr = videoInfo["time-ratios"];
    //             ts = videoInfo["time-stamps"];
    //         }
    //     }
    // );

    if (document.querySelector("#activate-ext")) {
        // the extension was loaded previously and is still active
        // no need to initialise everything again... just remove the previous UI
        if (document.querySelector("#my-container")) {
            document.querySelector("#my-container").remove();
        }
        // remove NO TIMESTAMPS MESSAGE too, if present
        if (document.querySelector("#ts-nfm-c")) {
            document.querySelector("#ts-nfm-c").remove();
        }
    } else {
        console.log("hello !st time huh.... :p");

        chrome.storage.sync.get(['settingsInfo'], function(data) {
            // check if data exists.
            //otherwise use the default values
            if (data.settingsInfo) {
                console.log(data);
                labelColor = data.settingsInfo.lc;
                timeStampColor = data.settingsInfo.tsc;
                simpleUI = data.settingsInfo.simple;
                console.log(labelColor, timeStampColor, simpleUI);
            }
        });

        setTimeout(() => {
            let pc = document.getElementById("player-container");
            let c = pc.querySelector("#container");

            // if holder exists.....
            // TODO:
            if (!(c === null)) {
                holder = c.querySelector("#movie_player");
                console.log(holder.offsetHeight);
                createMainUI();
            } else {
                var id = setInterval(() => {
                    console.log("checking");
                    let x = document.getElementById("player-container").querySelector("#container")
                    if (x) {
                        holder = x.querySelector("#movie_player");
                        console.log(holder.offsetHeight);
                        createMainUI();
                        clearInterval(id);
                    }
                }, 5 * 1000);
            }
        }, 5 * 1000);
    }

    function createMainUI() {
        let uiContainer = document.createElement("div");
        uiContainer.id = "ts-mui-c";
        var image = document.createElement("img");
        image.src = chrome.runtime.getURL("images/linear.png");
        image.id = "activate-ext";
        image.addEventListener("click", displayUI);

        var settingImage = document.createElement("img");
        settingImage.src = chrome.runtime.getURL("images/setting.png");
        settingImage.id = "ts-setting-ext";
        settingImage.addEventListener("click", () => {
            generateSettingsMenu();
        });

        uiContainer.appendChild(settingImage);
        uiContainer.appendChild(image);

        holder.appendChild(uiContainer);

    }

    function displayUI() {
        // if already exists.. no need to do anything
        // this prevents the users from creating  mutiple instances
        if (!document.getElementById("my-container")) {

            // get a reference to youtube player
            ytPlayer = document.getElementsByTagName('video')[0];
            console.log(ytPlayer);

            // first check to see if data is available in description
            // getData() return 0 if timestamps are not present in the description
            if (!getData()) {
                // query data from firestore
                chrome.runtime.sendMessage({ data: true }, function(response) {
                    console.log(response);
                    if (response.data) {
                        // data exists in firestore

                        // isPresentInDB = true;
                        videoInfo = response.data.default;

                        // for regenrating UI
                        l = videoInfo["labels"];
                        ts = videoInfo["timeStampsInSeconds"];

                        // present in database
                        console.log("PRESENT IN FIRESTORE");
                        let timeRatios = computeTimeRatios(videoInfo["timeStampsInSeconds"]);
                        tr = timeRatios;
                        // directly generate UI
                        generateUI(videoInfo["labels"], timeRatios, videoInfo["timeStampsInSeconds"]);
                    } else {
                        // no data present for the current video
                        if (!document.querySelector("#ts-nfm-c")) {
                            //////////////////////////////////////////////////////
                            // no data found
                            // dislay a message requesting to generate time-stamps
                            //////////////////////////////////////////////////////
                            displayNotFoundMessage();
                        }
                    }
                });
            }
        }
        // // if already exists.. no need to do anything
        // if (!document.getElementById("my-container")) {
        //     // get a reference to youtube player

        //     if (isPresentInDB) {

        //     } else {
        //         // get data from the description
        //         // and then generate UI
        //         getData();
        //     }
        // }
    }


    function getData() {
        // get data from description
        console.log("CHECKING IN DESCRIPTION");
        let description = document.getElementById("columns").querySelector("#description").textContent;
        let totalTime = document.querySelector(".ytp-time-duration").innerText;
        console.log(description);
        console.log(totalTime);

        let match = regex.exec(description);
        // console.log(match);
        if (match === null) {
            console.log("Sorry No timestamps found in description");
            return 0;
        }

        let timeStamps = [];
        let labels = [];

        let timeIndex;
        let labelIndex;

        // code below expects the timestamps to follow the same format for a particular video
        if (match[1] != undefined) {
            timeIndex = 1;
            labelIndex = 2;
        } else {
            timeIndex = 4;
            labelIndex = 3;
        }

        // generate arrays
        while (match) {
            if (match[timeIndex] != undefined && match[labelIndex] != undefined) {
                timeStamps.push(timeToHHMMSS(match[timeIndex]));
                labels.push(match[labelIndex]);
            }
            match = regex.exec(description)
        }

        console.log(timeStamps);
        console.log(labels);

        let values = timetoSecondsIncreasing(timeStamps, labels);

        let timeStampsInSeconds = values.timeStampsInSeconds;
        labels = values.labels;
        timeStamps = values.timeStamps;

        // adding total video time.. for calcultaion purposes
        timeStampsInSeconds.push(getTimeInSeconds(timeToHHMMSS(totalTime)));

        console.log(`TIMESTAMPS: ${timeStamps}`);
        console.log(`LABELS: ${labels}`);
        console.log(`TIMESTAMPS IN SECONDS ${timeStampsInSeconds}`);

        labels = formatLabels(labels, timeIndex)

        let timeRatios = computeTimeRatios(timeStampsInSeconds);

        l = labels;
        tr = timeRatios
        ts = timeStampsInSeconds

        setTimeout(() => {
            generateUI(labels, timeRatios, timeStampsInSeconds);
        }, 0);

        return 1;
    }

    // supported time stamps...
    // 1) :45  2) 3:45  3) 03:45  4) :03:45  5) 0:03:45 5) 00:03:45
    // 5th is the format I need as as output from this functions
    function timeToHHMMSS(time) {
        // check if first character is ':' , add 00 if true
        if (time[0] == ':') {
            time = '00' + time;
        }
        switch (time.split(':').length) {
            case 3:
                return time;
            case 2:
                time = "00:" + time;
                return time
            default:
                console.log("NOT SUPPORTED");
        }
        return;
    }

    function timetoSecondsIncreasing(timeStamps, labels) {
        // convert the time array in seconds format
        let timeStampsInSeconds = timeStamps.map(time => {
            var a = time.split(':');
            var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
            return seconds
        });
        console.log(timeStampsInSeconds);

        // check if the array is increasing //maybe check for all values
        // for now this is fine
        if (timeStampsInSeconds[0] < timeStampsInSeconds[1]) {
            // sequnce is increasing
            // do nothing
            return {
                timeStampsInSeconds: timeStampsInSeconds,
                timeStamps: timeStamps,
                labels: labels
            };

        } else {
            return {
                timeStampsInSeconds: timeStampsInSeconds.reverse(),
                timeStamps: timeStamps.reverse(),
                labels: labels.reverse()
            };
        }
    }


    function formatLabels(labels, timeIndex) {
        let result = labels;
        if (timeIndex === 1) {
            // time -> label
            if (labels.every(s => s[0] == labels[0][0])) {
                result = labels.map(s => s.slice(1).trim());
            }
        }
        if (timeIndex === 4) {
            // label -> time
            if (labels.every(s => s[s.length - 1] == labels[0].slice(-1))) {
                result = labels.map(s => s.slice(0, -1).trim());
            }
        }
        console.log(result)

        return result
    }


    function computeTimeRatios(timeStampsInSeconds) {

        let timeStampRatios = [];
        // mulplipying by 2 just to make rations more visible
        for (let i = 0; i < timeStampsInSeconds.length - 1; ++i) {
            timeStampRatios[i] = ((timeStampsInSeconds[i + 1] - timeStampsInSeconds[i]) / timeStampsInSeconds[timeStampsInSeconds.length - 1]) * 2;
        }
        console.log(`RATIOS ${timeStampRatios}`);

        return timeStampRatios;
    }

    function generateUI(labels, timeStampRatios, timeStampsInSeconds) {
        // generate UI
        let divContainer = document.createElement("div");
        holder.appendChild(divContainer);
        divContainer.style.height = "70%";
        // divContainer.style.visibility = "hidden";
        divContainer.id = "my-container";

        let timeStampContainer = document.createElement("div");
        timeStampContainer.id = "tsc";
        // timeStampContainer.style.visibility = "hidden";
        let labelContainer = document.createElement("div");
        labelContainer.id = "lc"
            // labelContainer.style.visibility = "hidden";

        divContainer.appendChild(labelContainer);
        divContainer.appendChild(timeStampContainer);

        divContainer.addEventListener("mouseenter", e => {
            updateUI(timeStampsInSeconds);
            // divContainer.style.visibility = "visible";
            timeStampContainer.style.visibility = "visible";
            labelContainer.style.visibility = "visible";
        });

        // hide the container again when mouse leaves
        divContainer.addEventListener("mouseleave", e => {
            // reset visibility to hidden
            setTimeout(function() {
                timeStampContainer.style.visibility = "hidden";
                labelContainer.style.visibility = "hidden";
            }, 0.2 * 1000);

        })

        if (simpleUI) {
            // generate only labels for simple UI without timebars
            // no seek functionality
            labels.forEach((label, index) => {
                console.log(label)
                let height = "40px";
                let labelDiv = document.createElement("div");
                labelDiv.style.height = height;
                labelDiv.className = "label";
                labelDiv.innerHTML = '<span class="labeltext" id=labeltext' + index.toString() + '>' + label + '</span>';

                labelContainer.appendChild(labelDiv);
            });
        } else {
            // generate both labels and timebars
            // with seek functionality
            let divContainerHeight = divContainer.offsetHeight;
            let minLabelHeight = 10;
            // get height array using timestamRatios
            let heights = timeStampRatios.map(ratio => ratio * divContainerHeight);
            console.log(heights);

            // check if every height in heights array is(not) greater than minLabelHeight
            if (!(heights.every(height => height > minLabelHeight))) {
                heights = heights.map(height => height + 10);
            }
            console.log(heights);

            ///////////////////////////////////////////
            // labels and timebars are created here
            ///////////////////////////////////////////
            labels.forEach((label, index) => {
                // create labels
                let labelDiv = document.createElement("div");
                labelDiv.style.height = heights[index] + "px";
                labelDiv.className = "label";
                // labelDiv.innerHTML = '<span class="labeltext" id=labeltext' + index.toString() + '>' + label + '</span>';

                let labelTextSpan = document.createElement('span');
                labelTextSpan.className = "labeltext";
                labelTextSpan.id = "labeltext" + index.toString();
                labelTextSpan.innerText = label;
                labelTextSpan.setAttribute("data-seek", timeStampsInSeconds[index]);
                // code for seeking....
                labelTextSpan.addEventListener("click", (e) => {
                    console.log(e.target.dataset.seek);
                    ytPlayer.currentTime = parseInt(e.target.dataset.seek, 10);
                    updateUI(timeStampsInSeconds);
                });
                labelDiv.appendChild(labelTextSpan);

                // create timestamp UI
                let timeStampUI = document.createElement("div")
                timeStampUI.className = "timestamp";
                timeStampUI.style.width = "5px";
                timeStampUI.id = "ts" + index.toString();
                // console.log(divContainer.offsetHeight);
                timeStampUI.style.height = heights[index] + "px";
                // last time stamp
                if (index === labels.length - 1) {
                    // change color of the last tsUI to indicate end
                    console.log("MATCHHHHHHH");
                    timeStampUI.classList.add("ts-last-tsUI");
                }


                timeStampContainer.appendChild(timeStampUI);
                labelContainer.appendChild(labelDiv);
            });
        }
    }


    function updateUI(timeStampsInSeconds) {
        console.log(" in Update UI");

        allTimeStampsUI = document.querySelectorAll(".timestamp");
        allLabelText = document.querySelectorAll(".labeltext");

        // remove previously rendered labelsColors and timestamp color
        allTimeStampsUI.forEach(timeStampUI => {
            // console.log(timeStampUI);
            timeStampUI.style.backgroundColor = "rgb(85, 83, 83)";
        });
        allLabelText.forEach(labelText => {
            // console.log(labelText);
            labelText.style.backgroundColor = "black";
        });

        // render again
        // get current time
        // can also get time using iframePlayer API....
        // let currentTime = document.querySelector(".ytp-time-current").innerText;
        // currentTime = getTimeInSeconds(timeToHHMMSS(currentTime));
        currentTime = ytPlayer.currentTime
        console.log(currentTime);

        let currentTS = 0;
        // console.log(timeStampsInSeconds)
        for (let i = 0; i < timeStampsInSeconds.length; i++) {
            // console.log(timeStampsInSeconds[i]);
            if (timeStampsInSeconds[i] > currentTime) {
                // console.log(timeStampsInSeconds[i]);
                currentTS = i - 1;
                break;
            }
        }
        console.log(currentTS);
        // change UI color for topics which are done
        for (let i = 0; i <= currentTS; i++) {
            if (i == currentTS) {
                // this topic is still going on
                let labeltextid = "labeltext" + i.toString();
                document.getElementById(labeltextid).style.backgroundColor = labelColor;
                break;
            }
            if (!simpleUI) {
                let tsid = "ts" + i.toString();
                document.getElementById(tsid).style.backgroundColor = timeStampColor;
            }

        }

    }


    function displayNotFoundMessage() {
        let container = document.createElement("div");
        container.id = "ts-nfm-c";
        container.className = "ts-nfm-text"

        // main message
        let message = document.createElement("div");
        message.innerHTML = "<span>NO TIMESTAMPS FOUND</span>";
        message.id = "ts-nfm-mc";

        // error img
        let errorImg = document.createElement("div");
        errorImg.id = "ts-nfm-ei";
        let image = document.createElement("img");
        image.src = chrome.runtime.getURL("images/error.png");
        errorImg.appendChild(image);

        //button
        // TODO: add code to allow to submit timestamps
        let button = document.createElement("button");
        button.innerHTML = "ADD";
        button.onclick = function() { window.open('https://timeline-62fb9.web.app/', '_blank') };
        //div to remove this popup
        let removeDiv = document.createElement("div");
        removeDiv.id = "ts-nfm-rc"
        removeDiv.innerHTML = "close";
        removeDiv.addEventListener("click", e => {
            e.target.parentNode.remove();
        });

        container.appendChild(message);
        container.appendChild(errorImg);
        container.appendChild(button);
        container.appendChild(removeDiv);

        holder.appendChild(container);
    }

    function getTimeInSeconds(time) {
        var a = time.split(':');
        var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
        return seconds
    }

    function random_bg_color() {
        var x = Math.floor(Math.random() * 256);
        var y = Math.floor(Math.random() * 256);
        var z = Math.floor(Math.random() * 256);
        var bgColor = "rgb(" + x + "," + y + "," + z + ")";
        console.log(bgColor);
        return bgColor
    }

    // generate this when settings button is clicked
    function generateSettingsMenu() {
        //////////////////////////////////////////////
        // SETTINGS MENU CODE
        //////////////////////////////////////////////

        let TAsettingsMenu = document.createElement("div");
        TAsettingsMenu.id = "ts-taSettings";

        let styleContainer = document.createElement("div");
        styleContainer.id = "ts-styleContainer";

        let styleContainerHeading = document.createElement("div");
        styleContainerHeading.id = "ts-styleHeading";
        styleContainerHeading.className = "ts-collapsible";
        styleContainerHeading.innerText = "STYLE";

        let styleItemContainer = document.createElement("div");
        styleItemContainer.id = "ts-styleItemContainer"
        styleItemContainer.className = "ts-settings-content";


        let colorContainer = document.createElement("div");
        colorContainer.id = "ts-cc";

        let colorContainerHeading = document.createElement("div");
        colorContainerHeading.innerText = 'colors';
        colorContainerHeading.id = "ts-cch"

        let TSColorContainer = document.createElement("div");
        TSColorContainer.id = "ts-tscc";
        let TSName = document.createElement("div");
        TSName.innerText = "time bar";
        let TSInput = document.createElement("INPUT");
        TSInput.setAttribute("type", "color");
        TSInput.setAttribute("value", timeStampColor);
        TSInput.id = "ts-tsui-color";
        TSColorContainer.appendChild(TSName);
        TSColorContainer.appendChild(TSInput);

        let labelColorContainer = document.createElement("div");
        labelColorContainer.id = "ts-lcc";
        let labelName = document.createElement("div");
        labelName.innerText = "label";
        let labelInput = document.createElement("INPUT");
        labelInput.setAttribute("type", "color");
        labelInput.setAttribute("value", labelColor);
        labelInput.id = "ts-label-bg";
        labelColorContainer.appendChild(labelName)
        labelColorContainer.appendChild(labelInput);

        colorContainer.appendChild(colorContainerHeading);
        colorContainer.appendChild(TSColorContainer);
        colorContainer.appendChild(labelColorContainer);

        styleItemContainer.appendChild(colorContainer);

        styleContainer.appendChild(styleContainerHeading);
        styleContainer.appendChild(styleItemContainer);

        // divider
        let hr1 = document.createElement("hr");
        hr1.className = "ts-set-divider";

        // UI with graphics or Simple UI
        let optionsContainer = document.createElement("div");
        optionsContainer.id = "ts-set-oc";
        let displayOptionContainer = document.createElement("div");
        displayOptionContainer.className = "ts-set-doc";
        // text
        let t = document.createElement("div");
        t.innerText = "DISPLAY ONLY LABELS";
        t.id = "ts-set-pro";
        // radio button
        var x = document.createElement("INPUT");
        x.id = "ts-set-UIcheck"
        x.setAttribute("type", "checkbox");
        x.checked = simpleUI;

        let extraInfo = document.createElement("div")
        extraInfo.innerText = " ";


        displayOptionContainer.appendChild(t);
        displayOptionContainer.appendChild(x);

        optionsContainer.appendChild(displayOptionContainer);
        optionsContainer.appendChild(extraInfo)

        // divider
        let hr2 = document.createElement("hr");
        hr2.className = "ts-set-divider";

        // save button and close
        let buttonContainer = document.createElement("div");
        buttonContainer.id = "ts-set-bc";

        let saveSettingBtn = document.createElement("button");
        saveSettingBtn.innerText = "SAVE"
        saveSettingBtn.addEventListener("click", event => {
            // read values for various properties
            // currently just 2 values.... may incease in future

            let lColor = document.querySelector("#ts-label-bg").value;
            let tsUIColor = document.querySelector("#ts-tsui-color").value;
            let isSimple = document.querySelector("#ts-set-UIcheck").checked;
            console.log(lColor);
            let info = {
                lc: lColor,
                tsc: tsUIColor,
                simple: isSimple
            };

            // change current color values
            labelColor = lColor;
            timeStampColor = tsUIColor;
            simpleUI = isSimple;

            if (document.querySelector("#my-container")) {
                document.querySelector("#my-container").remove();
                generateUI(l, tr, ts);
            }

            // Save it using the Chrome extension storage API.
            chrome.storage.sync.set({ 'settingsInfo': info }, function() {
                // Notify that we saved.
                console.log('Settings saved');
            });
        });

        let closeButton = document.createElement("div");
        closeButton.id = "ts-set-close";
        closeButton.innerText = "\u2715";
        // add event lister to close the settings menu
        closeButton.addEventListener("click", () => {
            document.querySelector("#ts-model-maincontainer").remove();
        });

        buttonContainer.appendChild(saveSettingBtn);
        buttonContainer.appendChild(closeButton);

        TAsettingsMenu.appendChild(styleContainer);
        TAsettingsMenu.appendChild(hr1);
        TAsettingsMenu.appendChild(optionsContainer);
        TAsettingsMenu.appendChild(hr2);
        TAsettingsMenu.appendChild(buttonContainer);

        let modelContianer = document.createElement("div");
        modelContianer.id = "ts-model-maincontainer";

        modelContianer.appendChild(TAsettingsMenu);
        document.getElementsByTagName("body")[0].appendChild(modelContianer);
    }

    function addTimeStamps() {
        //create UI

        // main container
        let container = document.createElement("div");
        container.id = "ts-add-container";
        holder.appendChild(container);

        // Textarea container
        let textAreaContainer = document.createElement("TEXTAREA");
        textAreaContainer.id = "ts-add-tac";

        let ts = document.createElement("TEXTAREA");
        ts.id = "ts-add-ts";
        ts.setAttribute("placeholder", "TIMESTAMPS HERE");
        let tsResult = document.createElement("TEXTAREA");
        tsResult.id = "ts-add-ts-result";
        tsResult.style.display = "none";
        let hint = document.createElement("div");
        hint.id = "ts-add-hint";
        hint.style.display = "none";

        textAreaContainer.appendChild(ts);
        textAreaContainer.appendChild(tsResult);
        textAreaContainer.appendChild(hint);

        // button container
        let bc = document.createElement("div");
        bc.id = "ts-add-bc";

        let s = document.createElement("span");
        s.id = "ts-add-next-span";

        let next = document.createElement("button");
        next.id = "ts-add-next";
        next.className = "ts-add-button";
        next.style.verticalAlign = "middle";
        next.innerHTML = "<span>NEXT </span>";

        s.appendChild(next);

        let submit = document.createElement("button");
        submit.id = "ts-add-submit";
        submit.className = "ts-add-button";
        submit.style.verticalAlign = "middle";
        submit.style.visibility = "hidden";
        submit.innerHTML = "<span>SUBMIT </span>";

        bc.appendChild(s);
        bc.appendChild(submit);

        // add to container
        container.appendChild(textAreaContainer);
        container.appendChild(bc);
    }

})();