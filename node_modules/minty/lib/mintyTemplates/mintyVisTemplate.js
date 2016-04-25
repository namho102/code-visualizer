'use strict';

window.graphViz = window.graphViz || {};
(function () {
		'use strict';

		var ObjectGraph = graphViz.ObjectGraph = function ObjectGraph(name, root, options) {

		this._nodes = [];
		this._edges = [];
		this._showBuiltins = !!options.builtins;
		this._showAllFunctions = !!options.allFunctions;

		// This algorithm is O(n^2) because hasNode is O(n). :-(
		// It will be much faster when we can replace this._nodes with Set, which should be O(1).
		// (Set is a new data type coming in a future version of JavaScript.)
		traverse(this, new graphViz.ObjectNode(name, root));
		removePartialEdges(this);
	};

	ObjectGraph.prototype.nodes = function nodes() {
		return this._nodes;
	};

	ObjectGraph.prototype.edges = function edges() {
		return this._edges;
	};

	function traverse(self, node) {
			if (hasNode(self, node)) return;

			addNode(self, node);
			node.forEachSubNode(function(subnode, id, name) {
				if (isBuiltin(subnode) && !self._showBuiltins) return;

				subnode = dedupe(self, subnode);
				addEdge(self, node, subnode, id);
				if (isOrdinaryFunction(subnode, name) && !self._showAllFunctions) return;
				traverse(self, subnode);
			});
		}

		function removePartialEdges(self) {
		// When traversing, we add edges for some subnodes that are not traversed. This is necessary
		// because the decision of which subnode to traverse is context-dependent, so sometimes we'll
		// decide to filter out a subnode that's later included. We add an edge regardless so it will be present
		// if the node is later included. If the node never was included, we filter it out here.

		var result = [];
		self._edges.forEach(function (element) {
			// We're going to figure out if the 'to' node is present, and if it is, we'll use the one that's in
			// _nodes rather than the one stored in the edge. That's because the edge may refer to a node that
			// was filtered out, if the edge found before the node was known to be interesting.
			// Note: It's impossible for the 'from' node to be missing due to the way the traversal algorithm works.

			// This code a more complicated way of saying (paraphrased) "if (hasNode()) dedupe();". It's a bit faster.
			var node = findNode(self, element.to);
			if (node !== undefined) {
				element.to = node;
				result.push(element);
			}
		});
		self._edges = result;
	}

	function hasNode(self, node) {
		return findNode(self, node) !== undefined;
	}

	function dedupe(self, node) {
		return findNode(self, node) || node;
	}

	function findNode(self, node) {
		var matchingNodes = self._nodes.filter(function (element) {
			return element.equals(node);
		});
		if (matchingNodes.length > 1) throw new Error('Node [' + node.name() + '] was stored multiple times; that should be impossible');
		return matchingNodes[0];
	}

	function addNode(self, node) {
		self._nodes.push(node);
	}

	function addEdge(self, from, to, fromField) {
		self._edges.push({
			from: from,
			to: to,
			fromField: fromField
		});
	}

	function isBuiltin(node) {
			var value = node.value();
			return value === Object.prototype ||
					value === Function.prototype ||
					value === Array.prototype ||
					value === String.prototype ||
					value === Boolean.prototype ||
					value === Number.prototype ||
					value === Date.prototype ||
					value === RegExp.prototype ||
					value === Error.prototype;
		}

	function isOrdinaryFunction(node, propertyName) {
		var func = node.value();
		if (typeof func !== 'function') return false;

		var prototype = func.prototype;
		if (prototype && typeof prototype !== 'object') return false;

		var constructor = propertyName === 'constructor';
		var standardFunction = !hasUnusualProperties(func, ['length', 'name', 'caller', 'arguments', 'prototype']);
		var standardPrototype = !hasUnusualProperties(prototype, ['constructor']);
		var selfReferencingPrototype = !prototype || prototype.constructor === func;

		return !constructor && standardFunction && standardPrototype && selfReferencingPrototype;

		function hasUnusualProperties(obj, normalProperties) {
			if (obj === undefined || obj === null) return false;

			var unusualProperties = Object.getOwnPropertyNames(obj).filter(function(property) {
				return normalProperties.indexOf(property) === -1;
			});

			return (unusualProperties.length !== 0);
		}
	}

}());

