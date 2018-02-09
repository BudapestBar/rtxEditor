
	var rtxEditor = (function () {

		var	appRoot = 'http://localhost/contenteditor/',
			userTextAPI = appRoot + 'api/editor.php?a=saveUserText',
			lastEditor = null,
			activeEditor = null,
			holdFocus = false,
			isCtx = false,
			pasteLock = false,
			ctxMenu = null,

			formatOptions = {
				undo: 'undo',
				redo: 'redo',
				bold: 'bold',
				italic: 'italic',
				uline: 'underline',
				left: 'justifyleft',
				center: 'justifycenter',
				right: 'justifyright',
				olist: 'insertorderedlist',
				ulist: 'insertunorderedlist'
			},

			insertNode = function (node, isBlock) {

				var sel, range, parent, lastChild = null;

				pasteLock = true;
				if (window.getSelection && (sel = window.getSelection()).rangeCount) {
					range = sel.getRangeAt(0);
					range.collapse(true);
					setTimeout(function () {
						if (isBlock) {
							parent = range.startContainer;
							while (parent.nodeName.toLowerCase() !== 'p' && parent.nodeName.toLowerCase() !== 'div') {
								lastChild = parent;
								parent = parent.parentNode;
								if (utils.hasClass(parent, 'rtx-area')) {
									parent = lastChild;
									break;
								}
							}
							if (lastChild === null) {
								range.insertNode(node);
							}
							else {
								parent.parentNode.insertBefore(node, parent.nextSibling);
							}
						}
						else {
							range.insertNode(node);
						}
						range.setStartAfter(node);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
					}, 10);
				}
				setTimeout(function () {
					pasteLock = false;
				}, 500);
			},

			showCtx = function () {

				var sel, txt;

				if ((sel = window.getSelection())) {
					txt = sel.toString();
					if (txt !== '') {
						showCtxToolbar(sel);
					}
					else {
						showCtxMenu();
					}
				}
			},

			hideCtx = function () {

				if (utils.qsa('.ctx-placeholder').length > 0) {
					hideCtxMenu();
				}
				else {
					hideCtxToolbar();
				}
			},

			showCtxMenu = function () {

				var placeholder, panelArrow, ctxOffset, rtxOffset, scrollPos, overhangTop, overhangBottom, contentContainer;

				placeholder = document.createElement("span");
				placeholder.contentEditable = false;
				utils.addClass(placeholder, 'ctx-placeholder');
				insertNode(placeholder);
				setTimeout(function () {
					utils.addStyle(ctxMenu, {display: 'block'});
					panelArrow = utils.qs('.ctx-menu > .arrow');
					contentContainer = utils.qs('.ctx-menu .ctx-content');
					ctxOffset = utils.getOffset(placeholder);
					rtxOffset = utils.getOffset(activeEditor);
					if (window.innerWidth - (ctxOffset[0] + 25) > ctxMenu.offsetWidth) {
						utils.addStyle(ctxMenu, {left: ctxOffset[0] + 25 + 'px'});
						utils.removeClass(panelArrow, 'right');
						utils.addClass(panelArrow, 'left');
					}
					else if (ctxOffset[0] - 10 - ctxMenu.offsetWidth > 5) {
						utils.addStyle(ctxMenu, {left: ctxOffset[0] - 10 - ctxMenu.offsetWidth + 'px'});
						utils.removeClass(panelArrow, 'left');
						utils.addClass(panelArrow, 'right');
					}
					else {
						utils.addStyle(ctxMenu, {left: '5px'});
						utils.removeClass(panelArrow, 'left');
						utils.addClass(panelArrow, 'right');
					}
					utils.addStyle(ctxMenu, {top: ctxOffset[1] - 100 + 'px'});
					scrollPos = utils.qs('html').scrollTop + utils.qs('body').scrollTop;
					overhangTop = -1 * (ctxMenu.offsetTop - scrollPos - 5);
					overhangBottom = ctxMenu.offsetTop + ctxMenu.offsetHeight + 30 - scrollPos - window.innerHeight;
					if (overhangBottom > 0) {
						utils.addStyle(ctxMenu, {top: ctxMenu.offsetTop - overhangBottom + 'px'});
					}
					if (overhangTop > 0) {
						utils.addStyle(ctxMenu, {top: ctxMenu.offsetTop + overhangTop + 'px'});
					}
					utils.addStyle(panelArrow, {top: ctxOffset[1] - ctxMenu.offsetTop - 20 + 'px'});
					lastEditor = activeEditor;
					activeEditor.area.blur();
					isCtx = true;
				}, 20);
			},

			hideCtxMenu = function () {

				var placeholders = utils.qsa('.ctx-placeholder'),
					range = document.createRange(),
					selection = window.getSelection(),
					startNode = placeholders[0];

				startNode.contentEditable = true;
				range.setStart(startNode, 0);
				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
				startNode.focus();
				for (var i = 0; i < placeholders.length; i++) {
					placeholders[i].parentNode.removeChild(placeholders[i]);
				}
				utils.addStyle(ctxMenu, {display: 'none'});
				isCtx = false;
			},

			showCtxToolbar = function (selection) {

				var toolbar = utils.qs('.ctx > .ctx-toolbar'),
					choords = selection.getRangeAt(0).getBoundingClientRect(),
					left = choords.x + (choords.width / 2) - (toolbar.offsetWidth / 2),
					top = choords.y - toolbar.offsetHeight - 10;

				utils.addStyle(toolbar, {
					visibility: 'visible',
					left: (left >= 0 ? left : 0) + 'px',
					top:  (top >= 0 ? top : 0) + 'px'
				});
				isCtx = true;
			},

			hideCtxToolbar = function () {

				utils.addStyle('.ctx > .ctx-toolbar', {
					visibility: 'hidden',
					left: '-1000px',
					top: '-1000px'
				});
				isCtx = false;
			},

			showPreview = function () {

				var placeholders = utils.qsa('.rtx-placeholders'),
					remoteData;
				
				for (var ph, i = 0; i < placeholders.length; i++) {
					ph = placeholders[i];
					remoteData = ph.getAttribute('data-remotedata');
					utils.addClass(ph, 'preview');
					if (remoteData !== null) {
						ph.innerHTML = remoteData;		
					}
				}
				utils.addClass('body', 'rtxPreview');
			},

			hidePreview = function () {

				var placeholders = utils.qsa('.rtx-placeholders');
				
				for (var ph, i = 0; i < placeholders.length; i++) {
					ph = placeholders[i];
					utils.removeClass(ph, 'preview');
					if (ph.getAttribute('data-phtext') !== null) {
						ph.textContent = ph.getAttribute('data-phtext');
					}
				}
				utils.removeClass('body', 'rtxPreview');
			},

			addEditor = function () {

				var node = document.createElement('div'),
					editors = utils.qsa('div[data-rtx-id]', activeEditor),
					nextId = 1;

				for (var id, i = 0; i < editors.length; i++) {
					id = parseInt(editors[i].getAttribute('data-rtx-id'));
					if (id >= nextId) {
						nextId = id + 1;
					}
				}
				node.setAttribute('data-rtx-id', nextId);
				node.contentEditable = false;
				insertNode(node, true);
				utils.addClass(node, 'rtx-placeholders, inserted, block, editor-area');
			},
			
			addPlaceholder = function (content) {
				
				var caret = utils.qs('.ctx-placeholder'),
					type = content.charAt(0) === '_' ? 'block' : 'inline',
					node;
								
				if (type === 'inline') {
					node = document.createElement('span');
					utils.addClass(node, 'rtx-placeholders, inserted, inline');				
				}
				if (type === 'block') {
					node = document.createElement('div');					
					utils.addClass(node, 'rtx-placeholders, inserted, block');
				}
				node.contentEditable = false;
				node.textContent = content;
				caret.parentNode.insertBefore(node, caret);
				hideCtx();
			},
			
			addInsertedContent = function (content, userText) {
				
				var node, caret = utils.qs('.ctx-placeholder');

				node = document.createElement('div');				
				utils.addClass(node, 'inserted');
				if (userText !== true) {					
					utils.addClass(node, 'block');
				}
				//node.contentEditable = false;
				node.innerHTML = content;
				caret.parentNode.insertBefore(node, caret);
				hideCtx();
			},

			applyCommand = function (e) {

				var trg = e.target,
					option = trg.getAttribute('data-rtx-event');

				if (formatOptions[option]) {
					document.execCommand(formatOptions[option], false);
				}
				else {
					switch (trg.getAttribute('data-rtx-event')) {
						case 'insert': showCtxMenu();
							break;
						case 'addeditor': addEditor();
							break;
					}
				}
				e.preventDefault();
			},

			lockToolbar = function () {

				if (activeEditor !== null) {
					var scrollPos = utils.qs('html').scrollTop + utils.qs('body').scrollTop;

					if (scrollPos > activeEditor.offset[1]) {
						utils.addClass(activeEditor.toolbar, 'float');
					}
					else {
						utils.removeClass(activeEditor.toolbar, 'float');
					}
				}
			},

			setFocusHolder = function (e) {

				holdFocus = e.type === 'mouseover';
			},

			selectEditor = function (e) {

				var eType = e.type;

				if (eType === 'focus') {
					activeEditor = e.target.parentNode;
					activeEditor.offset = utils.getOffset(activeEditor);
					utils.addClass(activeEditor, 'active');
					lockToolbar();
				}
				if (eType === 'blur' && holdFocus === false) {
					utils.removeClass(activeEditor.toolbar, 'float');
					utils.removeClass(activeEditor, 'active');
					activeEditor = null;
				}
			},

			replacePlaceholders = function (content) {

				var tempContainer = utils.createNode('div', null, null, content),
					placeholders = utils.qsa('.rtx-placeholders', tempContainer),
					simplePlaceholder;

				for (var i = 0; i < placeholders.length; i++) {
					if (utils.hasClass(placeholders[i], 'editor-area')) {						
						placeholders[i].innerHTML = '{{usercontent-' + placeholders[i].getAttribute('data-rtx-id') + '}}';
					}
					else  {
						placeholders[i].innerHTML = '{{' + placeholders[i].innerHTML + '}}';
					}
				}
				content = tempContainer.innerHTML;
				tempContainer.parentNode.removeChild(tempContainer);

				return content;
			},

			restorePlaceholders = function (content) {

				return content.replace(/-:::usercontent-(.*?):::-|-:::|:::-/g, '');
			},

			getContent = function (rtxId) {

				if (typeof(rtxId) === 'undefined' || rtxId === null) {
					var editors = utils.qsa('div[data-rtx-id]'), contents = {}, content;
					for (var i = 0; i < editors.length; i++) {
						content = replacePlaceholders(utils.qs('.rtx-area', editors[i]).innerHTML);
						contents[editors[i].getAttribute('data-rtx-id')] = content.replace(/"/g, "'");
					}
					return contents;
				}
				else {
					content = replacePlaceholders(utils.qs('div[data-rtx-id="' + rtxId + '"] .rtx-area').innerHTML);
					return content.replace(/"/g, "'");
				}
			},

			setContent = function (contentData) {

				var editor;

				for (var i in contentData) {
					editor = utils.qs('[data-rtx-id="' + i + '"] .rtx-area');
					if (editor) {
						editor.innerHTML =  restorePlaceholders(contentData[i]);
					}
				}
			},

			saveUserText = function (e) {
				
				var selection = window.getSelection();
					tempContainer = document.createElement("div");
				
				for (var i = 0; i < selection.rangeCount; i++) {
					tempContainer.appendChild(selection.getRangeAt(i).cloneContents());
				}
				utils.sendData(userTextAPI, {text: tempContainer.innerHTML.replace(/ph-error/g, '')});				
				hideCtx();	
			},
			
			clearImport = function (e) {

				if (pasteLock === false) {
					var data = e.clipboardData.getData('Text'), node;
					if (data.replace(/\n/g, ':::').indexOf(':::') === -1) {
						node = document.createElement('span');
						node.textContent = data;
					}
					else {
						node = document.createElement('div');
						node.innerHTML = data.replace(/\n/g, '<br/>');
					}
					node.className = 'pasted';
					insertNode(node);
				}
				e.preventDefault();
			},

			checkNewLines = function () {
				
				var insertions = utils.qsa('.rtx-area .inserted');
				
				for (var node, ins, i = 0; i < insertions.length; i++) {
					ins = insertions[i];				
					if (!ins.previousSibling || ins.previousSibling.className !== 'nl-provider') {
						node = document.createElement(utils.hasClass(ins, 'inline') ? 'span' : 'div');								 															
						node.className = 'nl-provider';
						ins.parentNode.insertBefore(node, ins);
					}
					if (!ins.nextSibling || ins.nextSibling.className !== 'nl-provider') {
						node = document.createElement(utils.hasClass(ins, 'inline') ? 'span' : 'div');
						node.className = 'nl-provider';
						ins.parentNode.insertBefore(node, ins.nextSibling);
					}								
				}				
			},
			
			loadTabs = function () {

				lawFinder.init('.tabcontent.laws', appRoot);
				placeholderFinder.init('.tabcontent.placeholders', appRoot);
				usertextFinder.init('.tabcontent.usertexts', appRoot);
				utils.qs('.ctx-tabs span').click();
			},
			
			selectTab = function (e) {
				
				var tabs = utils.qsa('.ctx-tabs span');
					
				for (var i = 0; i < tabs.length; i++) {
					utils.removeClass(tabs[i], 'sel');				
					utils.addStyle('.tabcontent.' + tabs[i].getAttribute('data-target'), {
						display: 'none'
					});
				}					
				utils.addClass(e.target, 'sel');
				utils.addStyle('.tabcontent.' + e.target.getAttribute('data-target'), {
					display: 'block'
				});
			},

			keyboardListener = function (e) {

				if (e.keyCode === 27) {
					if (e.type === 'keydown') {
						if (isCtx === false && window.getSelection().toString() === '') {
							showPreview();
						}
					}
					if (e.type === 'keyup') {
						if (activeEditor !== null) {
							if (isCtx === false) {
								showCtx();
							}
							else {
								hideCtx();
								hidePreview();
							}
						}
						else {
							if (isCtx === true) {
								hideCtx();
								hidePreview();
							}
							else {
								hidePreview();
							}
						}
					}
				}
			},

			handleEvents = function () {

				utils.addEvents([
					['mousedown', null, 'rtx-option', applyCommand],
					['scroll', null, document, lockToolbar],
					['mouseover', null, 'rtx-toolbar', setFocusHolder],
					['mouseout', null, 'rtx-toolbar', setFocusHolder],
					['keydown', null, 'body', keyboardListener],
					['keyup', null, 'rtx-area', keyboardListener],
					['focus', null, 'rtx-area', selectEditor],
					['paste', null, 'rtx-area', clearImport],
					['blur', null, 'rtx-area', selectEditor],
					['keyup', null, 'body', keyboardListener],
					['click', null, 'ctx-menu-overlay', hideCtxMenu],
					['click', null, 'ctx-toolbar-overlay', hideCtxToolbar],
					['click', null, 'ctx-tabs', selectTab],
					['mousedown', null, 'save-user-text', saveUserText]
				]);
			},

			createEditors = function () {

				var editors = utils.qsa('div[data-rtx-id]'), content;
				
				for (var rte, i = 0; i < editors.length; i++) {
					rte = editors[i];
					if (rte.ready !== true && utils.hasClass(rte, 'inserted') !== true) {
						content = rte.innerHTML;					
						content = restorePlaceholders(content);
						utils.renderData(appRoot + 'editor/editor.tmp', rte, rte, false, function (rte) {
							rte.toolbar = utils.qs('.rtx-toolbar', rte);
							rte.area = utils.qs('.rtx-area', rte);
							utils.addStyle(rte.toolbar, {width: rte.offsetWidth  + 'px'});
							rte.area.spellcheck = false;
							rte.area.innerHTML = content;
							rte.area.onpaste = clearImport;
							rte.ready = true;
						});
					}
				}
				if (ctxMenu === null) {
					
					/*
					window.onresize = function () {					
						utils.addStyle(rte.toolbar, {width: rte.offsetWidth + 'px'});
					}
					*/
					utils.renderData(appRoot + 'editor/ctxmenu.tmp', {}, utils.createNode('div', {class: 'ctx'}, false), true, function () {
						loadTabs();
						ctxMenu = utils.qs('.ctx-menu');
					});
					handleEvents();
				}
			},

			init = function () {

				var dependencies = [
					{namespace: 'lawFinder', uri: appRoot + 'tabs/lawfinder.js'},
					{namespace: 'placeholderFinder', uri: appRoot + 'tabs/placeholderfinder.js'},
					{namespace: 'usertextFinder', uri: appRoot + 'tabs/usertextfinder.js'}
				];

				setInterval(checkNewLines, 5000);
				utils.loadModuls(dependencies, createEditors);
				utils.loadStyles(appRoot + '/editor/editor.css');
			};

		return {
			init: init,
			getContent: getContent,
			setContent: setContent,
			addPlaceholder: addPlaceholder,
			addInsertedContent: addInsertedContent
		}
	})();
