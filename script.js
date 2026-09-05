const videoInput = document.getElementById("videoInput");
const fileName = document.getElementById("fileName");

const sourceVideo = document.getElementById("sourceVideo");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");

const depthSlider = document.getElementById("depth");
const strengthSlider = document.getElementById("strength");

const depthValue = document.getElementById("depthValue");
const strengthValue = document.getElementById("strengthValue");

const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const stopButton = document.getElementById("stopButton");

const exportButton = document.getElementById("exportButton");

const resultCard = document.getElementById("resultCard");
const downloadButton = document.getElementById("downloadButton");

let videoURL = null;
let animationFrame = null;

let mediaRecorder = null;
let recordedChunks = [];


// ========================================
// VIDEO KIEZEN
// ========================================

videoInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    console.log("Video gekozen:", file.name);

    fileName.textContent = "Gekozen: " + file.name;

    statusText.textContent = "Video wordt geladen...";

    // Oude URL opruimen
    if (videoURL) {
        URL.revokeObjectURL(videoURL);
    }

    videoURL = URL.createObjectURL(file);

    sourceVideo.src = videoURL;

    sourceVideo.load();

    resultCard.classList.add("hidden");
});


// ========================================
// VIDEO GELADEN
// ========================================

sourceVideo.addEventListener("loadedmetadata", function () {

    canvas.width = sourceVideo.videoWidth;
    canvas.height = sourceVideo.videoHeight;

    statusText.textContent =
        "Video geladen: " +
        sourceVideo.videoWidth +
        " × " +
        sourceVideo.videoHeight;

    drawFrame();
});


// ========================================
// VIDEO FOUT
// ========================================

sourceVideo.addEventListener("error", function () {

    statusText.textContent =
        "Deze video kan niet door je browser worden afgespeeld.";

    alert(
        "De video kan niet worden afgespeeld.\n\n" +
        "Probeer bijvoorbeeld een MP4-video met H.264."
    );

});


// ========================================
// INSTELLINGEN
// ========================================

depthSlider.addEventListener("input", function () {
    depthValue.textContent = this.value;

    if (sourceVideo.readyState >= 2) {
        drawFrame();
    }
});

strengthSlider.addEventListener("input", function () {
    strengthValue.textContent =
        Number(this.value).toFixed(1);

    if (sourceVideo.readyState >= 2) {
        drawFrame();
    }
});


// ========================================
// 3D FRAME MAKEN
// ========================================

function drawFrame() {

    if (!sourceVideo.videoWidth || !sourceVideo.videoHeight) {
        return;
    }

    const width = sourceVideo.videoWidth;
    const height = sourceVideo.videoHeight;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const depth =
        Number(depthSlider.value);

    const strength =
        Number(strengthSlider.value);

    // Tijdelijke canvassen
    const leftCanvas =
        document.createElement("canvas");

    const rightCanvas =
        document.createElement("canvas");

    leftCanvas.width = width;
    leftCanvas.height = height;

    rightCanvas.width = width;
    rightCanvas.height = height;

    const leftCtx =
        leftCanvas.getContext("2d");

    const rightCtx =
        rightCanvas.getContext("2d");


    // Linkerbeeld
    leftCtx.drawImage(
        sourceVideo,
        -depth * strength,
        0,
        width,
        height
    );


    // Rechterbeeld
    rightCtx.drawImage(
        sourceVideo,
        depth * strength,
        0,
        width,
        height
    );


    const leftImage =
        leftCtx.getImageData(
            0,
            0,
            width,
            height
        );

    const rightImage =
        rightCtx.getImageData(
            0,
            0,
            width,
            height
        );

    const output =
        ctx.createImageData(
            width,
            height
        );


    // ====================================
    // ROOD / CYAAN
    // ====================================

    for (
        let i = 0;
        i < output.data.length;
        i += 4
    ) {

        // Rood uit linkerbeeld
        output.data[i] =
            leftImage.data[i];

        // Groen + blauw uit rechterbeeld
        output.data[i + 1] =
            rightImage.data[i + 1];

        output.data[i + 2] =
            rightImage.data[i + 2];

        output.data[i + 3] = 255;
    }


    ctx.putImageData(output, 0, 0);
}


