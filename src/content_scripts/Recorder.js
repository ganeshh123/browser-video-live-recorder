'use strict'
import HyperHTMLElement from 'hyperhtml-element/esm'
import Popper from 'popper.js'
import timer from 'minimal-timer'
const EXT = '.webm'
// Passed to MediaRecorder.start as `timeslice` variable.
// Smaller chunksize is nice since, in case of errors, it has almost always stored something.
// No losing 15mins of recording for one error.
const CHUNKSIZE = 500

/** 
 * All in all, the mozCaptureStream is (still) very buggy.
 *
 * [1] https://bugzilla.mozilla.org/show_bug.cgi?id=966247 
 * TL;DR: playbackRate is set to 1,and changing it will not work once recording.
 *
 * https://w3c.github.io/mediacapture-fromelement/#dom-htmlmediaelement-capturestream
 * "Muting the audio on a media element does not cause the capture to produce
 * silence, nor does hiding a media element cause captured video to stop.
 * Similarly, the audio level or volume of the media element does not affect
 * the volume of captured audio."
 *
 *
 * Audio gets muted:
 * [2] https://bugzilla.mozilla.org/show_bug.cgi?id=1178751
 *
 * MediaRecorder:
 * Errors on seeking. Always.
 * Stops recording on end, if looping. Should not do that, according to spec.
 * Some of these could be problems from captureStream, too.
 *
 */

/*
 * Workflow: record -> pauses &plays -> stop -> "preparing" -> "processing" -> final
 */
export default class LiveRecorder extends HyperHTMLElement {

	static get observedAttributes() {
		return ['target']
	}

	/**
	 * Used for unmuting audio.
	 * https://bugzilla.mozilla.org/show_bug.cgi?id=1178751
	 * ^No movement in years.
	 */
	static get audioContext() {
		if (window.liveRecorder == null) {
			log('liveRecorder nulled??????')
			window.liveRecorder = {}
		}

		if (window.liveRecorder.context == null) {
			window.liveRecorder.context = new AudioContext
		}

		return window.liveRecorder.context
	}

	created(){
		log('hello?')
		this.targetElement = document.querySelector(`[data-liverecorder="${this.target}"]`) 
		//log(this.targetElement, this.state, this.setState, this.data)
		if (this.targetElement != null) {
			this._shadowRoot = this.attachShadow({mode: 'closed'})
			this.popper = new Popper(this.targetElement, this, {
				placement: 'bottom'
			})

			// this.data doesn't affect render.
			this.data = []
			this.audioIsConnected = false
			// Things don't need 'new' "now"?
			this.timer = timer()

			let title = this.targetElement.src.split('/')
			title = title[title.length-1]
			if (title === '') {
				title='unnamed'
			}
			this.fileTitle = title

			// MediaRecorder doesn't do well with a lot of things; even this seems to be of no help.
			// It'll just stop recording. Hopefully some day some day things will look up. (^-^)
			// for ( let ev of [ 'ended', 'stalled', 'seeking', 'waiting', 'emptied' ] ) {
			//  // Note: handlePause argument removed since making this.
			// 	this.targetElement.addEventListener(ev, () => this.handlePause(true))
			// }

			this.render()
		}
	}

