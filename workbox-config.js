module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{html,ico,json,css,png,jpg,js}'
	],
	swDest: 'public/sw-base.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
}; 