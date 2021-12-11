var cube = document.querySelector('.cube');
var currentClass = '';

function changeSide() ***REMOVED***
    var showClass = 'show-front';
    if ( currentClass ) ***REMOVED***
        cube.classList.remove( currentClass );
    ***REMOVED***
    cube.classList.add( showClass );
    currentClass = showClass;
***REMOVED***
// set initial side
changeSide();

let cubeNod = 0;
let cubeRot = 0;
let bpm = 0;

(function() ***REMOVED***
    var chats = document.getElementsByClassName('chat');
    var emma = document.getElementById('emma');
    var videoWidth = 200;
    var videoHeight = 200;

    function getCamera(width, height, camera, callback) ***REMOVED***
        //var compatibleBrowser = hasUserMedia();
        navigator.mediaDevices.enumerateDevices().then(function(devices) ***REMOVED***
            var device = null;
            for (let i = 0; i !== devices.length; ++i) ***REMOVED***
                const deviceCheck = devices[i];
                if (deviceCheck.kind === 'videoinput' && deviceCheck.label === camera) ***REMOVED***
                    device = deviceCheck.deviceId;
                ***REMOVED***
            ***REMOVED***
            console.log(devices);
            var videoResolution = getBrowserVideoSettings("", width, height, device);
            console.log(videoResolution);

            window.URL = window.URL || window.webkitURL;

            navigator.getUserMedia(***REMOVED***
                audio: false,
                video: videoResolution
        ***REMOVED***
            function(stream) ***REMOVED***
                callback(stream);
                //video.srcObject = stream;
                //video.src = window.URL.createObjectURL(stream);
        ***REMOVED***
            function(err) ***REMOVED***
                console.log("The following error occured: " + err.name);
            ***REMOVED***);
        ***REMOVED***);      
    ***REMOVED***

  function getBrowserVideoSettings(browser, width, height, device) ***REMOVED***
      if (browser === navigator.mozGetUserMedia) ***REMOVED***
          return ***REMOVED***
              /*width: width,
              height: height,*/
              deviceId: ***REMOVED*** exact: device ***REMOVED***
          ***REMOVED***
      ***REMOVED*** else ***REMOVED***
          return ***REMOVED***
              /*minWidth: width,
              minHeight: height,*/
              deviceId: device ? ***REMOVED*** exact: device ***REMOVED*** : undefined
          ***REMOVED***
      ***REMOVED***
    ***REMOVED***
    getCamera(videoWidth, videoHeight, "OBS-Camera4", function (stream) ***REMOVED***
      emma.srcObject = stream;
    ***REMOVED***);
    
    getCamera(videoWidth, videoHeight, "OBS-Camera3", function (stream) ***REMOVED***
      for (let i = 0; i < chats.length; i++) ***REMOVED***
          chats[i].srcObject = stream;
      ***REMOVED***
    ***REMOVED***);

***REMOVED***)();

function getAudioSource(deviceLabel, callback) ***REMOVED***
  //var compatibleBrowser = hasUserMedia();
  navigator.mediaDevices.enumerateDevices().then(function(devices) ***REMOVED***
      var device = null;
      for (let i = 0; i !== devices.length; ++i) ***REMOVED***
          const deviceCheck = devices[i];
          if (deviceCheck.kind === 'audioinput' && deviceCheck.label === deviceLabel) ***REMOVED***
              device = deviceCheck.deviceId;
          ***REMOVED***
      ***REMOVED***

      window.URL = window.URL || window.webkitURL;
      console.log("Getting device", device)
      navigator.getUserMedia(***REMOVED***
          audio: ***REMOVED***
                deviceId: device
          ***REMOVED***
  ***REMOVED***
      function(stream) ***REMOVED***
          callback(stream);
          //video.srcObject = stream;
          //video.src = window.URL.createObjectURL(stream);
  ***REMOVED***
      function(err) ***REMOVED***
          console.log("The following error occured: " + err.name);
      ***REMOVED***);
  ***REMOVED***);      
***REMOVED***

/* THANK YOU to JMPerez for this BPM detector you are amazin <3 */

function getPeaks(data) ***REMOVED***

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

    for (var i = 0; i < parts; i++) ***REMOVED***
        var max = 0;
        for (var j = i * partSize; j < (i + 1) * partSize; j++) ***REMOVED***
            var volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
            if (!max || (volume > max.volume)) ***REMOVED***
                max = ***REMOVED***
                    position: j,
                    volume: volume
                ***REMOVED***;
            ***REMOVED***
        ***REMOVED***
        peaks.push(max);
    ***REMOVED***

    // We then sort the peaks according to volume...

    peaks.sort(function(a, b) ***REMOVED***
        return b.volume - a.volume;
    ***REMOVED***);

    // ...take the loundest half of those...

    peaks = peaks.splice(0, peaks.length * 0.5);

    // ...and re-sort it back based on position.

    peaks.sort(function(a, b) ***REMOVED***
        return a.position - b.position;
    ***REMOVED***);

    return peaks;
***REMOVED***

