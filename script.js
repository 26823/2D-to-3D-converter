```javascript
/*
    3D ANAGLYPH VIDEO CONVERTER
    ----------------------------

    Werkt volledig lokaal in de browser.

    Linkeroog  = rood kanaal
    Rechteroog = groen + blauw kanaal

    De tweede oogpositie wordt gemaakt door
    het beeld horizontaal te verschuiven.
*/


const videoInput = document.getElementById("videoInput");
const selectButton = document.getElementById("selectButton");
const uploadBox = document.getElementById("uploadBox");

const editor = document.getElementById("editor");

const sourceVideo = document.getElementById("sourceVideo");
const canvas = document.getElementById("previewCanvas");

const ctx = canvas.getContext("2d", {
    willReadFrequently: true
});

const videoPlaceholder =
    document.getElementById("videoPlaceholder");

const playButton =
    document.getElementById("playButton");

const pauseButton =
    document.getElementById("pauseButton");

const stopButton =
    document.getElementById("stopButton");

const exportButton =
    document.getElementById("exportButton");

const resetButton =
    document.getElementById("resetButton");

const depthSlider =
    document.getElementById("depth");

const strengthSlider =
    document.getElementById("strength");

const qualitySelect =
    document.getElementById("quality");

const depthValue =
    document.getElementById("depthValue");

const strengthValue =
    document.getElementById("strengthValue");

const statusElement =
    document.getElementById("status");

const progressSection =
    document.getElementById("progressSection");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const progressStatus =
    document.getElementById("progressStatus");

const result =
    document.getElementById("result");

const downloadButton =
    document.getElementById("downloadButton");


let videoURL = null;
let exportedURL = null;

let animationFrame = null;

let isRendering = false;


/* --------------------------------------------------
   FILE UPLOAD
-------------------------------------------------- */

selectButton.addEventListener("click", () => {
    videoInput.click();
});


videoInput.addEventListener("change", () => {

    if (!videoInput.files.length) {
        return;
    }

    loadVideo(videoInput.files[0]);
});


/* Drag & Drop */

uploadBox.addEventListener("dragover", event => {

    event.preventDefault();

    uploadBox.classList.add("dragover");
});


uploadBox.addEventListener("dragleave", () => {

    uploadBox.classList.remove("dragover");
});


uploadBox.addEventListener("drop", event => {

    event.preventDefault();

    uploadBox.classList.remove("dragover");

    const files = event.dataTransfer.files;

    if (!files.length) {
        return;
    }

    const file = files[0];

    if (!file.type.startsWith("video/")) {

        alert("Kies een videobestand.");

        return;
    }

    loadVideo(file);
});


/* --------------------------------------------------
   LOAD VIDEO
-------------------------------------------------- */

function loadVideo(file) {

    if (videoURL) {
        URL.revokeObjectURL(videoURL);
    }

    videoURL = URL.createObjectURL(file);

    sourceVideo.src = videoURL;

    sourceVideo.load();

    editor.style.display = "grid";

    videoPlaceholder.style.display = "none";

    canvas.style.display = "block";

    exportButton.disabled = false;

    statusElement.textContent = "Video geladen";

    result.style.display = "none";

    progressSection.style.display = "none";

    sourceVideo.addEventListener(
        "loadedmetadata",
        setupVideo,
        {
            once: true
        }
    );
}


/* --------------------------------------------------
   VIDEO SETUP
-------------------------------------------------- */

function setupVideo() {

    const maxWidth = 1280;

    let width = sourceVideo.videoWidth;
    let height = sourceVideo.videoHeight;

    if (width > maxWidth) {

        const scale = maxWidth / width;

        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    renderFrame();

    statusElement.textContent =
        `${formatTime(sourceVideo.duration)} video`;
}


/* --------------------------------------------------
   ANAGLYPH RENDERING
-------------------------------------------------- */

function renderFrame() {

    if (!sourceVideo.videoWidth) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    const depth =
        Number(depthSlider.value);

    const strength =
        Number(strengthSlider.value) / 100;


    /*
        We maken eerst een normale afbeelding.

        Daarna halen we de kleurkanalen
        van verschillende horizontale posities.
    */

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /*
        Linkeroog.

        We tekenen het originele beeld
        iets naar links/rechts.
    */

    const leftOffset =
        Math.round(depth * strength);

    const rightOffset =
        Math.round(depth * strength);


    /*
        We hebben tijdelijke canvassen nodig
        om de twee oogbeelden te maken.
    */

    const leftCanvas =
        getTempCanvas(width, height);

    const rightCanvas =
        getTempCanvas(width, height);


    const leftCtx =
        leftCanvas.getContext("2d");

    const rightCtx =
        rightCanvas.getContext("2d");


    leftCtx.drawImage(
        sourceVideo,
        -leftOffset,
        0,
        width,
        height
    );


    rightCtx.drawImage(
        sourceVideo,
        rightOffset,
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


    const l =
        leftImage.data;

    const r =
        rightImage.data;

    const o =
        output.data;


    /*
        Anaglyph:

        R = linkerbeeld rood
        G = rechterbeeld groen
        B = rechterbeeld blauw
    */

    for (
        let i = 0;
        i < o.length;
        i += 4
    ) {

        o[i] =
            l[i];

        o[i + 1] =
            r[i + 1];

        o[i + 2] =
            r[i + 2];

        o[i + 3] =
            255;
    }


    ctx.putImageData(
        output,
        0,
        0
    );
}


/*
    Temp canvas wordt hergebruikt zodat
    we niet iedere frame een nieuw canvas
    hoeven te maken.
*/

let tempLeft = null;
let tempRight = null;


function getTempCanvas(width, height) {

    /*
        Deze functie wordt hieronder
        vervangen door aparte canvassen.
    */

    if (!tempLeft) {

        tempLeft =
            document.createElement("canvas");

        tempRight =
            document.createElement("canvas");
    }

    /*
        We bepalen via de aanroeper
        welk canvas nodig is.

        De eerste call is links,
        de tweede rechts.
    */

    if (
        !tempLeft.width ||
        tempLeft.width !== width ||
        tempLeft.height !== height
    ) {

        tempLeft.width = width;
        tempLeft.height = height;

        tempRight.width = width;
        tempRight.height = height;

        getTempCanvas.counter = 0;
    }


    getTempCanvas.counter =
        (getTempCanvas.counter || 0) + 1;


    return getTempCanvas.counter % 2 === 1
        ? tempLeft
        : tempRight;
}


/*
    Omdat renderFrame twee keer getTempCanvas
    aanroept, moeten we de teller iedere frame
    opnieuw starten.
*/

const originalRenderFrame = renderFrame;


/* --------------------------------------------------
   BETERE FRAME RENDERER
-------------------------------------------------- */

function renderAnaglyph() {

    if (!sourceVideo.videoWidth) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    const depth =
        Number(depthSlider.value);

    const strength =
        Number(strengthSlider.value) / 100;

    const offset =
        Math.round(depth * strength);


    if (!tempLeft) {

        tempLeft =
            document.createElement("canvas");

        tempRight =
            document.createElement("canvas");
    }


    if (
        tempLeft.width !== width ||
        tempLeft.height !== height
    ) {

        tempLeft.width = width;
        tempLeft.height = height;

        tempRight.width = width;
        tempRight.height = height;
    }


    const leftCtx =
        tempLeft.getContext("2d");

    const rightCtx =
        tempRight.getContext("2d");


    /*
        Links
    */

    leftCtx.clearRect(
        0,
        0,
        width,
        height
    );

    leftCtx.drawImage(
        sourceVideo,
        -offset,
        0,
        width,
        height
    );


    /*
        Rechts
    */

    rightCtx.clearRect(
        0,
        0,
        width,
        height
    );

    rightCtx.drawImage(
        sourceVideo,
        offset,
        0,
        width,
        height
    );


    const left =
        leftCtx.getImageData(
            0,
            0,
            width,
            height
        );

    const right =
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


    const a = left.data;
    const b = right.data;
    const c = output.data;


    for (
        let i = 0;
        i < c.length;
        i += 4
    ) {

        c[i] =
            a[i];

        c[i + 1] =
            b[i + 1];

        c[i + 2] =
            b[i + 2];

        c[i + 3] =
            255;
    }


    ctx.putImageData(
        output,
        0,
        0
    );
}


/* --------------------------------------------------
   LIVE PREVIEW
-------------------------------------------------- */

function previewLoop() {

    renderAnaglyph();

    if (
        !sourceVideo.paused &&
        !sourceVideo.ended
    ) {

        animationFrame =
            requestAnimationFrame(
                previewLoop
            );
    }
}


sourceVideo.addEventListener(
    "play",
    () => {

        cancelAnimationFrame(
            animationFrame
        );

        previewLoop();
    }
);


sourceVideo.addEventListener(
    "pause",
    () => {

        cancelAnimationFrame(
            animationFrame
        );

        renderAnaglyph();
    }
);


sourceVideo.addEventListener(
    "seeked",
    () => {

        renderAnaglyph();
    }
);


/* --------------------------------------------------
   CONTROLS
-------------------------------------------------- */

playButton.addEventListener(
    "click",
    async () => {

        try {

            await sourceVideo.play();

            statusElement.textContent =
                "Afspelen";

        } catch (error) {

            console.error(error);
        }
    }
);


pauseButton.addEventListener(
    "click",
    () => {

        sourceVideo.pause();

        statusElement.textContent =
            "Gepauzeerd";
    }
);


stopButton.addEventListener(
    "click",
    () => {

        sourceVideo.pause();

        sourceVideo.currentTime = 0;

        renderAnaglyph();

        statusElement.textContent =
            "Gestopt";
    }
);


/* --------------------------------------------------
   SLIDERS
-------------------------------------------------- */

depthSlider.addEventListener(
    "input",
    () => {

        depthValue.textContent =
            depthSlider.value;

        renderAnaglyph();
    }
);


strengthSlider.addEventListener(
    "input",
    () => {

        strengthValue.textContent =
            strengthSlider.value;

        renderAnaglyph();
    }
);


/* --------------------------------------------------
   RESET
-------------------------------------------------- */

resetButton.addEventListener(
    "click",
    () => {

        depthSlider.value = 12;
        strengthSlider.value = 100;

        depthValue.textContent = "12";
        strengthValue.textContent = "100";

        renderAnaglyph();
    }
);


/* --------------------------------------------------
   EXPORT
-------------------------------------------------- */

exportButton.addEventListener(
    "click",
    async () => {

        if (!sourceVideo.src) {

            alert("Upload eerst een video.");

            return;
        }

        if (
            !window.MediaRecorder ||
            !canvas.captureStream
        ) {

            alert(
                "Je browser ondersteunt video-export niet."
            );

            return;
        }


        /*
            Bewaar huidige positie.
        */

        const oldTime =
            sourceVideo.currentTime;


        /*
            Stop video.
        */

        sourceVideo.pause();


        /*
            Canvas stream.
        */

        const fps = 30;

        const stream =
            canvas.captureStream(fps);


        /*
            Audio proberen toe te voegen.

            De canvas-stream bevat alleen video.
            Daarom voegen we audio van de video toe
            als de browser dit ondersteunt.
        */

        try {

            const audioContext =
                new AudioContext();

            const source =
                audioContext.createMediaElementSource(
                    sourceVideo
                );

            const destination =
                audioContext.createMediaStreamDestination();


            source.connect(destination);

            source.connect(
                audioContext.destination
            );


            destination.stream
                .getAudioTracks()
                .forEach(track => {

                    stream.addTrack(track);
                });

        } catch (error) {

            console.log(
                "Audio kon niet worden toegevoegd:",
                error
            );
        }


        /*
            Codec kiezen.
        */

        const codec =
            getSupportedCodec();


        if (!codec) {

            alert(
                "Deze browser ondersteunt geen geschikte video-exportcodec."
            );

            return;
        }


        let recorder;

        try {

            recorder =
                new MediaRecorder(
                    stream,
                    {
                        mimeType: codec,
                        videoBitsPerSecond:
                            getBitrate()
                    }
                );

        } catch (error) {

            console.error(error);

            alert(
                "Video-export kon niet worden gestart."
            );

            return;
        }


        const chunks = [];


        recorder.ondataavailable =
            event => {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    chunks.push(
                        event.data
                    );
                }
            };


        recorder.onstop = () => {

            const blob =
                new Blob(
                    chunks,
                    {
                        type: codec
                    }
                );


            if (exportedURL) {

                URL.revokeObjectURL(
                    exportedURL
                );
            }


            exportedURL =
                URL.createObjectURL(blob);


            downloadButton.href =
                exportedURL;


            result.style.display =
                "block";

            progressStatus.textContent =
                "Klaar!";


            progressBar.style.width =
                "100%";

            progressText.textContent =
                "100%";


            sourceVideo.currentTime =
                oldTime;


            exportButton.disabled =
                false;


            statusElement.textContent =
                "Export klaar";
        };


        /*
            UI
        */

        exportButton.disabled =
            true;

        result.style.display =
            "none";

        progressSection.style.display =
            "block";

        progressBar.style.width =
            "0%";

        progressText.textContent =
            "0%";

        progressStatus.textContent =
            "Video verwerken...";


        /*
            Start recorder.
        */

        recorder.start(250);


        /*
            Start vanaf het begin.
        */

        sourceVideo.currentTime = 0;


        await waitForSeek();


        sourceVideo.play();


        /*
            Export loop.
        */

        const updateExport =
            () => {

                renderAnaglyph();


                const duration =
                    sourceVideo.duration;

                const current =
                    sourceVideo.currentTime;


                let percent =
                    duration
                        ? (current / duration) * 100
                        : 0;


                percent =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            percent
                        )
                    );


                progressBar.style.width =
                    `${percent}%`;

                progressText.textContent =
                    `${Math.round(percent)}%`;

                progressStatus.textContent =
                    `Frame ${Math.round(percent)}% verwerken...`;


                if (
                    sourceVideo.ended ||
                    current >= duration - 0.05
                ) {

                    sourceVideo.pause();

                    setTimeout(
                        () => {

                            if (
                                recorder.state !==
                                "inactive"
                            ) {

                                recorder.stop();
                            }

                        },
                        150
                    );

                    return;
                }


                requestAnimationFrame(
                    updateExport
                );
            };


        requestAnimationFrame(
            updateExport
        );
    }
);


/* --------------------------------------------------
   CODEC
-------------------------------------------------- */

function getSupportedCodec() {

    const codecs = [

        "video/webm;codecs=vp9,opus",

        "video/webm;codecs=vp8,opus",

        "video/webm"

    ];


    for (const codec of codecs) {

        if (
            MediaRecorder.isTypeSupported(
                codec
            )
        ) {

            return codec;
        }
    }


    return null;
}


/* --------------------------------------------------
   BITRATE
-------------------------------------------------- */

function getBitrate() {

    const quality =
        Number(
            qualitySelect.value
        );


    /*
        Dit zijn redelijke browser
        export-instellingen.
    */

    if (quality >= 0.9) {

        return 8000000;
    }

    if (quality >= 0.75) {

        return 5000000;
    }

    return 2500000;
}


/* --------------------------------------------------
   WAIT FOR SEEK
-------------------------------------------------- */

function waitForSeek() {

    return new Promise(resolve => {

        const handler = () => {

            sourceVideo.removeEventListener(
                "seeked",
                handler
            );

            resolve();
        };


        sourceVideo.addEventListener(
            "seeked",
            handler
        );
    });
}


/* --------------------------------------------------
   TIME FORMAT
-------------------------------------------------- */

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }


    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);


    return `${minutes}:${String(secs).padStart(2, "0")}`;
}


/* --------------------------------------------------
   CLEANUP
-------------------------------------------------- */

window.addEventListener(
    "beforeunload",
    () => {

        if (videoURL) {

            URL.revokeObjectURL(
                videoURL
            );
        }

        if (exportedURL) {

            URL.revokeObjectURL(
                exportedURL
            );
        }
    }
);


/*
    Initial UI.
*/

depthValue.textContent =
    depthSlider.value;

strengthValue.textContent =
    strengthSlider.value;
```
