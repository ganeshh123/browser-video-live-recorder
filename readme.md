# Live Recorder

A media recording addon for Firefox.

AMO: https://addons.mozilla.org/en-US/firefox/addon/live-recorder/

uhhh.. what else is there to say? Please report bugs, build new features, anything. Recommend posting an issue before starting work on a new feature.

## Things it needs / current bugs

Imo, most needed feature: filesize tracker. Ondata event should fire and update a "x MB" message.

A 'max size' feature. Stop recording before/upon video reaches a certain filesize (user decides).

Duration metadata has bugs. Decoding into base64 data url is not great.

Pause/play + webm duration metadata = bugged.

Title metadata would be nice.

Seeking video stops recording, not something that should happen, really. Call `requestData` or whatever, then pause and wait for onplaying event, then resume. Works? Not? Dunno.

Some ~~addon~~ about:config flag is breaking middle-clicking on the preview.

## License

Unlicense - https://unlicense.org/

aka do whatever u want

