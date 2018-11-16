module.exports = {
	ignoreFiles: [
		'src/**/*'
	],
	run: {
		startUrl: [
			'./lit-element.html',
			'about:debugging'
		]
	},
	build: {
		overwriteDest: true
	},
	ignoreFiles: [
		'**/*.webm',
		'small.ogv',
		'**/!(manifest).json',
		'**/*.html',
		'trash',
		'src/lib',
		'src/content_scripts'
	]
};

