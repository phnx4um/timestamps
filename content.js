(function() {

    // get these values from the chrome storage..if present 
    // otherwise these are the default values
    let labelColor = "blue";
    let timeStampColor = "#FF7F50";
    let isPresentInDB = false;
    let videoInfo;
    let simpleUI = false;
    let holder;
    const regWatch = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/watch\?+/gm;

    // regex to get the timestamps // improve ... these are cases when this will not work..
    const regex = /^(?:((?:\d{1,2}:)?(?:\d{1,2}:)?\d{1,2}) *[-:]? *([A-Z\d].*)|([A-Z\d].*)(?<![ :-]) *[-:]? *(\d{2}-\d{2}-\d{4}))$/gmi;

    if (!((location.href).match(regWatch))) return;

    console.log(`ispresentDB ${isPresentInDB}`);
    chrome.runtime.onMessage.addListener(
        function(request) {
            console.log(request);
            // check what the firebase sends if data is not found
            if (request) {
                isPresentInDB = true;
                console.log(`ispresentDB in eventlistener ${isPresentInDB}`);
                videoInfo = request;
            }
        }
    );

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
            if (data.settingsInfo) {
                console.log(data);
                labelColor = data.settingsInfo.lc;
                timeStampColor = data.settingsInfo.tsc;
                console.log(labelColor, timeStampColor);
            }
        });

        // get data for the first time
        chrome.runtime.sendMessage({ data: true }, function(response) {
            console.log(response.data);
            if (response.data) {
                isPresentInDB = true;
                videoInfo = response.data;
            }
        });

        setTimeout(() => {
            holder = document.getElementById("player-container").querySelector("#container").querySelector("#movie_player");
            console.log(holder.offsetHeight);

            createMainUI()

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

        uiContainer.appendChild(settingImage)
        uiContainer.appendChild(image)

        holder.appendChild(uiContainer)

    }

    function displayUI() {
        if (isPresentInDB) {
            // present in database
            // directly generate UI
            generateUI(videoInfo["labels"], videoInfo["time-ratios"], videoInfo["time-stamps"]);
        } else {
            // get data from the description
            // and then generate UI
            getData();
        }
    }


    function getData() {
        // get data from description
        let description = document.querySelector("#description").textContent;
        let totalTime = document.querySelector(".ytp-time-duration").innerText;
        console.log(description);
        console.log(totalTime);

        let match = regex.exec(description);
        // console.log(match);
        if (match === null) {
            //////////////////////////////////////////////////////
            // no data found
            // dislay a message requesting to generate time-stamps
            //////////////////////////////////////////////////////
            console.log("Sorry No timestamps found");
            if (!document.querySelector("#ts-nfm-c")) {
                displayNotFoundMessage();
            }
            return 0;
        }

        let timeStamps = [];
        let labels = [];

        let timeIndex;
        let labelIndex;

        if (match[1] != undefined) {
            timeIndex = 1;
            labelIndex = 2;
        } else {
            timeIndex = 4;
            labelIndex = 3;
        }


        // generate arrays
        while (match) {
            timeStamps.push(timeToHHMMSS(match[timeIndex]));
            labels.push(match[labelIndex]);
            match = regex.exec(description)
        }

        // adding total video time.. for calcultaion purposes
        timeStamps.push(timeToHHMMSS(totalTime));

        console.log(timeStamps);
        console.log(labels);

        let values = computeTimeRatios(timeStamps);
        let timeStampsInSeconds = values.timeStampsInSeconds;
        let timeRatios = values.timeStampRatios;

        setTimeout(() => {
            generateUI(labels, timeRatios, timeStampsInSeconds);
        }, 0);
    }

    function timeToHHMMSS(time) {
        switch (time.split(':').length) {
            case 3:
                return time;
            case 2:
                time = "00:" + time;
                return time
            case 1:
                time = "00:00:" + time;
                break;
            default:
                console.log("NOT SUPPORTED");
        }
        return time;
    }

    function computeTimeRatios(timeStamps) {
        // get all labels and timestamps and set thei background color to default

        // convert the time array in seconds format
        let timeStampsInSeconds = timeStamps.map(time => {
            var a = time.split(':');
            var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
            return seconds
        });
        console.log(timeStampsInSeconds);

        let timeStampRatios = [];
        // mulplipying by 2 just to make rations more visible
        for (let i = 0; i < timeStampsInSeconds.length - 1; ++i) {
            timeStampRatios[i] = ((timeStampsInSeconds[i + 1] - timeStampsInSeconds[i]) / timeStampsInSeconds[timeStampsInSeconds.length - 1]) * 2;
        }
        console.log(timeStampRatios);

        return {
            timeStampsInSeconds: timeStampsInSeconds,
            timeStampRatios: timeStampRatios,
        };
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
        timeStampContainer.style.visibility = "hidden";
        let labelContainer = document.createElement("div");
        labelContainer.id = "lc"
        labelContainer.style.visibility = "hidden";

        divContainer.appendChild(labelContainer);
        divContainer.appendChild(timeStampContainer);

        divContainer.addEventListener("mouseenter", e => {
            // remove previously rendered labelsColors and timestamp color
            allTimeStampsUI = document.querySelectorAll(".timestamp");
            allLabelText = document.querySelectorAll(".labeltext");

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
            let currentTime = document.querySelector(".ytp-time-current").innerText;
            currentTime = getTimeInSeconds(timeToHHMMSS(currentTime));
            console.log(currentTime);
            let currentTS = 0;
            // console.log(timeStampsInSeconds)
            for (let i = 0; i < timeStampsInSeconds.length; i++) {
                // console.log(timeStampsInSeconds[i]);
                if (timeStampsInSeconds[i] >= currentTime) {
                    currentTS = i;
                    break;
                }
            }
            // change UI color for topics which are done
            for (let i = 0; i < currentTS; i++) {
                if (i == (currentTS - 1)) {
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
            labels.forEach((label, index) => {
                let height = (divContainer.offsetHeight * timeStampRatios[index]) + "px";
                console.log(height);
                // create labels
                let labelDiv = document.createElement("div");
                labelDiv.style.height = height;
                labelDiv.className = "label";
                labelDiv.innerHTML = '<span class="labeltext" id=labeltext' + index.toString() + '>' + label + '</span>';

                // create timestamp UI
                let timeStampUI = document.createElement("div")
                timeStampUI.className = "timestamp";
                timeStampUI.style.width = "5px";
                timeStampUI.id = "ts" + index.toString();
                // console.log(divContainer.offsetHeight);
                timeStampUI.style.height = height;
                // timeStampUI.style.backgroundColor = random_bg_color();

                timeStampContainer.appendChild(timeStampUI);
                labelContainer.appendChild(labelDiv);
            });
        }


    }

    function getTimeInSeconds(time) {
        var a = time.split(':');
        var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
        return seconds
    }

    function displayNotFoundMessage() {
        let container = document.createElement("div");
        container.id = "ts-nfm-c";
        container.className = "ts-nfm-text"

        // main message
        let message = document.createElement("div");
        message.innerHTML = "<span>NO TIMESTAMPS FOUND</span>";
        message.id = "ts-nfm-mc";

        // secondary message
        let addMessage = document.createElement("div");
        addMessage.id = "ts-nfc-amc"
        addMessage.innerHTML = "want to help";

        //button
        // TODO: add code to allow to submit timestamps
        let button = document.createElement("button");
        button.innerHTML = "SURE"

        //div to remove this popup
        let removeDiv = document.createElement("div");
        removeDiv.id = "ts-nfm-rc"
        removeDiv.innerHTML = "close";
        removeDiv.addEventListener("click", e => {
            e.target.parentNode.remove();
        });

        container.appendChild(message);
        container.appendChild(addMessage);
        container.appendChild(button);
        container.appendChild(removeDiv);

        holder.appendChild(container);
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
        TSInput.setAttribute("value", "#e66465");
        TSInput.id = "ts-tsui-color";
        TSColorContainer.appendChild(TSName);
        TSColorContainer.appendChild(TSInput);

        let labelColorContainer = document.createElement("div");
        labelColorContainer.id = "ts-lcc";
        let labelName = document.createElement("div");
        labelName.innerText = "label";
        let labelInput = document.createElement("INPUT");
        labelInput.setAttribute("type", "color");
        labelInput.setAttribute("value", "#e66465");
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

        // save button and close 
        let buttonContainer = document.createElement("div");
        buttonContainer.id = "ts-set-bc";

        let saveSettingBtn = document.createElement("button");
        saveSettingBtn.innerText = "SAVE"
        saveSettingBtn.addEventListener("click", event => {
            let labelColor = document.querySelector("#ts-label-bg").value;
            let tsUIColor = document.querySelector("#ts-tsui-color").value;
            console.log(labelColor);
            let info = {
                lc: labelColor,
                tsc: tsUIColor
            };
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

        buttonContainer.appendChild(saveSettingBtn);
        buttonContainer.appendChild(closeButton);

        TAsettingsMenu.appendChild(styleContainer);
        TAsettingsMenu.appendChild(hr1);
        TAsettingsMenu.appendChild(buttonContainer);

        let modelContianer = document.createElement("div");
        modelContianer.id = "ts-model-maincontainer";

        modelContianer.appendChild(TAsettingsMenu);
        document.getElementsByTagName("body")[0].appendChild(modelContianer);
    }

})();