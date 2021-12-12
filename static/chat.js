var cube = document.querySelector('.cube');
var currentClass = '';
const updateRate = 10;
const msBetweenRotations = 10 * 1000;
const jumpDuration = .5 * 1000;
const jumpHeight = .1 * 1000;
const spinDuration = 1.5 * 1000;
const numberOfSpins = 2;
const alertDuration = 10 * 1000;
const notificationSound = new Audio('notification.wav');
const bufferSize = 22050*30;
const windowSize = 5;
const wsUrl = "ws://" + window.location.host + "/ws";
const webSocket = new WebSocket(wsUrl);
let spinDirection = true;
let averageWindow = [];
let vol = 0;
let rollingBufferA = [];
let rollingBufferB = [];
let alertTime = 0;
let alertActive = false;
let cubeNod = 0;
let cubeRot = 0;
let bpm = 0;

function escapeHTML (unsafe_str) {
    return unsafe_str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#39;')
      .replace(/\//g, '&#x2F;')
}

function changeSide() {
    var showClass = 'show-front';
    if ( currentClass ) {
        cube.classList.remove( currentClass );
    }
    cube.classList.add( showClass );
    currentClass = showClass;
}

function setAlert(text) {
    const alertBoxes = document.getElementsByClassName("alertbox");
    const alerts = document.getElementsByClassName("alert");
    for (var i = 0; i < alertBoxes.length; i++) {
        alerts[i].innerHTML = escapeHTML(text);
        if (text == "") {
            alertBoxes[i].classList.add("hidden");
        } else {
            alertBoxes[i].classList.remove("hidden");
        }
    }
    if (text != "") {
        alertTime = alertDuration;
        alertActive = true;
    }
}

setAlert("");
// set initial side
changeSide();

(function() {
    var chats = document.getElementsByClassName('chat');
    var emma = document.getElementById('emma');
    var videoWidth = 200;
    var videoHeight = 200;

    function getCamera(width, height, camera, callback) {
        //var compatibleBrowser = hasUserMedia();
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
            var device = null;
            for (let i = 0; i !== devices.length; ++i) {
                const deviceCheck = devices[i];
                if (deviceCheck.kind === 'videoinput' && deviceCheck.label === camera) {
                    device = deviceCheck.deviceId;
                }
            }
            console.log(devices);
            var videoResolution = getBrowserVideoSettings("", width, height, device);
            console.log(videoResolution);

            window.URL = window.URL || window.webkitURL;

            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: videoResolution
            }).then(function(stream) {
                console.log("Got stream", stream);
                callback(stream);
                //video.srcObject = stream;
                //video.src = window.URL.createObjectURL(stream);
            }).catch(function(err) {
                console.log("The following error occured: " + err.name);
            });
        });      
    }

  function getBrowserVideoSettings(browser, width, height, device) {
      if (browser === navigator.mozGetUserMedia) {
          return {
              /*width: width,
              height: height,*/
              deviceId: { exact: device }
          }
      } else {
          return {
              /*minWidth: width,
              minHeight: height,*/
              deviceId: device ? { exact: device } : undefined
          }
      }
    }
    getCamera(videoWidth, videoHeight, "OBS-Camera4", function (stream) {
        emma.srcObject = stream;
    });
    
    getCamera(videoWidth, videoHeight, "OBS-Camera3", function (stream) {
        for (let j = 0; j < chats.length; j++) {
            console.log("Setting stream of", chats[j], "to", stream, chats.length);
            chats[j].srcObject = stream;
            //chats[j].src = URL.createObjectURL(stream);
        }
    });

})();

