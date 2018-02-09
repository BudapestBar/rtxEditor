var usertextFinder = (function () {
	
	var tabContentNode,
	
		insertText = function (e) {
	
			rtxEditor.addInsertedContent(e.target.innerHTML, true);
		},	
	
		deleteItem = function (e) {
			
			var id = e.target.getAttribute('data-id');
			
			utils.renderData(appRoot + 'tabs/usertextfinder.tmp', appRoot + 'api/editor.php?a=deleteUserText&id=' + id, tabContentNode);
		},
	
		init = function (placeholder, appRoot) {

			tabContentNode = placeholder;
			utils.loadStyles(appRoot + 'tabs/usertextfinder.css');
			utils.renderData(appRoot + 'tabs/usertextfinder.tmp', appRoot + 'api/editor.php?a=getUserTexts', tabContentNode);
			utils.addEvent('click', null, 'usertext-item', insertText);
			utils.addEvent('click', null, 'delete-item', deleteItem);
		};
	
	return {
		init: init
	}
})();