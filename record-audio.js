const recordLimitMs = 4000;
let timeLeft = recordLimitMs;

let chunks = [];
let audio = null;

function updateTimeLeft() {
    timeLeft -= 1000;

    const timeLeftDisplay = document.getElementById('time-left');
    timeLeftDisplay.textContent = `${timeLeft / 1000} seconds`;
}

function resetRecordAudioState() {
    const recordButton = document.getElementById('record-button');
    const playButton = document.getElementById('play-button');
    const doneRecordingButton = document.getElementById('done-recording-button');

    recordButton.disabled = false;
    playButton.disabled = true;
    doneRecordingButton.disabled = true;
}

// Get the user's permission to access the microphone
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        // Create a MediaStreamAudioSourceNode to get the audio from the microphone
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        // Create a MediaStreamAudioDestinationNode to record the audio
        const destination = audioContext.createMediaStreamDestination();

        // Connect the source to the destination
        source.connect(destination);

        // Create a MediaRecorder object to record the audio
        const mediaRecorder = new MediaRecorder(stream);

        const recordButton = document.getElementById('record-button');
        const playButton = document.getElementById('play-button');
        const doneRecordingButton = document.getElementById('done-recording-button');
        let interval = null;
        recordButton.addEventListener('click', () => {
            doneRecordingButton.disabled = true;
            playButton.disabled = true;
            recordButton.disabled = true;

            // Start new recording every time
            chunks = [];

            // Set the interval to update the time left display every second
            mediaRecorder.start();

            timeLeft = recordLimitMs;
            const timeLeftDisplay = document.getElementById('time-left');
            timeLeftDisplay.textContent = `${recordLimitMs / 1000} seconds`;
            interval = setInterval(updateTimeLeft, 1000);

            setTimeout(() => {
                mediaRecorder.stop();
                clearInterval(interval);
                const timeLeftDisplay = document.getElementById('time-left');
                timeLeftDisplay.textContent = '--';

                playButton.disabled = false;
                recordButton.disabled = false;
                doneRecordingButton.disabled = false;
            }, recordLimitMs);
        });

        doneRecordingButton.addEventListener('click', () => {
            audio?.pause();
        });

        playButton.addEventListener('click', () => {
            recordButton.disabled = true;
            playButton.disabled = true;

            audio = new Audio(URL.createObjectURL(new Blob(chunks, { type: 'audio/wav' })));
            audio.play();
            audio.addEventListener('ended', () => {
                recordButton.disabled = false;
                playButton.disabled = false;
            });
        });

        mediaRecorder.ondataavailable = event => {
            chunks.push(event.data);
        };
    })
    .catch(error => {
        console.error(error);
    });


function getPlayerSoundChunks() {
    return chunks;
}

export { getPlayerSoundChunks, resetRecordAudioState };