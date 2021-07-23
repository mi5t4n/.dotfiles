const Lang = imports.lang;
const DEFAULT_LEVEL = 250;

var Level = class {
    constructor(name, prefix, weight) {
        this._name = name;
        this._prefix = prefix;
        this._weight = weight;
    }
};

/* exported Logger */
var Logger = class {
    constructor(prefix, level, addNewLine) {
        if (level === undefined) {
            level = DEFAULT_LEVEL;
        }
        this.prefix = prefix;
        this._level = level;
        this._levels = {};
        if (addNewLine === false) {
            this._addNewLine = false;
        } else {
            this._addNewLine = true;
        }
    }

    set addNewLine(enabled) {
        if (enabled === true || enabled === false) {
            this._addNewLine = enabled;
        }
    }

    set prefix(prefix) {
        if (prefix === undefined || prefix === null || prefix.length === 0) {
            this._prefix = '';
            return;
        }
        this._prefix = `${prefix} `;
    }

    set level(level) {
        this._level = level;
    }

    log(message, level) {
        if (level >= this._level) {
            this._log(this._prefix + message + ((this._addNewLine === true) ? '\r\n' : ''));
        }
    }

    addLevel(name, prefix, weight) {
        this._levels[weight] = new Level(name, prefix, weight);
        this[name] = Lang.bind(this, function(message) {
            this.log(`${prefix} ${message}`, weight);
        });
    }

    getLevels() {
        return this._levels;
    }

    _log(message) {
        if (typeof log === 'function') {
            log(message);
            return;
        }
        if (typeof global.log === 'function') {
            global.log(message);

        }
    }
};

/* vi: set expandtab tabstop=4 shiftwidth=4: */
