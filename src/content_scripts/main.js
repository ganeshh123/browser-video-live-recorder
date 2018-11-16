'use strict'
import './undoer.js'
import '../lib/pony/index.js'
import LiveRecorder from './Recorder.js'

;(async () => {
	const elements = document.querySelectorAll('video, audio, canvas')

	if (window.liveRecorder && window.liveRecorder.injected === true) {
		const liverecorders = document.querySelectorAll('live-recorder')
		Array.prototype.forEach.call(liverecorders, el => el.classList.remove('live-recorder-none'))
		Array.prototype.forEach.call(elements, el => {
			if (!el.hasAttribute('data-liverecorder')) {
				addRecorder(el)
			}
		})
		return
	}

	if (window.liveRecorder == null) {
		window.liveRecorder = {}
	}

	window.liveRecorder.uniqueID = 0
	window.liveRecorder.injected = true

	window.liveRecorder.worker = new Worker(browser.extension.getURL('') + 'live-recorder-worker-bundle.js')

	Array.prototype.forEach.call(elements, addRecorder)

})().catch(e => console.error('LiveRecorder main.js error:', e))
	

function addRecorder(mediaElement) {
	let rec = new LiveRecorder
	mediaElement.dataset.liverecorder = window.liveRecorder.uniqueID
	rec.setAttribute('target', window.liveRecorder.uniqueID++)
	document.body.appendChild(rec)
}

