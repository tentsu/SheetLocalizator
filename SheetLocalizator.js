(function(window) {
	'use strict';

	var KEY_COLUMN = 'A';
	var TITLE_ROW = 1;
	var SHEET_URL = 'https://spreadsheets.google.com/feeds/cells/SHEET_ID/od6/public/basic?hl=en_US&alt=json';

	var SheetLocalizator = function(sheetId, language, callback) {
		_getSheet(sheetId, function(data) {
			data = JSON.parse(data);

			callback(_parseLocalizations(data.feed.entry, language));
		});
	};

	function _getSheet(id, callback) {
		var r = new XMLHttpRequest();
		r.open("GET", _getUrl(id), true);
		r.onreadystatechange = function() {
			if (r.readyState != 4 || r.status != 200) return;
			callback(r.responseText);
		};
		r.send();
	}

	function _parseLocalizations(cells, language) {
		language = language || 'FI';

		var titles = _parseTitles(cells);
		var languageColumn = _getLanguageColumn(titles, language);

		if (!languageColumn) {
			return;
		}

		var keys = _getKeys(titles, cells);
		var localizations = {};

		for (var i = titles.length; i < cells.length; i++) {
			var cell = _getCell(cells[i]);

			if (cell.column === languageColumn) {
				localizations[keys[cell.row]] = cell.title;
			}
		}

		return localizations;
	}


	function _parseTitles(cells) {
		var titles = [];

		for (var i = 0; i < cells.length; i++) {
			titles.push(_getCell(cells[i]));

			// Check if next cell is already something else than title
			if (cells[i + 1] && cells[i + 1].title.$t.match(/\d+/).join() > TITLE_ROW) {
				return titles;
			}
		}

		return titles;
	}


	function _getUrl(id) {
		return SHEET_URL.replace('SHEET_ID', id);
	}

	function _getCell(cell) {
		var letters = /[a-zA-Z]+/;
		var numbers = /\d+/;

		return {
			'title': cell.content.$t,
			'column': cell.title.$t.match(letters).join(),
			'row': cell.title.$t.match(numbers).join()
		};
	}


	function _getLanguageColumn(titles, language) {
		for (var i = 0; i < titles.length; i++) {
			if (titles[i].title === language) {
				return titles[i].column;
			}
		}

		return null;
	}


	function _getKeys(titles, cells) {
		var keys = {};

		for (var i = titles.length; i < cells.length; i++) {
			var cell = _getCell(cells[i]);

			// Check if KEY column
			if (cell.column === KEY_COLUMN) {
				keys[cell.row] = cell.title;
			}
		}

		return keys;
	}

	window.SheetLocalizator = SheetLocalizator;
})(window);
