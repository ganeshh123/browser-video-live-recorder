async function inject() {
	const files = [
		'/bundle.js'
	]
	await browser.tabs.insertCSS({
		code: `
		live-recorder.live-recorder-none {
			display: none !important;
		}
		`
	})
	for (let file of files) {
		await browser.tabs.executeScript({
			file: file
		}).catch(console.error)
	}
}

browser.browserAction.onClicked.addListener(inject)

