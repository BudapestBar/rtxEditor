var lawFinder = (function () {

	var ready = false,
		paragraphIndex = {},
		appRoot,
		utdata,
		lawWrapper,
		lawContainer,
		searchResults,
		searchBar,
		searchField,
		ctxToolbar,

		findText = function (text) {

			var result = {}, data, html = '';

			if (parseInt(text).toString() === text) {
				showParagraph(text);
				utils.removeClass(searchBar, 'back');
				return;
			}
			for (var i in paragraphIndex) {
				if (paragraphIndex[i].indexOf(text) !== -1) {
					result[i] = paragraphIndex[i];
				}
			}
			for (var i in result) {
				data = result[i].split('-:::-');
				html += '<div class="result" data-ui="search-result" data-pid="' + i + '" data-phrase="' + text + '">';
				html += '<span class="paragraph">' + i + ' §</span>'
				html += '<p>' + (data[1].replace(/<(.*?)>/g, '').substring(0, 200).replace(/\(.*?\)/, ''));
				html += '<span class="path"><b>' + data[0].replace(/\&raquo\; #empty/g, '') + '</b></span>';
				html += '</p>';
				html += '<span class="arrow"></span>';
				html += '</div>';
			}
			searchResults.innerHTML = html;
			utils.addStyle(searchResults, {height: lawWrapper.offsetHeight -55 + 'px', top: '40px'});
			utils.addStyle(lawContainer, {left: lawWrapper.offsetWidth + 'px'});
			searchField.blur();
			searchField.disabled = true;
			utils.removeClass(searchBar, 'back');
			utils.addClass(searchBar, 'clear');
		},

		insertSelectedText = function (e) {			
			
			var selection = window.getSelection();
				tempContainer = document.createElement("div");
			
            for (var i = 0; i < selection.rangeCount; i++) {
                tempContainer.appendChild(selection.getRangeAt(i).cloneContents());
            }
			rtxEditor.addInsertedContent(tempContainer.innerHTML);
			hideCtxToolbar(e);			
		},
		
		removeHighlite = function () {

			var hl = utils.qsa('.highlite', lawContainer);

			for (var i = 0; i < hl.length; i++) {
				var tn = document.createTextNode(hl[i].textContent);
				hl[i].parentNode.insertBefore(tn, hl[i]);
				hl[i].parentNode.removeChild(hl[i]);
			}
		},

		closeAllLevel = function () {

			var containers = utils.qsa('.law-container .show');

			for (var i = 0; i < containers.length; i++) {
				utils.removeClass(containers[i], 'show');
			}
		},

		openAllLevel = function () {

			var containers = utils.qsa('.container', lawContainer);

			for (var i = 0; i < containers.length; i++) {
				utils.addClass(containers[i], 'show');
			}
		},

		showParagraph = function (paragraph, highliteText) {

			var pNode = utils.qs('div[data-paragraph="' + paragraph + '"]'),
				pContent = pNode;

			closeAllLevel();
			while (pNode !== lawContainer) {
				if (utils.hasClass(pNode, 'container')) {
					utils.addClass(pNode, 'show');
				}
				pNode = pNode.parentNode;
			}
			removeHighlite();
			if (highliteText) {
				pContent.innerHTML = pContent.innerHTML.split(highliteText).join('<span class="highlite" data-ui="law-contents">' + highliteText +'</span>');
			}
			lawContainer.scrollTop = utils.getOffset(utils.qs('[data-paragraph="' + paragraph + '"] strong'), lawContainer)[1] - 10;
			utils.addStyle(lawContainer, {left: '0px', zIndex: 10});
			utils.removeClass(searchBar, 'clear');
			utils.addClass(searchBar, 'back');
		},

		showCtxToolbar = function () {

			var selection = window.getSelection(),
				txt = selection.toString(),
				choords = selection.getRangeAt(0).getBoundingClientRect(),
				left = choords.x + (choords.width / 2) - (ctxToolbar.offsetWidth / 2),
				top = choords.y - ctxToolbar.offsetHeight - 10;

			if (txt.replace(/ /g, '') !== '') {
				utils.addStyle(ctxToolbar, {
					visibility: 'visible',
					left: (left >= 0 ? left : 0) + 'px',
					top:  (top >= 0 ? top : 0) + 'px'
				});
			}
		},

		hideCtxToolbar = function (e) {

			utils.addStyle(ctxToolbar, {
				visibility: 'hidden',
				left: '-1000px',
				top: '-1000px'
			});
			e.preventDefault();
		},

		selectParagraph = function (e) {

			if (e.target.nodeName.toLowerCase() === 'strong') {
				var paragraph = e.target.parentNode.parentNode,
					range = document.createRange(),
					selection = window.getSelection();

				range.selectNodeContents(paragraph);
				selection.removeAllRanges();
				selection.addRange(range);
				showCtxToolbar();
				e.preventDefault();
			}
		},

		createMarkup = function (utdata) {

			var html = '';

			utdata = JSON.parse(utdata);
			for (var a in utdata) {
				html += '<div class="container volume" data-ui="law-contents">';
				html += '<h1 class="header" data-ui="collapsible">' + a + '</h1>';
				html += '<div class="content" data-ui="law-contents">';
				for (var b in utdata[a]) {
					html += '<div class="container chapter' + (b === '#empty' ? ' no-header' : '') + '" data-ui="law-contents">';
					html += '<h2 class="header" data-ui="collapsible">' + (b === '#empty' ? '' : b.replace(/-/, '<br>')) + '</h2>';
					html += '<div class="content" data-ui="law-contents">';
					for (var c in utdata[a][b]) {
						html += '<div class="container section' + (c === '#empty' ? ' no-header' : '') + '" data-ui="law-contents">';
						html += '<h3 class="header" data-ui="collapsible">' + (c === '#empty' ? '' : c) + '</h3>';
						html += '<div class="content" data-ui="law-contents">';
						for (var d in utdata[a][b][c]) {
							paragraphIndex[parseInt(d)] = a + ' &raquo; ' + b + ' &raquo; ' +  c + '-:::-' + utdata[a][b][c][d].join();
							html += '<div class="container paragraph" data-paragraph="' + parseInt(d) + '" data-ui="law-contents">';
							html += '<p data-ui="law-contents">';
							html += '<strong class="header" data-ui="collapsible">' + d + ' </strong>';
							html += '<span data-ui="law-contents">' + utdata[a][b][c][d].join('</span></p><p data-ui="law-contents"><span data-ui="law-contents">');
							html += '</span></p>';
							html += '</div>';
						}
						html += '</div>';
						html += '</div>';
					}
					html += '</div>';
					html += '</div>';
				}
				html += '</div>';
				html += '</div>';
			}
			lawContainer.innerHTML = html;
		},

		handleEvents = function () {

			utils.addEvent('click', '.law-container', 'collapsible', function (e) {
				var trg = e.target;
				while (!utils.hasClass(trg, 'container') && (trg = trg.parentNode));
				utils.toggleClass(trg, 'show');
				removeHighlite();
			})

			utils.addEvent('keypress', lawWrapper, 'search-term', function (e) {
				if (e.keyCode === 13) {
					findText(e.target.value);
					utils.qs('.search-bar input').blur();
				}
			})

			utils.addEvent('click', searchResults, 'search-result', function (e) {
				showParagraph(e.target.getAttribute('data-pid'), e.target.getAttribute('data-phrase'));
			});

			utils.addEvent('click', lawWrapper, 'back-to-results', function () {
				utils.addStyle('.law-container', {left: utils.qs('.law-wrapper').offsetWidth + 'px'});
				removeHighlite();
				utils.removeClass('.search-bar', 'back');
				utils.addClass('.search-bar', 'clear');
			});

			utils.addEvent('click', lawWrapper, 'clear-search', function () {
				utils.addStyle('.law-container', {left: '0px'});
				utils.addStyle('.search-results', {height: '0px', top: '0px'});
				utils.qs('.search-bar input').value = '';
				utils.removeClass('.search-bar', 'clear');
				utils.removeClass('.search-bar', 'back');
				utils.qs('.search-bar input').disabled = false;
				removeHighlite();
				closeAllLevel();
			});

			utils.addEvent('click', lawWrapper, 'search', function () {
				findText(utils.qs('.search-bar input').value);
			});

			utils.addEvent('mouseup', '.law-container', 'law-contents', showCtxToolbar)

			utils.addEvent('contextmenu', '.law-container', 'collapsible', selectParagraph)

			utils.addEvent('click', lawWrapper, 'ctx-toolbar-overlay', hideCtxToolbar)

			utils.addEvent('mousedown', lawWrapper, 'insert-law-text', insertSelectedText)

			utils.addEvent('contextmenu', lawWrapper, 'ctx-toolbar-overlay', hideCtxToolbar)
		};

		init = function (placeholder, appRoot) {

			appRoot = appRoot;
		
			utils.renderData(appRoot + 'tabs/lawfinder.tmp', {}, placeholder, false, function () {
				lawWrapper = utils.qs('.law-wrapper');
				lawContainer = utils.qs('.law-container');
				searchResults = utils.qs('.search-results');
				searchBar = utils.qs('.search-bar');
				searchField = utils.qs('.search-bar input');
				ctxToolbar = utils.qs('.ctx-toolbar');
				if (ready === false) {
					utils.loadStyles(appRoot + 'tabs/lawfinder.css');
					utils.loadData(appRoot + 'api/uttv.json', function (r) {
						utdata = r;
						createMarkup(utdata);
					});
					handleEvents();
					ready = true;
				}
				else {
					createMarkup(utdata);
				}
			});
		};

	return {
		init: init
	}
})();



