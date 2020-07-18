window.addEventListener('load', function() {
    // let commentsDiv = document.getElementById("comments");
    // let parentDiv = commentsDiv.parentNode;
    // get the data from textarea process it
    // populate timestamps array and label array

    console.log("hello");
    let holder = document.getElementById("holder");

    let string = `00:00:00  Introduction
                          00:00:15  Uncertainty
    00:04:52  Probability
    00:09:37  Conditional Probability
    00:17:19  Random Variables`

    let totalTime = "00:20:00"; // in seconds
    // this is what I will get as USER input after parsing regex
    let timeStamps = ["00:00:00", "00:00:15", "00:04:52", "00:09:37", "00:17:19"];
    // adding total video time.. for calcultaion purposes
    timeStamps.push(totalTime);

    let labels = ["Introduction", "Uncertainty", "Probability", "Conditional Probability", "Random Variables"];

    // convert the time array in seconds format
    const timeStampsInSeconds = timeStamps.map(time => {
        var a = time.split(':');
        var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
        return seconds
    });
    console.log(timeStampsInSeconds);
    let timeStampRatios = []

    for (let i = 0; i < timeStampsInSeconds.length - 1; ++i) {
        timeStampRatios[i] = (timeStampsInSeconds[i + 1] - timeStampsInSeconds[i]) / timeStampsInSeconds[timeStampsInSeconds.length - 1];
    }
    console.log(timeStampRatios)

    // generate UI
    let divContainer = document.createElement("div");
    divContainer.style.height = "70%";
    divContainer.id = "container";
    holder.appendChild(divContainer);

    labels.forEach((label, index) => {
        let labelDiv = document.createElement("div");
        labelDiv.className = "label";
        // console.log(divContainer.offsetHeight);
        labelDiv.style.height = (divContainer.offsetHeight * timeStampRatios[index]) + "px";
        labelDiv.style.backgroundColor = random_bg_color();
        divContainer.appendChild(labelDiv);
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