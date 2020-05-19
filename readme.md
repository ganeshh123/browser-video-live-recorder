# Live Recorder

A media recording addon for Firefox.

AMO: https://addons.mozilla.org/en-US/firefox/addon/live-recorder/

uhhh.. what else is there to say? Please report bugs, build new features, anything. Recommend posting an issue before starting work on a new feature.

## Installation

With npm and web-ext.

`npm install`

`npm run build`

`web-ext build`

Go to about:debugging and load the zip.

Or for developing, you'll want:

`npm run start` and `web-ext run` instead of `build`. Still run install, though.

Install web-ext with `npm i -g web-ext` (or `-D`, and use `npx web-ext ...`, I guess).

## Things it needs / current bugs

Metadata is messed up. No title, no duration. Firefox bug causes duration missing, title is just forget-about-it.

Webm framerate, bitrate, and sample rate are not same as original. Filesizes blow up.

1 frame video is very buggy. (Test webm.)[https://gitlab.com/losnappas/live-recorder/uploads/6d18fe0066e26a0d49acf1f8a85e3892/wtf.webm] But it starts recording after you seek o_o. If you spam the "record" button, it actually starts recording many times!!! And won't stop when you stop!!!!!!!

Audio gets lost at the end if media isn't looping, but not otherwise.

## License

Unlicense - https://unlicense.org/

aka do whatever u want

