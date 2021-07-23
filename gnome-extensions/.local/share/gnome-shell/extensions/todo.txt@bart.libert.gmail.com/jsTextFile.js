const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Errors = Me.imports.errors;
const Utils = Me.imports.utils;

const LINE_NOT_FOUND = -1;

/* exported JsTextFile */
var JsTextFile = class {
    constructor(path, logger) {
        this.logger = Utils.getDefaultIfInvalid(logger, Utils.getDefaultLogger());
        if (!Utils.isValid(path)) {
            throw new Errors.IoError('JsTextFile: no path specified', this.logger.error);
        }
        this.logger.debug(`Creating JsTextFile for path ${path}`);
        this.path = path;
        this._lines = null;
        this._loadLines();
    }

    // Returns true if file exists, false if not
    exists() {
        if (GLib.file_test(this.path, GLib.FileTest.EXISTS)) {
            return true;
        }
        this.logger.error(`JsTextFile: File does not exist : ${this.path}`);
        return false;
    }

    // Loads all lines from the text file
    _loadLines() {
        if (!this.exists()) {
            throw new Errors.IoError(`JsTextFile: trying to load non-existing file ${this.path}`,
                this.logger.error);
        }
        const file = Gio.file_new_for_path(this.path);
        const [result, contents] = file.load_contents(null);
        if (!result) {
            this.logger.error(`Could not read file: ${this.path}`);
            throw new Errors.IoError(`JsTextFile: trying to load non-existing file ${this.path}`,
                this.logger.error);
        }
        let content = Utils.arrayToString(contents);
        const LAST_CHARACTER = -1;
        const FIRST_CHARACTER = 0;
        if (content.slice(LAST_CHARACTER) == '\n') {
            content = content.slice(FIRST_CHARACTER, LAST_CHARACTER);
        }
        this._lines = content.split('\n');
    }

    // Returns the number in the lines-array that contains the matching string
    // Returns LINE_NOT_FOUND if text is not found
    _getLineNum(text) {
        if (!this.exists()) {
            return LINE_NOT_FOUND;
        }
        return this._lines.indexOf(text);
    }

    // Saves the lines to a file
    saveFile(removeEmptyLines) {
        if (!this.exists()) {
            return;
        }
        if (removeEmptyLines === true) {
            this._removeEmptyLines();
        }
        try {
            const lines = this._lines.join('\n');
            // make sure file ends with a newline
            GLib.file_set_contents(this.path, `${lines}\n`);
        } catch (exception) {
            throw new Errors.FileWriteError(exception.toString(), this.path, this.logger.error);
        }
    }

    _removeEmptyLines() {
        this._lines = this._lines.filter((value) => {
            return (value !== '');
        });
    }

    get lines() {
        if (!this.exists()) {
            this.logger.error('JsTextFile: no path specified');
        }
        return this._lines;
    }

    removeLine(text) {
        const lineNum = this._getLineNum(text);
        if (lineNum == LINE_NOT_FOUND) {
            return false;
        }
        const NUMBER_OF_LINES_TO_REMOVE = 1;
        this._lines.splice(lineNum, NUMBER_OF_LINES_TO_REMOVE);
        return true;
    }

    addLine(text, atFront) {
        if (!this.exists()) {
            return false;
        }
        if (atFront === true) {
            this._lines.unshift(text);
            return true;
        }
        this._lines.push(text);
        return true;
    }

    modifyLine(oldtext, newtext) {
        if (!this.exists()) {
            return false;
        }
        const index = this._getLineNum(oldtext);
        if (index != LINE_NOT_FOUND) {
            this._lines[index] = newtext;
            return true;
        }
        return false;
    }

    set lines(newlines) {
        this._lines = newlines;
    }
};

/* vi: set expandtab tabstop=4 shiftwidth=4: */
