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

    // this is what I will get as USER input after parsing regex
    let timeStamps = ["00:00:00", "00:04:52", "00:09:37", "00:17:19"];
    let labels = ["Introduction", "Uncertainty", "Probability", "Conditional Probability", "Random Variables"];

    // convert the time array in seconds format
    const timeStampsInSeconds = timeStamps.map(time => {
        var a = time.split(':');
        var seconds = parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10);
        return seconds
    });

    console.log(timeStampsInSeconds)

    // generate UI
    let divContainer = document.createElement("div");
    divContainer.style.height = "70%";
    divContainer.id = "container";
    holder.appendChild(divContainer);

    labels.forEach(label => {
        let labelDiv = document.createElement("div");
        labelDiv.className = "label";
        // offset height includes border and padding 
        // setting the height of each labelDiv same for the time being
        // TODO later: change this based on the timestamps
        console.log(divContainer.offsetHeight);
        console.log(labels.length)
        console.log(divContainer.offsetHeight / labels.length);
        labelDiv.style.height = divContainer.offsetHeight / labels.length + "px";
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