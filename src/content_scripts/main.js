'use strict'
import './undoer.js'
import '../lib/pony/index.js'
import LiveRecorder from './Recorder.js'

;(function() {
	const elements = document.querySelectorAll('video, audio, canvas')
	// console.log('liverecorder', 'out?', window.liveRecorder)
	if (window.liveRecorder != null && window.liveRecorder.injected === true) {
	// console.log('liverecorder', 'in?')
		const liverecorders = document.querySelectorAll('live-recorder')
		Array.prototype.forEach.call(liverecorders, el => el.classList.remove('live-recorder-none'))
		Array.prototype.forEach.call(elements, el => {
			if (!el.hasAttribute('data-liverecorder')) {
				addRecorder(el)
			}
		})
		return
	}
	// console.log('liverecorder', 'whyyyy', window.liveRecorder)

	if (window.liveRecorder == null) {
		window.liveRecorder = {}
	}

	// console.log('liverecorder', 'whyyyy2', window.liveRecorder)
	window.liveRecorder.uniqueID = 0
	window.liveRecorder.injected = true

	window.liveRecorder.worker = new Worker(browser.extension.getURL('') + 'live-recorder-worker-bundle.js')

	// console.log('liverecorder', 'whyyyy3', window.liveRecorder)
	Array.prototype.forEach.call(elements, addRecorder)

	function addRecorder(mediaElement) {
		let rec = new LiveRecorder
		// console.log('liverecorder: CREATING FOR: ', mediaElement, rec)
		mediaElement.dataset.liverecorder = window.liveRecorder.uniqueID
		rec.setAttribute('target', window.liveRecorder.uniqueID++)
		document.body.appendChild(rec)
	}

})()

