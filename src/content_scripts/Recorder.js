/**
 * I've no clue what's going on anymore!!!
 */
import { WritableStream, TransformStream } from 'web-streams-polyfill/ponyfill/es6'
import HyperHTMLElement from 'hyperhtml-element/esm'
import Popper from 'popper.js'
import streamsaver from 'streamsaver'
import filesize from 'pretty-bytes'
streamsaver.WritableStream = WritableStream
streamsaver.TransformStream = TransformStream
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
 * Stops recording on end, if looping. Should not do that, according to spec. -- This has been fixed.
 * Some of these could be problems from captureStream, too.
 *
 */

/*
 * Workflow: record -> (stop | close) -> open dl dialog
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
			//log('liveRecorder nulled??????')
			window.liveRecorder = {}
		}

		if (window.liveRecorder.context == null) {
			window.liveRecorder.context = new AudioContext
		}

		return window.liveRecorder.context
	}

	created(){
		//log('hello?')
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
		const {recorder,error} = this.state
		const size = this.state.size || 0
		const recording = recorder.state !== 'inactive'
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
					max-width: -moz-min-content;
					max-width: min-content;
				}
				.size {
					font-family: sans-serif;
					color: white;
					padding: 5px;
				}
				.live-recorder-hidden {
					visibility: hidden;
				}
				.live-recorder button, .live-recorder a:not(.text-link) {
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
					font-size: 25px;
					line-height: 1;
					-moz-user-select: none;
					user-select: none;
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
				.color-white {
					color: white;
				}
				.color-white a {
					color: #d4e7ff;
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

					<button type="button" title="Close" onclick=${this.handleClose}>
						❎
					</button>

				</div>

				<div class="size live-recorder-inner" id="file-size">${filesize(size)}</div>

				<div class=${[errored, 'live-recorder-inner', 'size'].join(' ')}>
					<span class="color-white">
						${error} <a class="text-link" href=${this.targetElement.src} target="_blank">Open in new tab</a>
					</span>
				</div>
			</div>
		`
	}

	get defaultState() {
		return ({
			size: 0,
			error: '',
			recorder: { 
				state: 'inactive'
			}
		})
	}

	async handleClose() {
		this.classList.add('live-recorder-none')
		this.stop()
	}

	async handleStatus() {
		log(this.handleStatus, this.state)
		if (this.state.error !== ''){
			//log('removing.')
			this.setState({
				error: ''
			})
		}
	}

	async handleStartStop(){
		log('handleStartStop')
		if (this.state == null)
			this.setState( this.defaultState )
		this.handleStatus()
		if (this.state.recorder.state  === 'inactive') {
			await this.stop()
			await this.start()
		} else {
			await this.stop()
		}
	}

	async start() {
		log('in start')
		// Capturing mutes audio (Firefox bug).
		const capture = HTMLMediaElement.prototype.captureStream 
						|| HTMLMediaElement.prototype.mozCaptureStream
		const stream = capture.call(this.targetElement)
		log(stream, 'stream')
		// "Unmute".
		// Only need to do this once.
		if (!this.audioIsConnected) {
			// Try-catch because media without audio will mess up otherwise.
			try {
				const context = LiveRecorder.audioContext
				const source = context.createMediaStreamSource(stream)
				source.connect(context.destination)
				log('pluggin')
				this.audioIsConnected = true
			} catch(e) {
				// nothing
			}
		}

		// Note to self: MediaStreamTrack.applyConstraints doesn't work on these.
		// All I get is "OverConstrainedError".
		// No changing of video fps that way.

		// https://github.com/jimmywarting/StreamSaver.js/blob/master/examples/media-stream.html
		const { readable, writable } = new TransformStream({
			transform: (chunk, ctrl) => chunk.arrayBuffer().then(b => ctrl.enqueue(new Uint8Array(b)))
		})
		const writer = writable.getWriter()
		const title = this.fileTitle + (this.fileTitle.endsWith(EXT) ? '' : EXT)
		readable.pipeTo(streamsaver.createWriteStream(title))
		// Not sure what this is about; can't see it do anything.
		// function abort() {
		// 	writable.abort()
		// }
		// window.addEventListener('unload', abort)

		this.setState({
			size: 0,
		})

		// Apparently recorder types on android = no-go?
		// https://github.com/streamproc/MediaStreamRecorder/blob/master/MediaStreamRecorder.js#L1118
		// Testing & hoping for feedback.
		// MediaRecorder actually converts filetypes with the mimetype argument.
		// Surprising, even after reading the docs...
		const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
		recorder.ondataavailable = e => {
			this.setState({
				size: this.state.size + e.data.size
			})
			writer.write(e.data)
		}


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
			recorder.onstop = () => {
				log('recorder stopped')
				// Mutes audio on stop because of the audio sink bug.
				for (const track of stream.getVideoTracks()) {
					track.stop()
				}
				// Not sure what this is about; can't see it do anything.
				// window.removeEventListener('unload', abort)
				setTimeout(() => res(writer.close()), 100)
			}
			recorder.onerror = (e) => {
				log('recorder errored', e)
				for (const track of stream.getVideoTracks()) {
					track.stop()
				}
				setTimeout(() => res(writer.close()), 100)
				// Not sure what this is about; can't see it do anything.
				// window.removeEventListener('unload', abort)
				this.stop().then(() => {
					rej({ name:'Unknown error', message: 'unlucky.' })
				})
			}
		})

		// Possible error message gets overwritten by an error with recorder?
		// Like: play() errors, now trying to recorder.start() regardless,
		//  -> error2 from recorder -> overwrite error 1.
		await this.targetElement.play().catch(e => this.error(e))

		const started = new Promise((resolve, reject) => {
			log('started', recorder)
			let resolved = false
			// This is to fix the 1frame webm bug described in readme.
			setTimeout(() => {
				log('timeouted in started', recorder)
				if (!resolved && recorder.state === 'recording') {
					this.error({
						name: 'Firefox bug',
						message: 'Seek the video to fix the filesize tracker.'
					})
					resolve()
				}
				// Assume after 1sec that it's a buggy thing.
			}, 1000)
			// Will throw (reject) if start fails.
			recorder.onstart = () => resolve(resolved = true)
			try {
				recorder.start(CHUNKSIZE)
			} catch(e) {
				resolved = true
				reject(e)
			}
		})

		// Triggers render.
		started.then(() => this.setState({ recorder }))
			.then(() => stopped)
			.catch(error => this.error(error))
		log('start finished. state:', this.state)
	}

	async error(e) {
		log('error', e, e.name, e.message)
		let error
		if (e.name === 'SecurityError') {
			error = 'Security error: open the video in its own tab.'
		} else if (e.name && e.message) {
			error = '' + e.name + ': ' + e.message
		} else {
			error = 'Undefined error. Stopped.'
		}

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
}

try{
	LiveRecorder.define('live-recorder');
} catch(e) { /* nop */ }

// eslint-disable-next-line
function log(...args) {
	// console.log('liverecorder', ...args)
}
