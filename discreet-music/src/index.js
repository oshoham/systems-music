import Tone from 'tone'
import noUiSlider from 'nouislider'

import 'nouislider/distribute/nouislider.css'
import './main.css'

function initEqualizerUI(container, equalizer) {
  for (let equalizerBand of equalizer) {
    const frequency = equalizerBand.frequency.value

    const wrapper = document.createElement('div')
    const slider = document.createElement('div')
    const label = document.createElement('label')

    wrapper.classList.add('slider-wrapper')
    slider.classList.add('slider')
    label.textContent = frequency >= 1000 ? `${frequency / 1000}K` : frequency

    noUiSlider.create(slider, {
      start: 0,
      range: { min: -12, max: 12 },
      step: 0.1,
      direction: 'rtl',
      orientation: 'vertical'
    })

    slider.noUiSlider.on('update', function([value]) {
      const gain = +value
      equalizerBand.gain.value = gain
    })

    wrapper.appendChild(slider)
    wrapper.appendChild(label)
    container.appendChild(wrapper)
  }
}

function makeSynth() {
  const envelope = {
    attack: 0.1,
    release: 4,
    releaseCurve: 'linear'
  }
  const filterEnvelope = {
    baseFrequency: 200,
    octaves: 2,
    attack: 0,
    decay: 0,
    release: 1000
  }
  return new Tone.DuoSynth({
    harmonicity: 1,
    volume: -20,
    voice0: {
      oscillator: { type: 'sawtooth' },
      envelope,
      filterEnvelope
    },
    voice1: {
      oscillator: { type: 'sine' },
      envelope,
      filterEnvelope
    },
    vibratoRate: 0.5,
    vibratoAmount: 0.1
  })
}

const leftSynth = makeSynth()
const rightSynth = makeSynth()

const leftPanner = new Tone.Panner(-0.5)
const rightPanner = new Tone.Panner(0.5)

const echo = new Tone.FeedbackDelay('16n', 0.2)

const delay = Tone.context.createDelay(6.0)
delay.delayTime.value = 6.0

const delayFade = Tone.context.createGain()
delayFade.gain.value = 0.75

const EQUALIZER_CENTER_FREQUENCIES = [
  100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250,
  1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000
]

const equalizer = EQUALIZER_CENTER_FREQUENCIES.map(function(frequency) {
  const filter = Tone.context.createBiquadFilter()
  filter.type = 'peaking'
  filter.frequency.value = frequency
  filter.Q.value = 4.31
  filter.gain.value = 0
  return filter
})

leftSynth.connect(leftPanner)
rightSynth.connect(rightPanner)

leftPanner.connect(equalizer[0])
rightPanner.connect(equalizer[0])

equalizer.forEach(function(equalizerBand, index) {
  if (index < equalizer.length - 1) {
    equalizerBand.connect(equalizer[index + 1])
  } else {
    equalizerBand.connect(echo)
  }
})

echo.toMaster()
echo.connect(delay)
delay.connect(Tone.context.destination)
delay.connect(delayFade)
delayFade.connect(delay)

const eq = document.createElement('div')
eq.classList.add('eq')

document.body.appendChild(eq)

initEqualizerUI(eq, equalizer)

new Tone.Loop(function(time) {
  // Trigger C5, and hold for a full note (measure) + two 1/4 notes
  leftSynth.triggerAttackRelease('C5', '1:2', time);
  // Switch note to D5 after two 1/4 notes without retriggering
  leftSynth.setNote('D5', '+0:2');

  // Trigger E4 after 6 measures and hold for two 1/4 notes.
  leftSynth.triggerAttackRelease('E4', '0:2', '+6:0');

  // Trigger G4 after 11 measures + a two 1/4 notes, and hold for two 1/4 notes.
  leftSynth.triggerAttackRelease('G4', '0:2', '+11:2');

  // Trigger E5 after 19 measures and hold for 2 measures.
  // Switch to G5, A5, G5 after delay of a 1/4 note + two 1/16 notes each.
  leftSynth.triggerAttackRelease('E5', '2:0', '+19:0');
  leftSynth.setNote('G5', '+19:1:2');
  leftSynth.setNote('A5', '+19:3:0');
  leftSynth.setNote('G5', '+19:4:2');
}, '34m').start()

new Tone.Loop(function(time) {
  // Trigger D4 after 5 measures and hold for 1 full measure + two 1/4 notes
  rightSynth.triggerAttackRelease('D4', '1:2', '+5:0');
  // Switch to E4 after one more measure
  rightSynth.setNote('E4', '+6:0');

  // Trigger B3 after 11 measures + two 1/4 notes + two 1/16 notes. Hold for one measure
  rightSynth.triggerAttackRelease('B3', '1m', '+11:2:2');
  // Switch to G3 after a 1/2 note more
  rightSynth.setNote('G3', '+12:0:2');

  // Trigger G4 after 23 measures + two 1/4 notes. Hold for a half note.
  rightSynth.triggerAttackRelease('G4', '0:2', '+23:2');
}, '37m').start()

Tone.Transport.start()
