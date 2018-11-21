// https://github.com/yusitnikov/fix-webm-duration/
// ^with slight modifications.
import ysFixWebmDuration from '../../lib/fix-webm-duration/fix-webm-duration.js'

/** 
 * Getting duration tag right w/o tracking it during recording.
 * TODO: maybe move duration fetching into bg to avoid decoding twice.
 * ^^^ CSP problems?
 */
function sendURLForDuration(blob) {
	// Using FileReader to bypass cross-origin issues.
	let reader = new FileReader

	// So this is where promises are useful, too.
	reader.onload = () => {
		//console.log('posted for duration')
		postMessage({url: reader.result})
	}
	reader.readAsDataURL(blob)	
}

onmessage = async (e) => {

	// ??????????????????????????
	//if (!e.origin.includes(browser.extension.getURL("")))
	//	return

	const buggyBlob = e.data.buggyBlob
	const duration = e.data.duration

	if (duration != null) {
		//console.log('duration:', duration)
		const blob = await ysFixWebmDuration(buggyBlob, (duration * 1000))
		postMessage(blob)	
	} else {
		//console.log('finished working.')
		sendURLForDuration(buggyBlob)
	}
}

