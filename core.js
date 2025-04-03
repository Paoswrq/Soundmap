let dataArray = new Uint8Array(2048);
let frequencyData = new Uint8Array(1024);
let returnHue = 10;
let analyserNode = null;

window.addEventListener("resize", canvasUpdate); 

export function startMicrophoneAnalysis() {
    return navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
            let audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let audioStream = audioContext.createMediaStreamSource(stream);
            analyserNode = audioContext.createAnalyser();

            analyserNode.fftSize = 2048;
            dataArray = new Uint8Array(analyserNode.fftSize);

            audioStream.connect(analyserNode);

            function updateData() {
              analyserNode.getByteTimeDomainData(dataArray);              
              analyserNode.getByteFrequencyData(frequencyData);
              returnHue = getPitchAndMapToHue(frequencyData, audioContext.sampleRate);
              requestAnimationFrame(updateData);
            }

            updateData();
        })
        .catch(function (error) {
            console.error("Error accessing microphone:", error);
            return null;
        });
}

function canvasUpdate() {
    let canvas = document.getElementById("canvas");
    let canvasContext = canvas.getContext("2d");
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
canvasUpdate();

export function getAudioData() {
    if (analyserNode) {
        analyserNode.getByteTimeDomainData(dataArray);
    }
    return dataArray;
}

export function getAudioDataFrequency() {
  if (analyserNode) {
      analyserNode.getByteTimeDomainData(dataArray);
  }
  return frequencyData;
}

export function getPitch() {
    if (analyserNode) {
        analyserNode.getByteFrequencyData(frequencyData);
    }
    return returnHue; 
}

let lastHue = 0; 
let hue = 0; 

function getPitchAndMapToHue(buffer, sampleRate) {
    let maxIndex = -1;
    let maxValue = -1;

    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] > maxValue) {
            maxValue = buffer[i];
            maxIndex = i;
        }
    }

    let nyquist = sampleRate / 2;
    let frequency = (maxIndex / buffer.length) * nyquist;

    let minFrequency = 50;  
    let maxFrequency = 1000; 
    
    hue = mapFrequencyToHue(frequency, minFrequency, maxFrequency);
    
    lastHue += ((hue-lastHue) * 0.005);

    return lastHue; 
}

function mapFrequencyToHue(frequency, minFrequency, maxFrequency) {
    let clampedFrequency = Math.min(Math.max(frequency, minFrequency), maxFrequency);
    let hue = ((clampedFrequency - minFrequency) / (maxFrequency - minFrequency)) * 360;

    return hue;
}

function openInstructionOverlay() {
  document.querySelector(".instructionBg").style.display = "flex"; 
}
function closeInstructionOverlay() {
  document.querySelector(".instructionBg").style.display = "none"; 
}


document.getElementById("Instruction").addEventListener("click", openInstructionOverlay);
document.getElementById("Exit").addEventListener("click", closeInstructionOverlay);