// ========================================
// AFSPelen
// ========================================

playButton.addEventListener("click", function () {

    if (!sourceVideo.src) {
        alert("Kies eerst een video.");
        return;
    }

    sourceVideo.play();

    startRendering();
});


// ========================================
// PAUZE
// ========================================

pauseButton.addEventListener("click", function () {

    sourceVideo.pause();

    stopRendering();

    drawFrame();
});


// ========================================
// STOP
// ========================================

stopButton.addEventListener("click", function () {

    sourceVideo.pause();

    sourceVideo.currentTime = 0;

    stopRendering();

    drawFrame();
});


// ========================================
// RENDER LOOP
// ========================================

function startRendering() {

    stopRendering();

    function render() {

        drawFrame();

        if (!sourceVideo.paused && !sourceVideo.ended) {

            animationFrame =
                requestAnimationFrame(render);

        }
    }

    render();
}


function stopRendering() {

    if (animationFrame) {

        cancelAnimationFrame(animationFrame);

        animationFrame = null;
    }
}


// ========================================
// VIDEO EINDE
// ========================================

sourceVideo.addEventListener("ended", function () {

    stopRendering();

    drawFrame();

});


// ========================================
// EXPORTEREN
// ========================================

exportButton.addEventListener("click", async function () {

    if (!sourceVideo.src) {

        alert("Kies eerst een video.");

        return;
    }

    if (!canvas.captureStream) {

        alert(
            "Je browser ondersteunt het maken van video's niet."
        );

        return;
    }


    exportButton.disabled = true;

    exportButton.textContent =
        "⏳ Video wordt gemaakt...";


    recordedChunks = [];


    const canvasStream =
        canvas.captureStream(30);


    let mimeType = "";


    if (
        MediaRecorder.isTypeSupported(
            "video/webm;codecs=vp9"
        )
    ) {

        mimeType =
            "video/webm;codecs=vp9";

    } else if (
        MediaRecorder.isTypeSupported(
            "video/webm;codecs=vp8"
        )
    ) {

        mimeType =
            "video/webm;codecs=vp8";

    } else {

        mimeType = "video/webm";
    }


    try {

        mediaRecorder =
            new MediaRecorder(
                canvasStream,
                {
                    mimeType: mimeType
                }
            );

    } catch (error) {

        console.error(error);

        alert(
            "Je browser kan geen video opnemen."
        );

        exportButton.disabled = false;

        exportButton.textContent =
            "🎞️ 3D-video maken";

        return;
    }


    mediaRecorder.ondataavailable =
        function (event) {

            if (event.data.size > 0) {

                recordedChunks.push(
                    event.data
                );
            }
        };


    mediaRecorder.onstop =
        function () {

            const blob =
                new Blob(
                    recordedChunks,
                    {
                        type: "video/webm"
                    }
                );


            const url =
                URL.createObjectURL(blob);


            downloadButton.href = url;

            downloadButton.download =
                "3D-anaglyph-video.webm";


            resultCard.classList.remove(
                "hidden"
            );


            statusText.textContent =
                "3D-video klaar!";


            exportButton.disabled = false;

            exportButton.textContent =
                "🎞️ 3D-video maken";
        };


    // Vanaf het begin
    sourceVideo.currentTime = 0;


    sourceVideo.onseeked = function () {

        sourceVideo.onseeked = null;

        mediaRecorder.start();


        sourceVideo.play();

        startRendering();


        const checkEnd =
            setInterval(function () {

                if (
                    sourceVideo.ended ||
                    sourceVideo.currentTime >=
                    sourceVideo.duration - 0.05
                ) {

                    clearInterval(checkEnd);

                    sourceVideo.pause();

                    stopRendering();

                    mediaRecorder.stop();
                }

            }, 100);
    };

});
