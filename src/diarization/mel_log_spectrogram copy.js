const audioContext = new AudioContext();
const filterLength = 1024;
const hopLength = 256;
const winLength = 1024;
const nMelChannels = 80;
const samplingRate = 22050;
const melFmin = 0;
const melFmax = 8000.0;
const maxWavValue = 32768.0;
const minLogValue = -11.52;
const maxLogValue = 1.2;
const silenceThresholdDb = -10;

function computeMelLogSpectrogram(signal) {
    // Compute the power spectrum
    const powerSpectrum = new Float32Array(filterLength);
    for (let i = 0; i < filterLength; i++) {
      let sum = 0;
      for (let j = 0; j < winLength; j++) {
        sum += signal[j] * Math.cos(2 * Math.PI * i * j / winLength);
      }
      powerSpectrum[i] = sum * sum / winLength;
    }
  
    // Compute the mel filterbank
    const melFilterbank = new Float32Array(nMelChannels * filterLength);
    const melMin = 1125 * Math.log(1 + melFmin / 700);
    const melMax = 1125 * Math.log(1 + melFmax / 700);
    const melStep = (melMax - melMin) / (nMelChannels + 1);
    for (let i = 0; i < nMelChannels; i++) {
      for (let j = 0; j < filterLength; j++) {
        const freq = j / filterLength * samplingRate;
        const mel = 1125 * Math.log(1 + freq / 700);
        const weight = Math.max(0, 1 - Math.abs(mel - (melMin + (i + 1) * melStep)) / melStep);
        melFilterbank[i * filterLength + j] = weight;
      }
    }
  
    // Apply the mel filterbank to the power spectrum
    const melSpectrum = new Float32Array(nMelChannels);
    for (let i = 0; i < nMelChannels; i++) {
      let sum = 0;
      for (let j = 0; j < filterLength; j++) {
        sum += powerSpectrum[j] * melFilterbank[i * filterLength + j];
      }
      melSpectrum[i] = sum;
    }
  
    // Apply log compression
    const logMelSpectrum = melSpectrum.map(value => 20 * Math.log10(value + 1e-6));
  
    // Clip values that are too low or too high
    const clippedLogMelSpectrum = logMelSpectrum.map(value => {
      if (value < minLogValue) return minLogValue;
      if (value > maxLogValue) return maxLogValue;
      return value;
    });
  
    // Normalize values to a 0-1 range
    const normalizedLogMelSpectrum = clippedLogMelSpectrum.map(value => {
      return (value - minLogValue) / (maxLogValue - minLogValue);
    });
  
    return normalizedLogMelSpectrum;
  }
  
  module.exports = computeMelLogSpectrogram;
  