	render() {
		const {recorder, downloadURL, error, processing, preparing, previewURL} = this.state
		const downloadsAvailable = downloadURL !== ''
		const previewsAvailable = previewURL !== ''
		const title = this.fileTitle + (this.fileTitle.endsWith(EXT) ? '' : EXT)
		const recording = recorder.state !== 'inactive'
		const paused = recorder.state === 'paused'
		const errored = error === '' ? 'live-recorder-none' : ''
		// Using handleX style because things bug out otherwise. Maybe something to do with the polyfill.
		return this.html`
			<style>
				:host(.live-recorder-none) {
					display: none !important;
				}
				:host {
					z-index: 2147483647;
					display: block;
				}
				.live-recorder {
					all: initial;
					display: block;
					font-family: "Twemoji Mozilla";
					max-width: min-content;
				}
				.live-recorder-hidden {
					visibility: hidden;
				}
				.live-recorder button, .live-recorder a {
					font-family: inherit;
					-moz-appearance: button;
					appearance: button;
					background-color: white;
					border: none;
					border-radius: 5px;
					padding: 0.2em 0.7em;
					margin: 5px;
					text-align: center;
					text-decoration: none;
					cursor: pointer;
					font-family: inherit;
					font-size: 100%;
					line-height: 1;
					-moz-user-select: none;
				}
				.live-recorder-close {
					margin-left: auto;
				}
				.live-recorder-none {
					display: none !important;
				}
				.live-recorder-inner {
					display: flex;
					justify-content: space-between;
					align-items: baseline;
					background: #5f5f5f;
				}
				.live-recorder-disabled {
					cursor: wait !important;
					backgound-color: #ccc !important;
				}
			</style>
			<div class="live-recorder">
				<div class="live-recorder-inner">
					<button onclick=${this.handleStartStop}
						title=${!recording ? 'Record' : 'Stop'}
						type="button"
						>
						${ !recording ? '⏺️' : '⏹️' }
					</button>

					<button onclick=${this.handlePause}
						type="button"
						title=${paused ? 'Continue recording' : 'Pause recording' }
						class=${!recording ? 'live-recorder-hidden' : ''}
						>
						${paused ? '▶️' : '⏸️'}
					</button>

					<a
						class=${!previewsAvailable ? 'live-recorder-hidden' : ''}
						title="Preview"
						href=${previewURL}
						rel="noopener"
						>
						🎦
					</a>

					<button
						type="button"
						disabled=${processing}
						onclick=${this.handleSave}
						title="Process metadata for downloading"
						class=${!previewsAvailable ? 'live-recorder-hidden' : !preparing ? 'live-recorder-none' : ''}
						>
						🔽
					</button>
					<!-- <a> around <button> is not valid xhtml x.x -->
					<a href=${downloadURL} 
						class=${[(!downloadsAvailable && !processing) ? 'live-recorder-none' : '',
								processing ? 'live-recorder-disabled' : ''].join(' ')}
						download=${title}
						title=${processing ? 'Processing...' :
									('Download '+title+'.\nMiddle click to open in a new tab.')}
						>
						${ processing ? '⏱️' : '⏏️' }
					</a>

					<button type="button" title="Close" onclick=${this.handleClose}>
						❎
					</button>

				</div>

				<div class=${[errored, 'live-recorder-inner'].join(' ')}>
					<span>
						${error} 
					</span>
				</div>
			</div>
		`
	}

	get defaultState() {
		return ({
			downloadURL: '',
			previewURL: '',
			// Inserting duration tag into metadata takes a bit of time.
			processing: false,
			// For the down arrow button.
			preparing: false,
			error: '',
			recorder: { 
				state: 'inactive'
			}
		})
	}

	async handleClose() {
		this.classList.add('live-recorder-none')
		this.stop()
		this.data=[]
		this.revokeExistingURL()
	}

	async handleStatus() {
		log(this.handleStatus, this.state)
		if (this.state.error !== ''){
			log('removing.')
			this.setState({
				error: ''
			})
		}
	}

	/**
	 * TODO: fix bug:
	 * Start rec + pause spam made start rec button stuck.
	 *
	 * @param force bool Force a pause instead of dynamic pause/resume.
	 */
	async handlePause() {
		log('pausing!')

		try {
			// Pause and resume are glitched and don't emit events.
			switch (this.state.recorder.state) {
				case 'recording':
					this.state.recorder.pause()
					this.timer.stop()
					break
				case 'paused':
					this.targetElement.play()
					this.state.recorder.resume()
					this.timer.resume()
					break
				default:
					log('handlepause switch defaulted. state:', this.state)
			}
		} catch(e) {
			console.error('something reasonably horrible happened in handlePause:',e)
		}
		this.render()
	}

	async handleStartStop(){
		log('startstop')
		log(this, this.targetElement, this.data, this.state)
		log("HELLO?")
		log('this',this.state)
		if (this.state == null)
			await this.setState( this.defaultState )
		log(this.state)
		this.handleStatus()
		log(this.state)
		if (this.state.recorder.state  === 'inactive') {
			log('start')
			// Call stop first. No harm in doing so.
			await this.stop()
			this.start()
			log('started', this.state)
		} 
		else {
			log('stop')
			this.stop()
			log('stopped', this.state)
		}
	}

