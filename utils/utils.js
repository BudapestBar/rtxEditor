
log = function (msg) {console.log(msg)}

var utils = (function () {

	var	listeners = {nodes: [], events: {}},
		templates = {},
		dictionary = {},
		onLoadError = false,
		xhrToken = null,

		setOnloadError = function (cb) {

			if (typeof(cb) === 'function') {
				onLoadError = cb;
			}
		},
		
		setXhrToken = function (token) {
			
			xhrToken = token;
		},

		addTemplate = function (name, template) {
			
			templates[name] = template;
		},
		
		loadDictionary = function (uri, cb, cors) {

			loadData(uri, function (r) {
				r = r.replace(/"/g, '&qoute;');
				r = '{"' + r + '"}';
				r = r.replace(/\r?\n|\r/g, '","');
				r = r.replace(/\/\*(.*?)\*\//g, '');				
				r = r.replace(/:/g, '":"');
				r = r.replace(/"[ ]{1,}/g, '"');
				r = r.replace(/"",|\t/g, '');
				r = r.replace(/""/g, '"');
				dictionary = JSON.parse(r);
				if (cb) {
					cb();
				}
			}, cors);
		},

		readDictionary = function (key) {

			return dictionary[key];
		},

		loadData = function (uri, cb, cors) {

			var xhr = new XMLHttpRequest();
			if (uri.indexOf('?') === -1) {
				uri += '?' + new Date().getTime();
			}
			if (xhrToken !== null) {
				uri += '&' + xhrToken; 
			}
			xhr.onreadystatechange = function() {
				if (this.readyState === 4 && this.status === 200 && cb) {
					cb(this.responseText);
				}
				else if (this.status !== 200 && onLoadError) {
					onLoadError(this.status);
				}
			};
			xhr.open("GET", uri, true);
			if (typeof(cors) === 'object') {
				if (cors.credentials && cors.credentials === true) {
					xhr.withCredentials = true;
				}
				if (cors.allow && cors.allow === true) {
					xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
					xhr.setRequestHeader("Access-Control-Allow-Methods", "GET, POST");
					xhr.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");
				}
			}
			xhr.send();
		},

		sendData = function (uri, postdata, cb, cors, ctype) {

			var xhr = new XMLHttpRequest(),
				payload = '';

			if (typeof(postdata) !== 'string') {
				for (var i in postdata) {
					if (payload === '') {
						payload += i + '=' + postdata[i];
					}
					else {
						payload += '&' + i + '=' + postdata[i];
					}
				}
			}
			else {
				payload = postdata;
			}
			if (uri.indexOf('?') === -1) {
				uri += '?';
			}
			if (xhrToken !== null) {
				uri += '&' + xhrToken; 
			}
			xhr.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					if (typeof(cb) === 'function') {						
						cb(this.responseText);
					}
				}
			};
			xhr.open("POST", uri, true);
			if (typeof(cors) === 'object') {
				if (cors.credentials && cors.credentials === true) {
					xhr.withCredentials = true;
				}
				if (cors.allow && cors.allow === true) {
					xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
					xhr.setRequestHeader("Access-Control-Allow-Methods", "GET, POST");
					xhr.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");
				}
			}
			if (typeof(ctype) !== 'undefined') {				
				xhr.setRequestHeader("Content-type", ctype);
			}
			else {				
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			}
			
			xhr.send(payload);
		},

		renderData = function (template, data, placeholder, append, callback, cors) {

			if (typeof(cors) === 'undefined') {
				cors = false;
			}
			if (typeof(data) === 'string') {
				loadData(data, function (r) {
					if (r !== '') {						
						renderData(template, JSON.parse(r), placeholder, append, callback, cors);
					}
				}, cors);
			}
			else if (!templates[template]) {
				loadData(template, function (r) {
					templates[template] = r;
					renderData(template, data, placeholder, append, callback, cors);
				}, cors);
			}
			else {
				var template = templates[template],
					endTags = template.match(/\{\/(.*?)\}/g),
					sections = [],
					singleTags, section, startTag, endTag, sectionInner, dataIndex, replacer, builder, texts
					template = template.replace(/\r|\n|\t/g, '');

				for (var i in endTags) {
					startTag = endTags[i].replace(/\//, '');
					section = template.match(new RegExp(startTag + '(.*?)' + endTags[i], 'g'));
					for (var j in section) {
						builder = '';
						if (typeof(sections[section[j]]) === 'undefined') {
						dataIndex = startTag.replace(/\{|\}/g, '');
							sectionInner = section[j].replace(new RegExp(startTag + '|' + endTags[i], 'g'), '');
							for (var k in data[dataIndex]) {
								replacer = sectionInner;
								for (var l in data[dataIndex][k]) {
									if (l != 0) {										
										replacer = replacer.replace(new RegExp('\{' + l + '\}', 'g'), data[dataIndex][k][l]);
									}
								}
								builder += replacer;
							}
							sections[section[j]] = builder;
							template = template.replace(new RegExp(section[j], 'g'), builder);
						}
					}
				}
				singleTags = template.match(/\{(.*?)\}/g);
				for (var i in singleTags) {
					if (replacer = data[singleTags[i].replace(/\{|\}/g, '')]) {
						template = template.replace(new RegExp(singleTags[i], 'g'), replacer);
					}
				}
				texts = template.match(/\{\#(.*?)\}/g);
				for (var i in texts) {
					if (replacer = dictionary[texts[i].replace(/\{\#|\}/g, '')]) {
						template = template.replace(new RegExp(texts[i], 'g'), replacer);
					}
				}
				template = template.replace(/\{(.*?)\}/g, '');
				if (typeof(placeholder) === 'string') {
					placeholder = qs(placeholder);
				}
				if (append) {
					placeholder.innerHTML += template;
				}
				else {
					placeholder.innerHTML = template;
				}
				if (callback) {
					callback(data);
				}
			}
		},

		loadStyles = function (url) {

			var styleNode = document.createElement('link');

			styleNode.rel = 'stylesheet';
			styleNode.href = url;
			document.querySelector('head').appendChild(styleNode);
		},
		
		loadModuls = function (moduls, cb) {
		
			var scripts = qsa('script'), 
				scriptUris = [],
				timeout = 3000,
				delay = 30,
				loader;
			
			for (var i = 0; i < scripts.length; i++) {
				scriptUris.push(scripts[i].getAttribute('data-namespace'));
			}
			for (var i in moduls) {
				if (scriptUris.indexOf(moduls[i].namespace) === -1) {
					createNode('script', {'src': moduls[i].uri, 'data-namespace': moduls[i].namespace}, 'head');
				}
			}
			loader = setInterval(function () {				
				for (var i in moduls) {	
					if (moduls[i].namespace in window) {
						moduls.splice(i, 1);
					}
				}
				if (moduls.length === 0) {
					clearInterval(loader);
					if (cb) {
						cb();
					}
				}
				else if (timeout <= 0) {
					clearInterval(loader)
				}			
				timeout -= delay;
			}, delay);	
		},

		addEvent = function (eventType, node, targetIdentifier, callback) {

			var nodeIndex;
			if (typeof(node) === 'string') {
				node = document.querySelector(node);
			}
			if (node === null || node === false || node === document || node === 'document') {
				node = document;
			}
			nodeIndex = listeners.nodes.indexOf(node);
			if (nodeIndex === -1) {
				listeners.nodes.push(node);
				nodeIndex = listeners.nodes.indexOf(node);
				listeners.events[nodeIndex] = {};
			}
			eventType = eventType.replace(/ /g, '').split(',');
			for (var i in eventType) {
				if (typeof(listeners.events[nodeIndex][eventType[i]]) === 'undefined') {
					listeners.events[nodeIndex][eventType[i]] = {};
					node.addEventListener(eventType[i], function (e) {
						var nodeIndex = listeners.nodes.indexOf(node), nodeEvents, targetEvent;						
						if (nodeIndex !== -1) {
							nodeEvents = listeners.events[nodeIndex][e.type];
							if (e.target === document && targetIdentifier === document) {
								callback(e);
							}
							else {								
								targetEvent = nodeEvents[e.target.getAttribute('data-ui')];
							}
							if (targetEvent) {
								targetEvent(e);
							}
						}
					}, true);
				}
				listeners.events[nodeIndex][eventType[i]][targetIdentifier] = callback;
			}
		},

		addEvents = function (props) {

			for (var i in props) {
				addEvent.apply(false, props[i]);
			}
		},

		addClass = function (node, cNames) {

			var classes;

			if (typeof(node) === 'string') {
				node = qs(node);
			}
			if (node === null || typeof(node) === 'undefined') {
				return false;
			}
			classes = node.className.split(' ');
			cNames = cNames.replace(/ /g, '').split(',');
			if (classes.length === 1 && classes[0] === '') {
				classes = [];
			}
			for (var i in cNames) {
				if (classes.indexOf(cNames[i]) === -1) {
					classes.push(cNames[i]);
				}

			}
			node.className = classes.join(' ');
		},

		removeClass = function (node, cNames) {

			var classes,
				cnIndex;

			if (typeof(node) === 'string') {
				node = qs(node);
			}
			if (node === null || typeof(node) === 'undefined') {
				return false;
			}
			classes = node.className.split(' '),
			cNames = cNames.replace(/ /g, '').split(',');
			for (var i in cNames) {
				cnIndex = classes.indexOf(cNames[i]);
				if (cnIndex !== -1) {
					classes.splice(cnIndex, 1);
				}
			}
			node.className = classes.join(' ');
		},

		toggleClass = function (node, cNames) {

			var classes;

			if (typeof(node) === 'string') {
				node = qs(node);
			}
			classes = node.className.split(' ');
			cNames = cNames.replace(/ /g, '').split(',');
			for (var i in cNames) {
				if (classes.indexOf(cNames[i]) === -1) {
					addClass(node, cNames[i]);
				}
				else {
					removeClass(node, cNames[i]);
				}
			}
		},

		forceClass = function (node, cNames) {
			
			if (typeof(node) === 'string') {
				node = qs(node);
			}
			node.className = '';
			addClass(node, cNames);
		},
		
		hasClass = function (node, cName) {

			if (typeof(node) === 'string') {
				node = qs(node);
			}

			return node.className.split(' ').indexOf(cName) !== -1;
		},

		getValue = function (form, field) {

			var form = qs('[data-form="' + form + '"]'),
				field = qs('[data-field="' + field + '"]', form);

			return field.value;
		},
		
		setValue = function (form, field, val) {

			var form = qs('[data-form="' + form + '"]'),
				field = qs('[data-field="' + field + '"]', form);

			field.value = val;
		},

		getValues = function (form) {

			form = qs('[data-form="' + form + '"]');
			if (form !== null) {
				var fields = qsa('[data-field]', form),
					values = {};

				for (var field, val, i = 0; i < fields.length; i++) {
					field = fields[i];
					if (field.type === 'checkbox') {
						val = field.checked === true ? 1 : 0;
					}
					else if (field.type === 'radio' && field.checked !== true) {
						continue;
					}
					else {
						val = field.value;
					}
					values[field.getAttribute('data-field')] = val;
				}
				return values;
			}
			else {
				return false;
			}
		},

		setValues = function (form, data) {

			form = qs('[data-form="' + form + '"]');
			if (form !== null) {
				var fields = qsa('[data-field]', form);

				for (var f, i = 0; i < fields.length; i++) {
					f = fields[i].getAttribute('data-field');
					if (data[f]) {
						fields[i].value = data[f];
					}
				}
			}
		},

		resumeValues = function () {

			var fields = qsa('*[data-retval]');

			for (var field, val, i = 0; i < fields.length; i++) {
				field = fields[i];
				val = field.getAttribute('data-retval');
				if (field.nodeName.toLowerCase() === 'select') {
					if (field.disabled === true && val === '') {
						field.disabled = false;
					}
					else if (val !== '') {						
						field.value = val;
					}
				}
				if (field.nodeName.toLowerCase() === 'input') {
					field.checked = parseInt(val) === 1 ? true : false;
				}
				if (field.nodeName.toLowerCase() === 'fieldset' && val !== '') {
					qs('input[value="' + val + '"]', field).checked = true;
				}
			}
		},

		parseJson = function (data) {

			if (data.indexOf('"') === -1 && data.indexOf("'") === -1) {
				data = 	data
						.replace(/^[ ]*/,'{"')
						.replace(/[ ]*$/, '"}')
						.replace(/[ ]*:[ ]*/g, '":"')
						.replace(/[ ]*,[ ]*/g, '","');
			}
			return JSON.parse(data);
		},

		createDrag = function (node, args) {

			/*
				limits = {
					lockToParent: [bool],
					hMin: [int],
					vMin: [int],
					hMax: [int],
					vMax: [int],
					hLock: [bool],
					vLock: [bool],
					snap: [int],
					cbStart: (void) [function],
					cbDrag: (coords [array]) [function],
					cbDrop: (coords [array]) [function]
				}
			*/

			var sensor = qs('utils-drag-sensor'),
				startCoords = [],
				newCoords = [],
				prevCoords = [0, 0],
				dropPreventer = true,
				parent = null,
				snap = null;

			if (args && args.snap && parseInt(args.snap) > 0) {
				snap = parseInt(args.snap);
			}

			if (sensor === null) {
				sensor = createNode('div', {'class': 'utils-drag-sensor'}, false);
				addStyle(sensor, {
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					zIndex: 100000,
					display: 'none',
					cursor: 'default'
				});

				node.onmousedown = function (e) {

					startCoords = [
						e.clientX,
						e.clientY,
						node.offsetLeft,
						node.offsetTop
					];
					if (args && args.cursor) {
						addStyle(sensor, {
							cursor: getComputedStyle(node, null).getPropertyValue('cursor')
						});
					}
					parent = node.parentNode;
					addStyle(sensor, {
						display: 'block'
					});
					if (args && args.cbStart) {
						args.cbStart();
					}
					dropPreventer = true;
				}

				sensor.onmousemove = function (e) {

					if (snap !== null) {
						var snapCoords = [
							Math.floor((e.clientX - startCoords[0]) / snap),
							Math.floor((e.clientY - startCoords[1]) / snap)
						];
						if (snapCoords[0] < prevCoords[0]) {
							++snapCoords[0];
						}
						if (snapCoords[1] < prevCoords[1]) {
							++snapCoords[1];
						}
						newCoords[0] = startCoords[2] + (snapCoords[0] * snap);
						newCoords[1] = startCoords[3] + (snapCoords[1] * snap);
					}
					else {
						newCoords[0] = startCoords[2] + e.clientX - startCoords[0];
						newCoords[1] = startCoords[3] + e.clientY - startCoords[1];
					}
					prevCoords = snapCoords;
					if (args && args.lockToParent &&
						(newCoords[0] < 0 ||
						newCoords[1] < 0 ||
						newCoords[0] > parent.offsetWidth - node.offsetWidth ||
						newCoords[1] > parent.offsetHeight - node.offsetHeight)) {
							return;
					}
					else {
						if ((args && args.hLock === true) ||
							(args && args.hMin && newCoords[0] <= args.hMin) ||
							(args && args.hMax && newCoords[0] >= args.hMax)) {
								return;
						}
						else {
							addStyle(node, {
								left: newCoords[0] + 'px'
							});
						}
						if ((args && args.vLock === true) ||
							(args && args.vMin && newCoords[1] <= args.vMin) ||
							(args && args.vMax && newCoords[1] >= args.vMax)) {
								return;
						}
						else {
							addStyle(node, {
								top: newCoords[1] + 'px'
							});
						}
					}
					if (args && args.cbDrag) {
						args.cbDrag([node.offsetLeft, node.offsetTop]);
					}
				}

				sensor.onmouseout = function () {

					if (dropPreventer === true) {
						sensor.onmouseup();
					}
				}

				sensor.onmouseup = function () {

					dropPreventer = false;
					addStyle(sensor, {
						display: 'none',
						cursor: 'default'
					});
					if (args && args.cbDrop) {
						args.cbDrop([node.offsetLeft, node.offsetTop]);
					}
				}
			}
		},

		createNode = function (nodeType, attributes, parent, content) {

			var node = document.createElement(nodeType);
			if (attributes) {
				for (var i in attributes) {
					node.setAttribute(i, attributes[i]);
				}
			}
			if (typeof(parent) === 'undefined' || parent === null || parent === false || parent === document || parent === 'document') {
				parent = document.body;
			}			
			else if (typeof(parent) === 'string') {
				parent = qs(parent);			
			}
			if (content) {
				node.innerHTML = content;
			}
			parent.appendChild(node);
			return node;
		},

		getOffset = function (node, ancestor) {

			var offset = [0, 0];

			if (!ancestor) {
				ancestor = qs('body');
			}

			while (node !== ancestor) {
				offset[0] += node.offsetLeft;
				offset[1] += node.offsetTop;
				node = node.parentNode;
			}
			return offset;
		},

		qs = function (query, root) {

			if (!root) {
				root = document;
			}

			return root.querySelector(query);
		},

		qsa = function (query, root) {

			if (!root) {
				root = document;
			}

			return root.querySelectorAll(query);
		},

		addStyle = function (node, rules) {

			if (typeof(node) === 'string') {
				node = qs(node);
			}
			for (var i in rules) {
				node.style[i] = rules[i];
			}
		};

	return {
		loadDictionary: loadDictionary,
		readDictionary: readDictionary,
		addTemplate: addTemplate,
		loadData: loadData,
		sendData: sendData,
		renderData: renderData,
		loadStyles: loadStyles,
		loadModuls: loadModuls,
		addEvents: addEvents,
		addEvent: addEvent,
		addClass: addClass,
		forceClass: forceClass,
		hasClass: hasClass,
		getValue: getValue,
		setValue: setValue,
		getValues: getValues,
		setValues: setValues,
		resumeValues: resumeValues,
		setOnloadError: setOnloadError,
		parseJson: parseJson,
		getOffset: getOffset,
		removeClass: removeClass,
		toggleClass: toggleClass,
		createNode: createNode,
		createDrag: createDrag,
		addStyle: addStyle,
		qsa: qsa,
		qs: qs
	}
})();