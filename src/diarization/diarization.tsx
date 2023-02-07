import React, { useState, useEffect } from 'react';

import { computeMelLogSpectrogram } from './mel_log_spectrogram';


const FFT_SIZE = 1024;
const HOP_LENGTH = 256;
const WIN_LENGTH = 1024;
const N_MEL_CHANNELS = 80;
const SAMPLING_RATE = 22050;
const MEL_FMIN = 0;
const MEL_FMAX = 8000.0;
const MAX_WAV_VALUE = 32768.0;
const MIN_LOG_VALUE = -11.52;
const MAX_LOG_VALUE = 1.2;
const SILENCE_THRESHOLD_DB = -10;

const audioContext = new (window.AudioContext || window.webkitAudioContext) ({
   latencyHint: 'interactive',
   sampleRate: SAMPLING_RATE // 16000 max
});
const analyser = new AnalyserNode(audioContext, { "fftSize": FFT_SIZE }); // for AnalyserOptions
export const Diarization = () => {

   const [audioRunning, setAudioRunning] = React.useState<boolean>(false);
   const [freqData, setFreqData] = React.useState<string>('');
   const [spectroGram, setSpectroGram] = React.useState<string>('');
   const dataArray = new Float32Array(FFT_SIZE / 2); // FFT_SIZE / 2 = analyser.frequencyBinCount;

   useEffect(() => {
      document.querySelector('button')!.addEventListener('click', () => {
         audioContext.resume().then(() => {
            console.log('Playback resumed successfully');
            if (audioContext.state === 'running') {
               setAudioRunning(true);

               navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                  const source = audioContext.createMediaStreamSource(stream);
                  source.connect(analyser);
                  analyser.connect(audioContext.destination);
                  const draw = () => {
                     const drawVisual = requestAnimationFrame(draw);
                     analyser.getFloatFrequencyData(dataArray);
                     setFreqData(`${dataArray[0]} ${dataArray[100]} ${dataArray[200]} ${dataArray[300]} ${dataArray[400]} ${dataArray[500]}`);
                     computeMelLogSpectrogram(dataArray).then((melLogSpectrogram) => {
                        // setSpectroGram(`${melLogSpectrogram.dataSync()[0]} ${melLogSpectrogram.dataSync()[100]} ${melLogSpectrogram.dataSync()[200]} ${melLogSpectrogram.dataSync()[300]} ${melLogSpectrogram.dataSync()[400]} ${melLogSpectrogram.dataSync()[500]}`);
                        // console.log(melLogSpectrogram);
                     });
                  };
                  draw();
               });
            }
         });
      });
   }, []);

   return (
      <div>
         <h1>Diarization</h1>
         <button>Start</button>
         <p>
            {/* {dataArray.slice(0, 5).map((data, index) => `Element ${index}: ${data} `)} */}
            {/* {dataArray[0]} */}
            {freqData}
         </p>
      </div>
   )
}
