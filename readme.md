# Live Recorder

A media recording addon for Firefox.

AMO: https://addons.mozilla.org/en-US/firefox/addon/live-recorder/

uhhh.. what else is there to say? Please report bugs, build new features, anything. Recommend posting an issue before starting work on a new feature.

## Installation

With npm and web-ext.

`npm install`

`npm run watch`

`web-ext build`

Go to about:debugging and load the zip.

## Things it needs / current bugs

Imo, most needed feature: filesize tracker. Ondata event should fire and update a "x MB" message.

A 'max size' feature. Stop recording before/upon video reaches a certain filesize (user decides).

Duration metadata has bugs. Decoding into base64 data url is not great.

Pause/play + webm duration metadata = bugged.

Title metadata would be nice.

Seeking video stops recording, not something that should happen, really. Call `requestData` or whatever, then pause and wait for onplaying event, then resume. Works? Not? Dunno.

Some ~~addon~~ about:config flag is breaking middle-clicking on the preview.

Webm framerate, bitrate, and sample rate are not same as original. Filesizes blow up.

1 frame video (probably) does not work. Metadata segment completely missing, createObjectURL makes a corrupt video for preview, all that. Downloading still works, although video is black and obviously no duration metadata tag. Does not display an error message. Don't know where an error pops up, if anywhere. See/ask for 'wtf.webm'.

## License

Unlicense - https://unlicense.org/

aka do whatever u want