function getIntervals(peaks) ***REMOVED***

    // What we now do is get all of our peaks, and then measure the distance to
    // other peaks, to create intervals.  Then based on the distance between
    // those peaks (the distance of the intervals) we can calculate the BPM of
    // that particular interval.

    // The interval that is seen the most should have the BPM that corresponds
    // to the track itself.

    var groups = [];

    peaks.forEach(function(peak, index) ***REMOVED***
        for (var i = 1; (index + i) < peaks.length && i < 10; i++) ***REMOVED***
            var group = ***REMOVED***
                tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
                count: 1
            ***REMOVED***;

            while (group.tempo < 90) ***REMOVED***
               group.tempo *= 2;
            ***REMOVED***

            while (group.tempo > 180) ***REMOVED***
               group.tempo /= 2;
            ***REMOVED***

            group.tempo = Math.round(group.tempo);

            if (!(groups.some(function(interval) ***REMOVED***
                return (interval.tempo === group.tempo ? interval.count++ : 0);
            ***REMOVED***))) ***REMOVED***
                groups.push(group);
            ***REMOVED***
        ***REMOVED***
    ***REMOVED***);
    return groups;
***REMOVED***


var initializeRecorder = function(stream) ***REMOVED***
    var audioContext = window.AudioContext;
    var context = new audioContext();
    var bufferSize = 512;
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
    highpass.connect(context.destination);

    audioInput.connect(recorder);
    recorder.connect(context.destination);
***REMOVED***

let averageWindow = [];
let vol = 0;
const windowSize = 5;
let rollingBufferA = [];
let rollingBufferB = [];
const bufferSize = 22050*30;

var recorderProcess = function(e) ***REMOVED***
    var floatData = e.inputBuffer.getChannelData(0);
    rollingBufferA.push(...floatData);
    if (rollingBufferA.length > bufferSize) ***REMOVED***
       rollingBufferA.splice(0, rollingBufferA.length - bufferSize);
    ***REMOVED***
    /*rollingBufferB.push(...e.inputBuffer.getChannelData(1));
    if (rollingBufferB.length > bufferSize) ***REMOVED***
         rollingBufferB.splice(0, rollingBufferB.length - bufferSize);
    ***REMOVED****/
    var peaks = getPeaks([rollingBufferA, rollingBufferA]);
    var groups = getIntervals(peaks);
    var top = groups.sort(function(intA, intB) ***REMOVED***
        return intB.count - intA.count;
    ***REMOVED***).splice(0, 5);
    //console.log("Estimate BPM at " + Math.round(top[0].tempo));
    bpm = top[0].tempo;
    let max = 0;
    for (var i = 0; i < floatData.length; i++) ***REMOVED***
      if (floatData[i] > max) ***REMOVED***
        max = floatData[i];
      ***REMOVED***
    ***REMOVED***
    averageWindow.push(max);
    if (averageWindow.length > windowSize) ***REMOVED***
      averageWindow.shift();
    ***REMOVED***
    let average = 0;
    for (var i = 0; i < averageWindow.length; i++) ***REMOVED***
      average += averageWindow[i];
    ***REMOVED***
    average /= averageWindow.length;
    vol = average * 30;

    //console.log(max);
    //cubeNod = average * 6;
    //console.log(cubeNod);
//    i = max*100;
    //cube.style.transform = "translateZ(-100px) rotateY(" + cubeRot.toString() + "deg) rotateX(" + (Math.sin(cubeNod/2)*35).toString() + "deg)";
    //var intData = convertAudio(resampler.resample(floatData));
    /*if (socket.readyState == WebSocket.OPEN) ***REMOVED***
        socket.send(intData.buffer);
    ***REMOVED****/
***REMOVED***

var convertAudio = function(buffer) ***REMOVED***
    l = buffer.length;
    buf = new Int16Array(l);
    while (l--) ***REMOVED***
        buf[l] = Math.min(1, buffer[l])*0x7FFF;
    ***REMOVED***
    return buf;
***REMOVED***

getAudioSource("Microphone (VB-Audio Virtual Cable)", initializeRecorder);

const updateRate = 10;
let jump = 0;
let jumpCounter = 0;
setInterval(function() ***REMOVED***
    cubeRot += 0.01;
    const msBetweenBeats = (60000 / bpm);
    if (isFinite(msBetweenBeats)) ***REMOVED***
        const add = (updateRate / msBetweenBeats) * Math.PI; 
        cubeNod += add;
        //console.log(msBetweenBeats, updateRate, add, cubeNod);
    ***REMOVED***
    let maxNod = vol * 70;
    //cubeNod += (60000 / bpm) ((bpm / 60) / 100) * Math.PI;
    //cubeRot += 0.1;
    document.getElementById("bpm").innerHTML = Math.round(bpm).toString() +  ", " + Math.round(vol * 100).toString() + "%, " + jump.toString();
    cube.style.transform = "translateY(" + ((-Math.cos(jump)+1)*-200).toString() + "px) translateZ(-100px) rotateY(" + cubeRot.toString() + "deg) rotateX(" + (Math.sin(cubeNod)*maxNod).toString() + "deg)";
    //document.getElementsByClassName('cube__face--front')[0].innerHTML = Math.round(bpm);
***REMOVED***, updateRate)

setInterval(function() ***REMOVED***
    /*jumpCounter += 1;
    if (jumpCounter > (5000/updateRate)) ***REMOVED***
        jumpCounter = 0;
        jump = Math.PI*2
    ***REMOVED****/
    if (jump > 0) ***REMOVED***
        jump -= 0.25;
    ***REMOVED***
***REMOVED***, updateRate)

const wsUrl = "ws://" + window.location.host + "/ws";
const webSocket = new WebSocket(wsUrl);

webSocket.onmessage = function (event) ***REMOVED***
    const msg = JSON.parse(event.data);
    if (msg.type == "message") ***REMOVED***
        jump = Math.PI*2;
    ***REMOVED***
***REMOVED***

//radioGroup.addEventListener( 'change', changeSide );