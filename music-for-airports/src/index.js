import '@mohayonao/web-audio-api-shim'

import SAMPLE_LIBRARY from './sonatina-sample-library'

const OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

let audioContext = new AudioContext()

function getSample(instrument, noteAndOctave) {
  let [, requestedNote, requestedOctave] = /^(\w[b#]?)(\d)$/.exec(noteAndOctave)
  requestedOctave = parseInt(requestedOctave, 10)
  requestedNote = flatToSharp(requestedNote)

  let sampleBank = SAMPLE_LIBRARY[instrument]
  let sample = getNearestSample(sampleBank, requestedNote, requestedOctave)
  let distance = getNoteDistance(requestedNote, requestedOctave, sample.note, sample.octave)
  return fetchSample(sample.file).then(audioBuffer => ({
    audioBuffer: audioBuffer,
    distance: distance
  }))
}

function flatToSharp(note) {
  switch (note) {
    case 'Bb':
      return 'A#'
    case 'Db':
      return 'C#'
    case 'Eb':
      return 'D#'
    case 'Gb':
      return 'F#'
    case 'Ab':
      return 'G#'
    default:
      return note
  }
}

function noteValue(note, octave) {
  return octave * 12 + OCTAVE.indexOf(note)
}

function getNoteDistance(note1, octave1, note2, octave2) {
  return noteValue(note1, octave1) - noteValue(note2, octave2)
}

function getNearestSample(sampleBank, note, octave) {
  let sortedBank = sampleBank.slice().sort((sampleA, sampleB) => {
    let distanceToA = Math.abs(getNoteDistance(note, octave, sampleA.note, sampleA.octave))
    let distanceToB = Math.abs(getNoteDistance(note, octave, sampleB.note, sampleB.octave))
    return distanceToA - distanceToB
  })
  return sortedBank[0]
}

function fetchSample(path) {
  return fetch(encodeURIComponent(path))
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
}

function playSample(instrument, note, destination, delaySeconds = 0) {
  getSample(instrument, note).then(({ audioBuffer, distance }) => {
    // let playbackRate = Math.pow(2, distance / 12)
    let playbackRate = Math.pow(2, distance / 12) / 3
    let bufferSource = audioContext.createBufferSource()

    bufferSource.buffer = audioBuffer
    bufferSource.playbackRate.value = playbackRate

    bufferSource.connect(destination)
    bufferSource.start(audioContext.currentTime + delaySeconds)
  })
}

function startLoop(instrument, note, destination, loopLengthSeconds, delaySeconds) {
  playSample(instrument, note, destination, delaySeconds)
  setInterval(() => playSample(instrument, note, destination, delaySeconds), loopLengthSeconds * 1000)
}

fetchSample('impulses/Hangar.wav').then(convolverBuffer => {
  let convolver = audioContext.createConvolver()
  convolver.buffer = convolverBuffer
  convolver.connect(audioContext.destination)

  let instrument = 'Cor Anglais'

  // Dbmaj7add9
  // startLoop(instrument, 'F4', convolver, 19.7, 4.0)
  // startLoop(instrument, 'Ab4', convolver, 17.8, 8.1)
  // startLoop(instrument, 'C5', convolver, 21.3, 5.6)
  // startLoop(instrument, 'Db5', convolver, 22.1, 12.6)
  // startLoop(instrument, 'Eb5', convolver, 18.4, 9.2)
  // startLoop(instrument, 'F5', convolver, 20.0, 14.1)
  // startLoop(instrument, 'Ab5', convolver, 17.7, 3.1)

  // C#m9
  startLoop(instrument, 'C#4', convolver, 19.7, 4.0)
  startLoop(instrument, 'E4', convolver, 17.8, 8.1)
  startLoop(instrument, 'G#4', convolver, 21.3, 5.6)
  startLoop(instrument, 'B4', convolver, 22.1, 12.6)
  startLoop(instrument, 'D#5', convolver, 18.4, 9.2)
  startLoop(instrument, 'E5', convolver, 20.0, 14.1)

  // Em9
  // startLoop(instrument, 'E4', convolver, 19.7, 4.0)
  // startLoop(instrument, 'B4', convolver, 17.8, 8.1)
  // startLoop(instrument, 'F#5', convolver, 21.3, 5.6)
  // startLoop(instrument, 'G5', convolver, 22.1, 12.6)
  // startLoop(instrument, 'D5', convolver, 18.4, 9.2)

  // Abm9
  // startLoop(instrument, 'Ab4', convolver, 19.7, 4.0)
  // startLoop(instrument, 'B4', convolver, 17.8, 8.1)
  // startLoop(instrument, 'Gb5', convolver, 21.3, 5.6)
  // startLoop(instrument, 'Bb5', convolver, 22.1, 12.6)
  // startLoop(instrument, 'Eb5', convolver, 18.4, 9.2)
})
