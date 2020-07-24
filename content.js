window.addEventListener('load', function() {
    // let commentsDiv = document.getElementById("comments");
    // let parentDiv = commentsDiv.parentNode;
    // get the data from textarea process it
    // populate timestamps array and label array

    let labelColor = "blue";
    let timeStampColor = "#FF7F50";
    console.log("hello");

    // regex to get the timestamps
    const regex = /^(?:(\d{2}:\d{2}:\d{2}) *[-:]? *([A-Z\d].*)|([A-Z\d].*)(?<![ :-]) *[-:]? *(\d{2}-\d{2}-\d{4}))$/gmi;

    let holder = document.getElementById("player-container").querySelector("#container").querySelector("#movie_player");
    console.log(holder.offsetHeight);

    // add a button to the screen
    // clicking on that would open the timestamp UI 
    let activateButton = document.createElement("div");
    activateButton.id = "activate-ext";
    activateButton.addEventListener("click", getData);
    holder.appendChild(activateButton);

    function getData() {
        // get the tags from description
        let description = document.querySelector("#description").textContent;
        let totalTime = document.querySelector(".ytp-time-duration").innerText;
        console.log(description);
        console.log(totalTime);

        let match = regex.exec(description);
        // console.log(match);

        let timeStamps = [];
        let labels = [];

        let timeIndex;
        let labelIndex;

        if (match[1] != undefined) {
            timeIndex = 1;
            labelIndex = 2;
        } else {
            timeIndex = 3;
            labelIndex = 4;
        }

        // generate arrays
        while (match) {
            timeStamps.push(match[timeIndex]);
            labels.push(match[labelIndex]);
            match = regex.exec(description)
        }

        // adding total video time.. for calcultaion purposes
        timeStamps.push(totalTime);

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
                console.log(timeStampUI);
                timeStampUI.style.backgroundColor = "rgb(85, 83, 83)";
            });
            allLabelText.forEach(labelText => {
                console.log(labelText);
                labelText.style.backgroundColor = "black";
            });

            // render again

            // get current time
            let currentTime = document.querySelector(".ytp-time-current").innerText;
            currentTime = getTimeInSeconds(currentTime);
            console.log(currentTime);
            let currentTS = 0;
            // console.log(timeStampsInSeconds)
            for (let i = 0; i < timeStampsInSeconds.length; i++) {
                console.log(timeStampsInSeconds[i]);
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

    function computeTimeRatios(timeStamps) {
        // get all labels and timestamps and set thei background color to default

        // convert the time array in seconds format
        let timeStampsInSeconds = timeStamps.map(time => {
            var a = time.split(':');
            var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
            return seconds
        });
        console.log(timeStampsInSeconds);

        let timeStampRatios = []
        for (let i = 0; i < timeStampsInSeconds.length - 1; ++i) {
            timeStampRatios[i] = (timeStampsInSeconds[i + 1] - timeStampsInSeconds[i]) / timeStampsInSeconds[timeStampsInSeconds.length - 1];
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
        divContainer.style.height = "80%";
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