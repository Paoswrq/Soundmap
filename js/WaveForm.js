import { startMicrophoneAnalysis, getAudioData, getPitch} from "./js/core.js";

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

startMicrophoneAnalysis();

export function loopWave() {
    let hue = getPitch(); 
    let dataArray = getAudioData();
    ctx.fillStyle = "hsl(" + (hue + 180) + ", 50%, 30%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let waveConfig = [
        {multiplier: 0.02, height: .80 }
    ];

    waveConfig.forEach(({multiplier, height }) => {
        ctx.beginPath();

        let sliceWidth = canvas.width / dataArray.length;
        let x = 0;
        let previousX = 0; 
        let previousY = 0; 
        
        let gradient = ctx.createLinearGradient(0,0,canvas.width,0);
        gradient.addColorStop(0,  "hsl(" + hue * 1.00 + ", 70%, 50%)")
        gradient.addColorStop(0.25,  "hsl(" + hue * 0.98 + ", 70%, 50%)")
        gradient.addColorStop(0.5,  "hsl(" + hue * 0.86 + ", 70%, 50%)")
        gradient.addColorStop(0.75,  "hsl(" + hue * 0.64 + ", 70%, 50%)")
        gradient.addColorStop(1,  "hsl(" + hue * 0.42 + ", 70%, 50%)")

        for (let i = 0; i < dataArray.length; i++) {
          let v = (dataArray[i] - 128) / 128; 
          let y = (0.5 + v * 0.5 * height) * canvas.height; 


          if (i === 0) {
              ctx.moveTo(x, y);
          } else {
            let cp1x = (previousX + x) / 2;
            let cp1y = previousY; 
            let cp2x = (previousX + x) / 2;
            let cp2y = y;   
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            //ctx.lineTo(x,y); 
          }
          
          previousY = y;
          previousX = x;
          
          x += sliceWidth;
        }

        ctx.strokeStyle = gradient;
        //ctx.lineWidth = 2; 
        ctx.lineWidth = Math.random() * 5 + 2;
        //ctx.shadowColor
        ctx.stroke();
    });

    if(window.activemodule == "wave")
    	requestAnimationFrame(loopWave);
}
