async function inject() {
	const files = [
		'/bundle.js'
	]
	for (let file of files) {
		await browser.tabs.executeScript({
			file: file
		}).catch(e => console.error('WHAT?', e))
	}
}

browser.browserAction.onClicked.addListener(inject)