function getAudioSource(deviceLabel, callback) {
  //var compatibleBrowser = hasUserMedia();
  navigator.mediaDevices.enumerateDevices().then(function(devices) {
      var device = null;
      for (let i = 0; i !== devices.length; ++i) {
          const deviceCheck = devices[i];
          if (deviceCheck.kind === 'audioinput' && deviceCheck.label === deviceLabel) {
              device = deviceCheck.deviceId;
          }
      }

      window.URL = window.URL || window.webkitURL;
      navigator.mediaDevices.getUserMedia({
          audio: {
                deviceId: device
          }
      }).then(function(stream) {
          callback(stream);
          //video.srcObject = stream;
          //video.src = window.URL.createObjectURL(stream);
      }).catch(function(err) {
          console.log("The following error occured: " + err.name);
      });
  });      
}

/* THANK YOU to JMPerez for this BPM detector you are amazin <3 */

function getPeaks(data) {

    // What we're going to do here, is to divide up our audio into parts.

    // We will then identify, for each part, what the loudest sample is in that
    // part.

    // It's implied that that sample would represent the most likely 'beat'
    // within that part.

    // Each part is 0.5 seconds long - or 22,050 samples.

    // This will give us 60 'beats' - we will only take the loudest half of
    // those.

    // This will allow us to ignore breaks, and allow us to address tracks with
    // a BPM below 120.

    var partSize = 22050,
        parts = data[0].length / partSize,
        peaks = [];

    for (var i = 0; i < parts; i++) {
        var max = 0;
        for (var j = i * partSize; j < (i + 1) * partSize; j++) {
            var volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
            if (!max || (volume > max.volume)) {
                max = {
                    position: j,
                    volume: volume
                };
            }
        }
        peaks.push(max);
    }

    // We then sort the peaks according to volume...

    peaks.sort(function(a, b) {
        return b.volume - a.volume;
    });

    // ...take the loundest half of those...

    peaks = peaks.splice(0, peaks.length * 0.5);

    // ...and re-sort it back based on position.

    peaks.sort(function(a, b) {
        return a.position - b.position;
    });

    return peaks;
}

function getIntervals(peaks) {

    // What we now do is get all of our peaks, and then measure the distance to
    // other peaks, to create intervals.  Then based on the distance between
    // those peaks (the distance of the intervals) we can calculate the BPM of
    // that particular interval.

    // The interval that is seen the most should have the BPM that corresponds
    // to the track itself.

    var groups = [];

    peaks.forEach(function(peak, index) {
        for (var i = 1; (index + i) < peaks.length && i < 10; i++) {
            var group = {
                tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
                count: 1
            };

            while (group.tempo < 90) {
               group.tempo *= 2;
            }

            while (group.tempo > 180) {
               group.tempo /= 2;
            }

            group.tempo = Math.round(group.tempo);

            if (!(groups.some(function(interval) {
                return (interval.tempo === group.tempo ? interval.count++ : 0);
            }))) {
                groups.push(group);
            }
        }
    });
    return groups;
}


var initializeRecorder = function(stream) {
    var audioContext = window.AudioContext;
    var context = new audioContext();
    var bufferSize = 2048;
    //resampler = new Resampler(context.sampleRate, 16000);
    var audioInput = context.createMediaStreamSource(stream);
    var recorder = context.createScriptProcessor(bufferSize, 1, 1);
    recorder.onaudioprocess = recorderProcess;
    var lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 150;
    lowpass.Q.value = 1;

    // Now a highpass to remove the bassline.

    var highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;
    highpass.Q.value = 1;

    audioInput.connect(lowpass);
    lowpass.connect(highpass);

    audioInput.connect(recorder);
    recorder.connect(context.destination);
}

var recorderProcess = function(e) {
    var floatData = e.inputBuffer.getChannelData(0);
    rollingBufferA.push(...floatData);
    if (rollingBufferA.length > bufferSize) {
       rollingBufferA.splice(0, rollingBufferA.length - bufferSize);
    }

    var peaks = getPeaks([rollingBufferA, rollingBufferA]);
    var groups = getIntervals(peaks);
    var top = groups.sort(function(intA, intB) {
        return intB.count - intA.count;
    }).splice(0, 5);
    if (top.length == 0) return;

    bpm = top[0].tempo;
    let max = 0;
    for (var i = 0; i < floatData.length; i++) {
      if (floatData[i] > max) {
        max = floatData[i];
      }
    }
    averageWindow.push(max);
    if (averageWindow.length > windowSize) {
      averageWindow.shift();
    }
    let average = 0;
    for (var i = 0; i < averageWindow.length; i++) {
      average += averageWindow[i];
    }
    average /= averageWindow.length;
    vol = average * 25;
}

