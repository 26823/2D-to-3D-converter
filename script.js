"use strict";

import { FFmpeg } from "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js";
import { fetchFile, toBlobURL } from "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js";

const ffmpeg = new FFmpeg();
let ffmpegLoaded = false;

/* ========================================
   ELEMENTEN
======================================== */

const videoInput =
    document.getElementById("videoInput");

const fileName =
    document.getElementById("fileName");

const sourceVideo =
    document.getElementById("sourceVideo");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d", {
        willReadFrequently: true
    });

const statusText =
    document.getElementById("status");

const depthSlider =
    document.getElementById("depth");

const strengthSlider =
    document.getElementById("strength");

const depthValue =
    document.getElementById("depthValue");

const strengthValue =
    document.getElementById("strengthValue");

const playButton =
    document.getElementById("playButton");

const pauseButton =
    document.getElementById("pauseButton");

const stopButton =
    document.getElementById("stopButton");

const exportButton =
    document.getElementById("exportButton");

const resultCard =
    document.getElementById("resultCard");

const downloadButton =
    document.getElementById("downloadButton");


/* ========================================
   VARIABELEN
======================================== */

let videoURL = null;

let animationFrame = null;

let mediaRecorder = null;

let recordedChunks = [];

let isExporting = false;


/* ========================================
   VIDEO KIEZEN
======================================== */

videoInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }


        console.log(
            "Video gekozen:",
            file.name
        );


        /* Bestandsnaam */

        fileName.textContent =
            "Gekozen: " + file.name;


        /* Status */

        statusText.textContent =
            "Video wordt geladen...";


        /* Oude URL verwijderen */

        if (videoURL) {

            URL.revokeObjectURL(
                videoURL
            );

        }


        /* Nieuwe lokale URL */

        videoURL =
            URL.createObjectURL(file);


        /* Video instellen */

        sourceVideo.src =
            videoURL;

        sourceVideo.load();


        /* Oude download verwijderen */

        resultCard.classList.add(
            "hidden"
        );

        downloadButton.removeAttribute(
            "href"
        );


        /* Canvas leegmaken */

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

    }
);


/* ========================================
   VIDEO GELADEN
======================================== */

sourceVideo.addEventListener(
    "loadedmetadata",
    function () {

        canvas.width =
            sourceVideo.videoWidth;

        canvas.height =
            sourceVideo.videoHeight;


        statusText.textContent =
            "Video geladen: " +
            sourceVideo.videoWidth +
            " × " +
            sourceVideo.videoHeight;


        drawFrame();

    }
);


/* ========================================
   VIDEO FOUT
======================================== */

sourceVideo.addEventListener(
    "error",
    function () {

        statusText.textContent =
            "Deze video kan niet door je browser worden afgespeeld.";

        alert(
            "De video kan niet worden afgespeeld.\n\n" +
            "Probeer bijvoorbeeld een MP4-video met H.264."
        );

    }
);


/* ========================================
   DIEPTE
======================================== */

depthSlider.addEventListener(
    "input",
    function () {

        depthValue.textContent =
            this.value;


        if (
            sourceVideo.readyState >= 2
        ) {

            drawFrame();

        }

    }
);


/* ========================================
   STERKTE
======================================== */

strengthSlider.addEventListener(
    "input",
    function () {

        strengthValue.textContent =
            Number(this.value).toFixed(1);


        if (
            sourceVideo.readyState >= 2
        ) {

            drawFrame();

        }

    }
);


/* ========================================
   3D FRAME
======================================== */

function drawFrame() {

    if (
        !sourceVideo.videoWidth ||
        !sourceVideo.videoHeight
    ) {

        return;

    }


    const width =
        sourceVideo.videoWidth;

    const height =
        sourceVideo.videoHeight;


    /* Canvas formaat */

    if (
        canvas.width !== width ||
        canvas.height !== height
    ) {

        canvas.width = width;

        canvas.height = height;

    }


    /* Instellingen */

    const depth =
        Number(depthSlider.value);

    const strength =
        Number(strengthSlider.value);


    /* ====================================
       LINKER CANVAS
    ==================================== */

    const leftCanvas =
        document.createElement("canvas");

    leftCanvas.width =
        width;

    leftCanvas.height =
        height;


    const leftCtx =
        leftCanvas.getContext("2d");


    /* ====================================
       RECHTER CANVAS
    ==================================== */

    const rightCanvas =
        document.createElement("canvas");

    rightCanvas.width =
        width;

    rightCanvas.height =
        height;


    const rightCtx =
        rightCanvas.getContext("2d");


    /* ====================================
       LINKERBEELD
    ==================================== */

    leftCtx.drawImage(
        sourceVideo,
        -depth * strength,
        0,
        width,
        height
    );


    /* ====================================
       RECHTERBEELD
    ==================================== */

    rightCtx.drawImage(
        sourceVideo,
        depth * strength,
        0,
        width,
        height
    );


    /* ====================================
       PIXELS
    ==================================== */

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


    /* ====================================
       ROOD / CYAAN
    ==================================== */

    for (
        let i = 0;
        i < output.data.length;
        i += 4
    ) {

        /* Rood */

        output.data[i] =
            leftImage.data[i];


        /* Groen */

        output.data[i + 1] =
            rightImage.data[i + 1];


        /* Blauw */

        output.data[i + 2] =
            rightImage.data[i + 2];


        /* Alpha */

        output.data[i + 3] =
            255;

    }


    /* ====================================
       RESULTAAT
    ==================================== */

    ctx.putImageData(
        output,
        0,
        0
    );

}


