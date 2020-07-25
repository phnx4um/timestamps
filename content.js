window.addEventListener('load', function() {


    // get these values from the chrome storage..if present 
    // otherwise these are the default values
    let labelColor = "blue";
    let timeStampColor = "#FF7F50";

    console.log("hello");
    // regex to get the timestamps // improve ... these are cases when this will not work..
    const regex = /^(?:((?:\d{1,2}:)?(?:\d{1,2}:)?\d{1,2}) *[-:]? *([A-Z\d].*)|([A-Z\d].*)(?<![ :-]) *[-:]? *(\d{2}-\d{2}-\d{4}))$/gmi;

    chrome.storage.sync.get(['settingsInfo'], function(data) {
        // check if data exists.
        if (data) {
            console.log(data);
            labelColor = data.settingsInfo.lc;
            timeStampColor = data.settingsInfo.tsc;
            console.log(labelColor, timeStampColor);
        }
    });

    let holder = document.getElementById("player-container").querySelector("#container").querySelector("#movie_player");
    console.log(holder.offsetHeight);

    // add a button to the screen
    // clicking on that would open the timestamp UI 
    let activateButton = document.createElement("div");
    activateButton.id = "activate-ext";
    activateButton.addEventListener("click", getData);
    holder.appendChild(activateButton);


    TAsettingsMenu = document.createElement("div");
    TAsettingsMenu.id = "ts-taSettings";


    // later generate this using shadow dom...
    // and add textarea for user input too.....    
    TAsettingsMenu.innerHTML = `
        <button class="ts-collapsible">Open Collapsible</button>
        <div class="ts-settings-content"> 
            <div>
                <input type="color" id="ts-label-bg" name="label"
                    value="#e66465">
                <label for="ts-label-bg">LABEL</label>
            </div>

            <div>
                <input type="color" id="ts-tsui-color" name="tsUI"
                        value="#f6b73c">
                <label for="ts-tsui-color">TimeStampUI</label>
            </div>

            <button id="ts-submitBtn-setting">SUBMIT</button>
        </div>
    `;

    let videoMetaInfo = document.getElementById("meta");
    videoMetaInfo.parentNode.insertBefore(TAsettingsMenu, videoMetaInfo);

    let coll = document.getElementsByClassName("ts-collapsible")[0];
    console.log(coll);
    coll.addEventListener("click", function() {
        this.classList.toggle("ts-active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = "200px";
        }
    });

    let settingsButton = document.querySelector("#ts-submitBtn-setting");
    settingsButton.addEventListener("click", event => {
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


    function getData() {
        // get data from description
        let description = document.querySelector("#description").textContent;
        let totalTime = document.querySelector(".ytp-time-duration").innerText;
        console.log(description);
        console.log(totalTime);

        let match = regex.exec(description);
        // console.log(match);
        if (match === null) {
            console.log("Sorry No timestamps found");
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

        generateUI(labels, timeRatios);

        holder.addEventListener("mouseenter", e => {
            // back to original state
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
                let tsid = "ts" + i.toString();
                document.getElementById(tsid).style.backgroundColor = timeStampColor;
            }

            // divContainer.style.visibility = "visible";

            // // reset visibility to hidden
            // setTimeout(function() {
            //     divContainer.style.visibility = "hidden";
            // }, 2000);
        });

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

    function generateUI(labels, timeStampRatios) {
        // generate UI
        let divContainer = document.createElement("div");
        holder.appendChild(divContainer);
        divContainer.style.height = "70%";
        // divContainer.style.visibility = "hidden";
        divContainer.id = "my-container";


        let timeStampContainer = document.createElement("div");
        timeStampContainer.id = "tsc";
        let labelContainer = document.createElement("div");
        labelContainer.id = "lc"

        divContainer.appendChild(labelContainer);
        divContainer.appendChild(timeStampContainer);

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

    function random_bg_color() {
        var x = Math.floor(Math.random() * 256);
        var y = Math.floor(Math.random() * 256);
        var z = Math.floor(Math.random() * 256);
        var bgColor = "rgb(" + x + "," + y + "," + z + ")";
        console.log(bgColor);
        return bgColor
    }

    function getTimeInSeconds(time) {
        var a = time.split(':');
        var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
        return seconds
    }
});