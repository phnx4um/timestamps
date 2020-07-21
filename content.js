window.addEventListener('load', function() {
    // let commentsDiv = document.getElementById("comments");
    // let parentDiv = commentsDiv.parentNode;
    // get the data from textarea process it
    // populate timestamps array and label array

    let labelColor = "red";
    let timeStampColor = "#FF7F50";
    console.log("hello");
    let holder = document.getElementById("holder");
    holder.addEventListener("mouseenter", e => {
        // get this from youtube
        let currentTime = "500"; // in seconds
        let currentTS;
        console.log(timeStampsInSeconds)
        for (let i = 0; i < timeStampsInSeconds.length; i++) {
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

    // we will be getting this from textarea
    let string = `00:00:00  Introduction
                    00:00:15  Uncertainty
                    00:04:52  Probability
                    00:09:37  Conditional Probability
                    00:17:19  Random Variables`;


    let totalTime = "00:20:00";

    // this is what I will get as USER input after parsing regex
    let timeStamps = ["00:00:00", "00:01:15", "00:04:52", "00:09:37", "00:17:19"];
    // adding total video time.. for calcultaion purposes
    timeStamps.push(totalTime);
    let labels = ["Introduction", "Uncertainty", "Probability", "Conditional Probability", "Random Variables"];

    // convert the time array in seconds format
    const timeStampsInSeconds = timeStamps.map(time => {
        var a = time.split(':');
        var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
        return seconds
    });
    // console.log(timeStampsInSeconds);
    let timeStampRatios = []
    for (let i = 0; i < timeStampsInSeconds.length - 1; ++i) {
        timeStampRatios[i] = (timeStampsInSeconds[i + 1] - timeStampsInSeconds[i]) / timeStampsInSeconds[timeStampsInSeconds.length - 1];
    }
    console.log(timeStampRatios)

    // generate UI
    let divContainer = document.createElement("div");
    divContainer.style.height = "80%";
    // divContainer.style.visibility = "hidden";
    divContainer.id = "container";

    let timeStampContainer = document.createElement("div");
    timeStampContainer.id = "tsc";
    let labelContainer = document.createElement("div");
    labelContainer.id = "lc"

    divContainer.appendChild(labelContainer);
    divContainer.appendChild(timeStampContainer);

    holder.appendChild(divContainer);

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

    function random_bg_color() {
        var x = Math.floor(Math.random() * 256);
        var y = Math.floor(Math.random() * 256);
        var z = Math.floor(Math.random() * 256);
        var bgColor = "rgb(" + x + "," + y + "," + z + ")";
        console.log(bgColor);
        return bgColor
    }

});