	async start() {
		log('in start')
		// Capturing mutes audio (Firefox bug).
		const capture = HTMLMediaElement.prototype.captureStream 
						|| HTMLMediaElement.prototype.mozCaptureStream
		const stream = capture.call(this.targetElement)
		// "Unmute".
		// Only need to do this once.
		if (!this.audioIsConnected) {
			const context = LiveRecorder.audioContext
			const source = context.createMediaStreamSource(stream)
			source.connect(context.destination)
			log('pluggin')
			this.audioIsConnected = true
		}

		// Apparently recorder types on android = no-go?
		// https://github.com/streamproc/MediaStreamRecorder/blob/master/MediaStreamRecorder.js#L1118
		// Testing & hoping for feedback.
		// MediaRecorder actually converts filetypes with the mimetype argument.
		// Surprising, even after reading the docs...
		const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
		const data = []
		recorder.ondataavailable = e => { log(e); data.push(e.data) }

		// These don't work.
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1363915
		// Update: they work now. v.65+. What was I supposed to do with em?
		recorder.onpause = log
		recorder.onresume = log

		/**
		 * Considering 'recorder' is instance specific,
		 * it's okay to use .onstop type listeners.
		 * One usually wants to avoid them in extensions
		 * as they steal potential existing listeners
		 * by the website.
		 */
		const stopped = new Promise((res, rej) => {
			recorder.onstop = () => res(this.timer.stop())
			recorder.onerror = () => {
				this.stop().then(() => {
					this.timer.stop()
					rej({ name:'Unknown error', message: 'unlucky.' })
				})
			}
		})

		// Possible error message gets overwritten by an error with recorder?
		// Like: play() errors, now trying to recorder.start() regardless,
		//  -> error2 from recorder -> overwrite error 1.
		await this.targetElement.play().catch(e => this.error(e))

		const started = new Promise(res => {
			// Will throw (reject) if start fails.
			recorder.onstart = () => res(this.timer.start())
			recorder.start(CHUNKSIZE)
		})

		this.data = data

		// Triggers render.
		started.then(() => this.setState({ recorder }))
			.then(() => stopped)
			.catch(error => this.error(error))
			.then(() => this.revokeExistingURL())
			.then(() => this.prepare())
			.catch(error => this.error(error))
		log('start finished. state:', this.state)
	}

	async error(e) {
		log('error', e, e.name, e.message)
		let error
		if (e.name === 'SecurityError') {
			error = 'Security error: open the video in its own tab.'
		} else if (e.name && e.message) {
			log( 'hello??', this.state, this.data )
			error = 'Error. ' + e.name + ': ' + e.message
		} else {
			error = 'Undefined error. Stopped.'
		}

		log( this.state )

		this.setState({
			error
		})
	}

	async stop() {
		log('in stop', this.state)
		if (this.state.recorder && this.state.recorder.state !== 'inactive') { 
			this.state.recorder.stop()
			this.render()
		}
	}

	handleSave() {
		log('handlesaved')
		this.save()
	}

	/**
	 * Wire up the save button.
	 */
	async save() {
		this.setState({
			processing: true,
			preparing: false
		})
		log('preocessing')
		const buggyBlob = new Blob(this.data, { type: 'video/webm' })
		// Send to worker.
		const blob = await workIt(buggyBlob, this.timer.elapsedTime())
		// Creating the url in the worker results in CSP fiesta.
		// "Cannot load from moz-exte...."
		const downloadURL = URL.createObjectURL(blob)
		this.setState({
			downloadURL,
			processing: false
		})	
		
	}

	/**
	 * Revoke to save memory.
	 */
	async revokeExistingURL() {
		if (this.state.downloadURL !== '' || this.state.previewURL !== '') {
			URL.revokeObjectURL(this.state.downloadURL)
			URL.revokeObjectURL(this.state.previewURL)
			this.setState({
				downloadURL: '',
				previewURL: ''
			})
			//Next line bugs out.
			//Fixing it is not worth the time.(?)
			//this.data = []
		}
	}

	async prepare() {
		this.stop()
		if ( this.data.length === 0 ) {
			return
		}
		this.setState({
			preparing: true,
			previewURL: URL.createObjectURL( new Blob(this.data, { type: 'video/webm' }) )
		})
	}

}

try{
	if (!window.liveRecorder)
		LiveRecorder.define('live-recorder');
}catch(e){console.error(e)}

// eslint-disable-next-line
function log(...args) {
	console.log('liverecorder', ...args)
}

/**
 * Messaging between worker to create a good blob.
 * Good = duration fixed.
 * Before changing this, consider that there are a lot of CSP issues.
 */
function workIt(buggyBlob, duration){
	log('duration', duration)
	return new Promise((resolve) => {
		window.liveRecorder.worker.onmessage = e => {
			resolve(e.data)
		}
		window.liveRecorder.worker.postMessage({buggyBlob, duration})
	})
}

