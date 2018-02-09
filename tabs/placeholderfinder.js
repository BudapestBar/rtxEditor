var placeholderFinder = (function () {

	var insertPlaceholder = function (e) {
		
			rtxEditor.addPlaceholder(e.target.textContent);
		},	
	
		init = function (placeholder, appRoot) {

			utils.loadStyles(appRoot + '/tabs/placeholderfinder.css');
			utils.renderData(appRoot + '/tabs/placeholderfinder.tmp', appRoot + '/api/placeholders.json', placeholder);
			utils.addEvent('click', null, 'placeholder-item', insertPlaceholder);
		};
	
	return {
		init: init
	}

})();