/* ========================================
   AFSPelen
======================================== */

playButton.addEventListener(
    "click",
    async function () {

        if (!sourceVideo.src) {

            alert(
                "Kies eerst een video."
            );

            return;

        }


        try {

            await sourceVideo.play();

            startRendering();

        }
        catch (error) {

            console.error(error);

            alert(
                "De video kon niet worden afgespeeld."
            );

        }

    }
);


/* ========================================
   PAUZE
======================================== */

pauseButton.addEventListener(
    "click",
    function () {

        sourceVideo.pause();

        stopRendering();

        drawFrame();

    }
);


/* ========================================
   STOP
======================================== */

stopButton.addEventListener(
    "click",
    function () {

        sourceVideo.pause();

        try {

            sourceVideo.currentTime = 0;

        }
        catch (error) {

            console.log(error);

        }

        stopRendering();

        drawFrame();

    }
);


/* ========================================
   RENDER LOOP
======================================== */

function startRendering() {

    stopRendering();


    function render() {

        drawFrame();


        if (
            !sourceVideo.paused &&
            !sourceVideo.ended
        ) {

            animationFrame =
                requestAnimationFrame(
                    render
                );

        }

    }


    render();

}


/* ========================================
   STOP RENDERING
======================================== */

function stopRendering() {

    if (animationFrame !== null) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;

    }

}


/* ========================================
   VIDEO EINDE
======================================== */

sourceVideo.addEventListener(
    "ended",
    function () {

        stopRendering();

        drawFrame();

    }
);


/* ========================================
   EXPORTEREN
======================================== */

