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

// Calculate mel filterbank
function melFilterbank(nMelChannels, filterLength, samplingRate, melFmin, melFmax) {
    const nFft = filterLength;
    const fftFreqs = Array.from({length: nFft / 2 + 1}, (_, i) => i * samplingRate / nFft);
    const melMin = 1125.0 * Math.log(1 + melFmin / 700.0);
    const melMax = 1125.0 * Math.log(1 + melFmax / 700.0);
    const melPoints = Array.from({length: nMelChannels + 2}, (_, i) => melMin + i * (melMax - melMin) / (nMelChannels + 1));
    const bin = melPoints.map(melPoint => Math.floor((filterLength + 1) * 700.0 * (Math.exp(melPoint / 1125.0) - 1) / samplingRate));
    const fbank = Array.from({length: nMelChannels}, (_, i) => Array(nFft / 2 + 1).fill(0));

    for (let i = 1; i < nMelChannels + 1; i++) {
        for (let j = bin[i - 1]; j < bin[i]; j++) {
            fbank[i - 1][j] = (j - bin[i - 1]) / (bin[i] - bin[i - 1]);
        }
        for (let j = bin[i]; j < bin[i + 1]; j++) {
            fbank[i - 1][j] = (bin[i + 1] - j) / (bin[i + 1] - bin[i]);
        }
    }

    return fbank;
}

// Apply mel filterbank to spectrogram
function applyMelFilterbank(spectrogram, fbank) {
    const melSpectrogram = spectrogram.map(row => row.map((value, i) => value * fbank[i]));
    return melSpectrogram.map(row => Array.from({length: fbank.length}, (_, i) => row.reduce((sum, value) => sum + value[i], 0)));
}

// Compute mel log spectrogram
async function computeMelLogSpectrogram(audioData) {
    const nSamples = audioData.length;
    const nFft = filterLength;
    const nHop = hopLength;
    const nFrames = 1 + Math.floor((nSamples - nFft) / nHop);
    const fbank = melFilterbank(nMelChannels, filterLength, samplingRate, melFmin, melFmax);
    const spectrogram = Array.from({length: nFrames}, (_, i) => {
        const start = i * nHop;
        const frame = audioData.slice(start, start + nFft);
        const windowed = frame.map((value, j) => value * (0.5 - 0.5 * Math.cos(2 * Math.PI * j / winLength)));
        const complexSpectrum = new Float32Array(nFft);
        for (let j = 0; j < nFft; j++) {
            complexSpectrum[j] = windowed[j];
        }
        const spectrum = audioContext.createPeriodicWave(complexSpectrum, new Float32Array(nFft)).getRealFloatFrequencyData();
        return spectrum.slice(0, nFft / 2 + 1);
    });

    const melSpectrogram = applyMelFilterbank(spectrogram, fbank);
    const logMelSpectrogram = melSpectrogram.map(row => row.map(value => Math.max(Math.log(value + 1e-5), minLogValue)));
    return logMelSpectrogram;
}

module.exports = { computeMelLogSpectrogram }
