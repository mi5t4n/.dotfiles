const Gettext = imports.gettext;
const _ = Gettext.domain('todotxt').gettext;

const TodoTxtErrorTypes = {
    TODO_TXT_ERROR: 0,
    FILE_WRITE_PERMISSION_ERROR: 1,
    FILE_WRITE_ERROR: 2
};

const TodoTxtError = class extends Error {
    constructor(error, logFunction) {
        super(error);
        this.type = TodoTxtErrorTypes.TODO_TXT_ERROR;

        if (error === undefined) {
            error = '';
        }
        if (typeof logFunction == 'function') {
            logFunction(error);
        }
        this.message = error;
    }
};

/* exported FileWritePermissionError */
var FileWritePermissionError = class extends TodoTxtError {
    constructor(filename, logFunction) {
        super(_("%(file) cannot be written. Please check its permissions").replace('%(file)', filename),
            logFunction);
        this.type = TodoTxtErrorTypes.FILE_WRITE_PERMISSION_ERROR;
    }
};

/* exported FileWriteError */
var FileWriteError = class extends TodoTxtError {
    constructor(error, filename, logFunction) {
        super(_("An error occured while writing to %(file): %(error)").replace('%(file)', filename).replace(
            '%(error)', error), logFunction);
        this.type = TodoTxtErrorTypes.FILE_WRITE_ERROR;
    }
};

/* exported ConfigurationError */
var ConfigurationError = class extends TodoTxtError {
    constructor(error, logFunction) {
        super(error, logFunction);
        this.name = 'ConfigurationError';
    }
};

/* exported UndefinedTokenError */
var UndefinedTokenError = class extends TodoTxtError {
    constructor(error, logFunction) {
        super(error, logFunction);
        this.name = 'UndefinedTokenError';
    }
};

/* exported IoError */
var IoError = class extends TodoTxtError {
    constructor(error, logFunction) {
        super(error, logFunction);
        this.name = 'IoError';
    }
};

/* exported JsonError */
var JsonError = class extends TodoTxtError {
    constructor(error, logFunction) {
        super(error, logFunction);
        this.name = 'JsonError';
    }
};

/* exported SettingsTypeError */
var SettingsTypeError = class extends TodoTxtError {
    constructor(setting, expectedType, value) {
        super(`Expected value of type ${expectedType}, but got ${typeof value
        } while setting ${setting}`);
        this.name = 'SettingsTypeError';
    }
};

/* vi: set expandtab tabstop=4 shiftwidth=4: */