exportButton.addEventListener(
    "click",
    async function () {

        if (isExporting) {
            return;
        }


        if (!sourceVideo.src) {

            alert(
                "Kies eerst een video."
            );

            return;

        }


        if (!canvas.captureStream) {

            alert(
                "Je browser ondersteunt het maken van video's niet."
            );

            return;

        }


        if (
            typeof MediaRecorder ===
            "undefined"
        ) {

            alert(
                "Je browser ondersteunt MediaRecorder niet."
            );

            return;

        }


        isExporting = true;


        exportButton.disabled =
            true;

        exportButton.textContent =
            "⏳ Video wordt gemaakt...";


        recordedChunks = [];


        /* ====================================
           CANVAS STREAM
        ==================================== */

        const canvasStream =
            canvas.captureStream(30);


        /* ====================================
           VIDEO TYPE
        ==================================== */

        let mimeType = "";


        if (
            MediaRecorder.isTypeSupported(
                "video/webm;codecs=vp9"
            )
        ) {

            mimeType =
                "video/webm;codecs=vp9";

        }

        else if (
            MediaRecorder.isTypeSupported(
                "video/webm;codecs=vp8"
            )
        ) {

            mimeType =
                "video/webm;codecs=vp8";

        }

        else {

            mimeType =
                "video/webm";

        }


        /* ====================================
           RECORDER
        ==================================== */

        try {

            mediaRecorder =
                new MediaRecorder(
                    canvasStream,
                    {
                        mimeType:
                            mimeType
                    }
                );

        }

        catch (error) {

            console.error(error);

            alert(
                "Je browser kan geen video opnemen."
            );

            resetExportButton();

            return;

        }


        /* ====================================
           DATA
        ==================================== */

        mediaRecorder.ondataavailable =
            function (event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    recordedChunks.push(
                        event.data
                    );

                }

            };


        /* ====================================
           STOP
        ==================================== */

        mediaRecorder.onstop =
    async function () {

        try {

            statusText.textContent =
                "⏳ Video wordt omgezet naar MP4...";

            exportButton.textContent =
                "⏳ MP4 maken...";


            /* ====================================
               WEBM MAKEN
            ==================================== */

            const webmBlob =
                new Blob(
                    recordedChunks,
                    {
                        type: "video/webm"
                    }
                );


            /* ====================================
               FFMPEG LADEN
            ==================================== */

            if (!ffmpegLoaded) {

                statusText.textContent =
                    "⏳ MP4-converter wordt geladen...";

                const baseURL =
                    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

                await ffmpeg.load({

                    coreURL:
                        await toBlobURL(
                            `${baseURL}/ffmpeg-core.js`,
                            "text/javascript"
                        ),

                    wasmURL:
                        await toBlobURL(
                            `${baseURL}/ffmpeg-core.wasm`,
                            "application/wasm"
                        )

                });

                ffmpegLoaded = true;

            }


            /* ====================================
               WEBM IN FFMPEG ZETTEN
            ==================================== */

            await ffmpeg.writeFile(
                "input.webm",
                await fetchFile(webmBlob)
            );


            /* ====================================
               MP4 MAKEN
            ==================================== */

            statusText.textContent =
                "⏳ MP4 wordt gemaakt...";


            await ffmpeg.exec([

                "-i",
                "input.webm",

                "-c:v",
                "libx264",

                "-preset",
                "ultrafast",

                "-pix_fmt",
                "yuv420p",

                "-movflags",
                "+faststart",

                "-an",

                "output.mp4"

            ]);


            /* ====================================
               MP4 UITLEZEN
            ==================================== */

            const data =
                await ffmpeg.readFile(
                    "output.mp4"
                );


            const mp4Blob =
                new Blob(
                    [data.buffer],
                    {
                        type: "video/mp4"
                    }
                );


            const url =
                URL.createObjectURL(
                    mp4Blob
                );


            /* ====================================
               DOWNLOAD
            ==================================== */

            downloadButton.href =
                url;

            downloadButton.download =
                "3D-anaglyph-video.mp4";


            resultCard.classList.remove(
                "hidden"
            );


            statusText.textContent =
                "✅ 3D MP4-video klaar!";


        }

        catch (error) {

            console.error(
                "MP4 conversie fout:",
                error
            );

            statusText.textContent =
                "❌ MP4 maken mislukt.";

            alert(
                "De video kon niet naar MP4 worden omgezet.\n\n" +
                "Bekijk de fout in de console."
            );

        }

        finally {

            resetExportButton();

        }

    };


        /* ====================================
           VIDEO TERUG NAAR BEGIN
        ==================================== */

        sourceVideo.pause();


        try {

            sourceVideo.currentTime = 0;

        }

        catch (error) {

            console.log(error);

        }


        /* Wachten tot video naar 0 is */

        const startRecording =
            function () {

                sourceVideo.removeEventListener(
                    "seeked",
                    startRecording
                );


                try {

                    mediaRecorder.start(
                        100
                    );

                }

                catch (error) {

                    console.error(error);

                    alert(
                        "Opname kon niet worden gestart."
                    );

                    resetExportButton();

                    return;

                }


                sourceVideo.play();

                startRendering();


                /* ====================================
                   CONTROLEREN OP EINDE
                ==================================== */

                const checkEnd =
                    setInterval(
                        function () {

                            if (
                                sourceVideo.ended
                            ) {

                                clearInterval(
                                    checkEnd
                                );

                                finishRecording();

                            }

                        },
                        100
                    );


                /* Als duration bekend is */

                const durationCheck =
                    setInterval(
                        function () {

                            if (
                                sourceVideo.duration &&
                                sourceVideo.currentTime >=
                                sourceVideo.duration - 0.05
                            ) {

                                clearInterval(
                                    durationCheck
                                );

                                clearInterval(
                                    checkEnd
                                );

                                finishRecording();

                            }

                        },
                        100
                    );


                function finishRecording() {

                    if (
                        mediaRecorder &&
                        mediaRecorder.state ===
                        "recording"
                    ) {

                        sourceVideo.pause();

                        stopRendering();

                        mediaRecorder.stop();

                    }

                }

            };


        sourceVideo.addEventListener(
            "seeked",
            startRecording
        );


        /* Voor video's die al op 0 staan */

        if (
            sourceVideo.currentTime === 0
        ) {

            setTimeout(
                startRecording,
                100
            );

        }

    }
);


/* ========================================
   EXPORT BUTTON RESET
======================================== */

function resetExportButton() {

    isExporting = false;

    exportButton.disabled =
        false;

    exportButton.textContent =
        "🎞️ 3D-video maken";

}