var convertAudio = function(buffer) {
    l = buffer.length;
    buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l])*0x7FFF;
    }
    return buf;
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

getAudioSource("Microphone (VB-Audio Virtual Cable)", initializeRecorder);

let jump = 0;
let spin = 0;
setInterval(function() {
    cubeRot += (spinDirection ? 1 : -1) * (updateRate / msBetweenRotations) * (2 * Math.PI);
    //cubeRot += 0.002;
    if (spinDirection && cubeRot > (2 * Math.PI)) {
        cubeRot -= (2 * Math.PI);
    } else if (!spinDirection && cubeRot < 0) {
        cubeRot += (2 * Math.PI);
    }
    const msBetweenBeats = (60000 / bpm);
    if (isFinite(msBetweenBeats)) {
        const add = (updateRate / msBetweenBeats) * Math.PI; 
        cubeNod += add;
        if (cubeNod > (2 * Math.PI)) {
            cubeNod -= (2 * Math.PI);
        }
    }
    let maxNod = (easeInOutCubic(Math.min(vol+.20,1)) * (1 + Math.log(Math.max(1, vol)))) * 0.2;

    const nod = Math.sin(cubeNod)*maxNod;
    const bpmString = Math.round(bpm).toString();
    const nodString = Math.round(nod*100).toString();
    const volString = Math.round(vol * 100).toString();
    const jumpString = Math.round(jump*100).toString();

    const nodX = nod * Math.cos(cubeRot);
    const nodZ = nod * Math.sin(cubeRot);
    const rot = cubeRot + spin;
    document.getElementById("debug").innerHTML = bpmString + ", " + nodString + "%, " + volString + "%, " + jumpString.toString();
    cube.style.transform = "translateY(" + ((Math.cos(Math.PI + jump)+1)*-(jumpHeight / 2)).toString() + "px) translateZ(-100px) rotateY(" + rot.toString() + "rad) rotateX(" + nodX.toString() + "rad) rotateZ(" + nodZ.toString() + "rad)";
}, updateRate)

setInterval(function() {
    if (alertActive) {
        alertTime -= updateRate;
        if (alertTime <= 0) {
            alertActive = false;
            alertTime = 0;
            setAlert("");
        }
    }
    if (jump > 0) {
        jump -= (updateRate / jumpDuration) * (2 * Math.PI);
    }
    if (spin > 0) {
        spin -= (updateRate / spinDuration) * ((numberOfSpins * 2) * Math.PI);
    }
}, updateRate)

webSocket.onmessage = function (event) {
    const msg = JSON.parse(event.data);
    if (msg.type == "message") {
        jump = Math.PI*2;
    } else if (msg.type == "follow" || msg.type == "subscribe") {
        spin = Math.PI * (numberOfSpins * 2);
        if (msg.type == "follow") {
            setAlert(msg.displayName + " has followed!");
        } else {
            setAlert(msg.displayName + " has subscribed!");
        }
        notificationSound.play();
    } else if (msg.type == "cheer") {
        if (!msg.anonymous) {
            setAlert(msg.displayName + " cheered " + msg.bits.toString() + " bits!");
        } else {
            setAlert("Someone cheered " + msg.bits.toString() + " bits!");
        }
        notificationSound.play();
    } else if (msg.type == "command") {
        if (msg.command == "spin") {
            spin = Math.PI * (numberOfSpins * 2);
        } else if (msg.command == "jump") {
            jump = Math.PI*2;
        } else if (msg.command == "flip") {
            spinDirection = !spinDirection;
        }
    }
}