(function () {
	'use strict';

	var uniqueId = 0;

	var ObjectNode = graphViz.ObjectNode = function ObjectNode(name, value) {
		if (typeof value !== 'object' && typeof value !== 'function') throw new Error('Invalid ObjectNode value: expected function or object, but was ' + typeof value);
		if (value === null) throw new Error('Invalid ObjectNode value: expected function or object, but was null');

		this._id = uniqueId++;
		this._name = objectName(name, value);
		this._value = value;
	};

	ObjectNode.prototype.id = function id() {
		return 'node' + this._id;
	};

	ObjectNode.prototype.name = function name() {
		return this._name;
	};

	ObjectNode.prototype.type = function type() {
		return objectType(this._value);
	};

	ObjectNode.prototype.value = function value() {
		return this._value;
	};

	ObjectNode.prototype.properties = function properties() {
		var self = this;
		return getProperties(self._value).map(function (name, index) {
			return {
				name: name,
				value: describeField(self._value[name]),
				id: 'f' + index,
			};
		});
	};

	ObjectNode.prototype.prototype = function prototype() {
		var value;

		var proto = Object.getPrototypeOf(this._value);
		if (proto === null) value = 'null';
		else value = objectName(this._name + '.<prototype>', Object.getPrototypeOf(this._value));

		return {
			name: '<prototype>',
			value: value,
			id: 'proto',
		};
	};

	ObjectNode.prototype.forEachSubNode = function forEachSubNode(fn) {
	var self = this;
		forEach(this._value, function (name, value, id) {
			if (typeof value !== 'function' && typeof value !== 'object') return;
			if (value === null) return;
			fn(new ObjectNode(self._name + '.' + name, value), id, name);
		});
	};

	ObjectNode.prototype.equals = function equals(node) {
		return this._value === node._value;
	};

	function objectName(fallbackName, object) {
		if (object === Function.prototype) return 'Function.prototype';
		if (typeof object === 'function') return functionName(object) + '()';
		if (hasOwnProperty(object, 'constructor') && (object.constructor.prototype === object)) return functionName(object.constructor) + '.prototype';
		return fallbackName;
	}

	function objectType(object) {
		var prototype = Object.getPrototypeOf(object);
		if (prototype === null) return '<null>';
		return objectName('<anon>', prototype);
	}

	function functionName(func) {
		var name = func.name;

		if (name === undefined) name = ieFunctionNameWorkaround(func);
		if (name === '') name = '<anon>';
		return name;
	}

	function describeField(value) {
		if (value === null) return 'null';
		if (value === Function.prototype) return 'Function.prototype';

		switch (typeof value) {
			case 'string':
				return '"' + value + '"';
			case 'function':
			case 'object':
				return objectName('{' + objectType(value) + '}', value);
			default:
				return '' + value;
		}
	}

	function ieFunctionNameWorkaround(constructor) {
		// This workaround is based on code by Jason Bunting et al, http://stackoverflow.com/a/332429
		var funcNameRegex = /function\s+(.{1,})\s*\(/;
		var results = (funcNameRegex).exec((constructor).toString());
		return (results && results.length > 1) ? results[1] : '';
	}

	function forEach(object, fn) {
		getProperties(object).forEach(function (name, index) {
			fn(name, object[name], 'f' + index);
		});

		fn('<prototype>', Object.getPrototypeOf(object), 'proto');
	}

	function getProperties(object) {
		var names = Object.getOwnPropertyNames(object);
		if (typeof object === 'function') names = filterOutRestrictedFunctionProperties();
		return names;

		function filterOutRestrictedFunctionProperties() {
			return names.filter(function (name) {
				return name !== 'caller' && name !== 'callee' && name !== 'arguments';
			});
		}
	}

	// can't use object.hasOwnProperty() because it doesn't work when object doesn't inherit from Object
	function hasOwnProperty(object, propertyName) {
		return Object.prototype.hasOwnProperty.call(object, propertyName);
	}

}());
// Functions for turning an object graph into SVG.
(function() {
	'use strict';

	var exports = window.graphViz.viz = {};
	var details = exports.details = {};

	var ARROW_COLOR = '#555555';
	//arrow size
	var ARROW_HEAD_MULTIPLIER = '0.8';

	var TABLE_FONT_POINTS = 10;

	var TITLE_BACKGROUND_COLOR = '#0FAC6C';
	var TITLE_FONT_COLOR = 'white';
	var TITLE_FONT_POINTS = TABLE_FONT_POINTS + 1;

	var PROPERTY_BACKGROUND_COLOR = '#E3E3E3';
	var PROPERTY_ALT_BACKGROUND_COLOR = '#FDFDFD';
	var PROPERTY_NAME_FONT_COLOR = '#333333';
	var PROPERTY_VALUE_FONT_COLOR = '#666666';

	var PROTOTYPE_BACKGROUND_COLOR = '#25E698';
	//base color
	var PROTOTYPE_FONT_COLOR = 'white';

	exports.render = function render(rootName, object, options) {
			return details.vizToSvg(details.graphToViz(new graphViz.ObjectGraph(rootName, object, options)));
	};

	details.vizToSvg = function vizToSvg(vizCode) {
			return Viz(vizCode, 'svg');
	};

	details.graphToViz = function graphToViz(graph) {
			return '' +
					'digraph g {\n' +
					'  graph [\n' +
					'    rankdir = "LR"\n' +
					'  ];\n' +
					'  node [\n' +
					'    fontname = "Helvetica"\n' +
					'    fontsize = "' + TABLE_FONT_POINTS + '"\n' +
					'    shape = "plaintext"\n' + // 'plaintext' is misnamed; it enables HTML-like formatting
					'  ];\n' +
					'  edge [\n' +
					'    color = "' + ARROW_COLOR + '"\n' +
					'    arrowsize = "' + ARROW_HEAD_MULTIPLIER + '"\n' +
					'  ];\n' +
					'  \n' +
					nodes() +
					edges() +
					'}\n';

		function nodes() {
			return graph.nodes().map(function (node) {
				return details.nodeToViz(node);
			}).join('');
		}

		function edges() {
			return graph.edges().map(function (edge) {
				return details.edgeToViz(edge);
			}).join('');
		}
	};

	details.nodeToViz = function nodeToViz(node) {
		return '' +
			'  "' + node.id() + '" [label=<\n' +
			'    <table border="0" cellborder="0" cellpadding="3" cellspacing="0">\n' +
			'      <th><td port="title" bgcolor="' + TITLE_BACKGROUND_COLOR + '"><font color="' + TITLE_FONT_COLOR + '" point-size="' + TITLE_FONT_POINTS + '">' + escapeHtml(node._name) + '</font></td></th>\n' +
			fields() +
			prototype() +
			'    </table>\n' +
			'  >];\n';

		function fields() {
			var oddRow = true;
			return node.properties().map(function (property) {
				var color = oddRow ? PROPERTY_BACKGROUND_COLOR : PROPERTY_ALT_BACKGROUND_COLOR;
				oddRow = !oddRow;
				var result = '      <tr><td port="' + property.id + '" bgcolor="' + color + '" align="left" balign="left">&nbsp;<font color="' + PROPERTY_NAME_FONT_COLOR + '">' + escapeHtml(property.name) + ':</font> <font color="' + PROPERTY_VALUE_FONT_COLOR + '">' + escapeHtml(property.value) + '</font>&nbsp;</td></tr>\n';
				return result;
			}).join('');
		}

		function prototype() {
			var proto = node.prototype();
			return '      <tr><td port="' + proto.id + '" bgcolor="' + PROTOTYPE_BACKGROUND_COLOR + '"><font color="' + PROTOTYPE_FONT_COLOR + '">' + escapeHtml(' ') + '</font></td></tr>\n';
		}
	};

	details.edgeToViz = function edgeToViz(edge) {
		return '"' + edge.from.id() + '":' + edge.fromField + ' -> "' + edge.to.id() + '":title [];';
	};

	var escapeHtml = details.escapeHtml = function escapeHtml (html) {
		return html.
		replace(/&/g, '&amp;').
		replace(/</g, '&lt;').
		replace(/>/g, '&gt;').
		replace(/"/g, '&quot;').
		replace(/'/g, '&#039;').
		replace(/\n/g, '<br />').
		replace(/\t/g, '  ');
	};

}());



$(document).ready(() => {
	let currentIndex = -1;
	let prevIndex = -1;
	let options = {
		builtins: false,
		allFunctions: true,
	};

	const winHeight = window.innerHeight;
	resizeEditors(editors, winHeight);

	let onResize;
	$(window).on('resize', function() {
		clearTimeout(onResize);
		onResize = setTimeout(function() {
			resizeEditors(editors, window.innerHeight);
		}, 250);
	});

	disableBackFirstButtons(true);
	$('#step #currStep').text(` 0 `);
	$('#step #lastStep').text(` ${data.log.length - 1} `);


	function changeVars(index) {
		let globalVars, specialVars;
		globalVars = data.log[index].variables.global;
		specialVars = data.log[index].variables.special;
		//check if special[0] exists, add to globalVars
		if (data.log[index].variables.special[0]) {
				for (let keys in specialVars[0]) {
						globalVars[keys] = specialVars[0][keys];
				}
				delete specialVars[0];
		}
		let scopes = JSON.parse(data.log[index].scope);
		let scopeIndex = scopes.length - 1;
		if (scopes.length > 1) {
			while (!scopes[scopeIndex]) {
					scopeIndex--;
			}
			if (scopes[scopeIndex] === '_mintyGlobalScope') {
				for (let keys in specialVars) {
					for (let objKeys in specialVars[keys]) {
						globalVars[objKeys] = specialVars[keys][objKeys];
					}
				}
				$('#special-vars').empty();
			} else {
				let blackList = {};
				scopeIndex = 1;
				$('#special-vars').empty();
				for (let keys in specialVars) {
					let tempScopeIndex = scopeIndex;
					while (!scopes[tempScopeIndex]) {
						tempScopeIndex--;
					}
					if (tempScopeIndex !== scopeIndex) {
						for (let objKeys in specialVars[keys]) {
							specialVars[tempScopeIndex][objKeys] = specialVars[keys][objKeys];
							scopes.splice(parseInt(keys), 0);
						}
					}
						scopeIndex++;
				}
				$('#special-vars').empty();
				for (let keys in specialVars) {
					if (scopes[parseInt(keys)]) {
						$('#special-vars').append(`<div id="special-${keys}"></div>`);
						for (let objKeys in specialVars[keys]) {
							if (specialVars[keys][objKeys] === '_mintyUndefined') specialVars[keys][objKeys] = undefined;
              else {
                try {
                  specialVars[keys][objKeys] = JSON.parse(specialVars[keys][objKeys]);
                } catch (e) {}
              }
						}
						$(`#special-${keys}`).html(graphViz.viz.render(scopes[parseInt(keys)], specialVars[keys], options));
					}
				}
			}
		} else {
			$('#special-vars').empty();
		}
		for (let keys in globalVars) {
			if (globalVars[keys] === '_mintyUndefined') globalVars[keys] = undefined;
			else {
				try{
					globalVars[keys] = JSON.parse(globalVars[keys]);
				} catch (e) {
				}
			}
		}
		$('#global-vars').html(graphViz.viz.render('global', globalVars, options));
	}

	function checkError(index) {
		if (data.log[index].error) {
			$('#error-msg').html(`Error: ${data.log[index].error}`);
		} else {
			$('#error-msg').empty();
		}
	}


	function checkPosition(index) {
		if (index <= 0) {
			disableBackFirstButtons(true);
			disableForwardLastButtons(false);
		} else if (index === data.log.length - 1) {
			disableForwardLastButtons(true);
			disableBackFirstButtons(false);
		} else {
			disableForwardLastButtons(false);
			disableBackFirstButtons(false);
		}
		$('#step #currStep').text(` ${index} `);
		$('#step #lastStep').text(` ${data.log.length - 1} `);
	}

	function disableForwardLastButtons(value) {
		$('#forward').prop('disabled', value);
		$('#last').prop('disabled', value);
	}

	function disableBackFirstButtons(value) {
		$('#back').prop('disabled', value);
		$('#first').prop('disabled', value);
	}

	$('#forward').click(() => {
		prevIndex = currentIndex;
		currentIndex++;
		changeVars(currentIndex);
		checkError(currentIndex);
		checkPosition(currentIndex);
		moveLineIndicator(currentIndex, prevIndex, data.log);
	});

	$('#back').click(() => {
		prevIndex = currentIndex;
		currentIndex--;
		changeVars(currentIndex);
		checkError(currentIndex);
		checkPosition(currentIndex);
		moveLineIndicator(currentIndex, prevIndex, data.log);
	});

	$('#first').click(() => {
		prevIndex = currentIndex;
		currentIndex = 0;
		changeVars(currentIndex);
		checkError(currentIndex);
		checkPosition(currentIndex);
		moveLineIndicator(currentIndex, prevIndex, data.log);
	});

	$('#last').click(() => {
		prevIndex = currentIndex;
		currentIndex = data.log.length - 1;
		changeVars(currentIndex);
		checkError(currentIndex);
		checkPosition(currentIndex);
		moveLineIndicator(currentIndex, prevIndex, data.log);
	});
});
