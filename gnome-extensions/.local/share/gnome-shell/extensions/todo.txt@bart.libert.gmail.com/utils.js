const ByteArray = imports.byteArray;
const {Gio, GLib} = imports.gi;
const Gettext = imports.gettext;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Logger = Extension.imports.third_party.logger.logger.Logger;
const Shared = Extension.imports.sharedConstants;

/* exported getDefaultLogger */
function getDefaultLogger() {
    const logger = new Logger();
    logger.prefix = '[todo.txt]';
    logger.addLevel('error', '[ERROR  ]', Shared.LOG_ERROR);
    logger.addLevel('warning', '[WARNING]', Shared.LOG_WARNING);
    logger.addLevel('info', '[INFO   ]', Shared.LOG_INFO);
    logger.addLevel('detail', '[DETAIL ]', Shared.LOG_DETAIL);
    logger.addLevel('debug', '[DEBUG  ]', Shared.LOG_DEBUG);
    logger.addLevel('flow', '[FLOW   ]', Shared.LOG_FLOW);
    logger.addNewLine = false;
    return logger;
}

function isValid(object) {
    if (typeof object == 'undefined') {
        return false;
    }
    if (object === null) {
        return false;
    }
    return true;
}

/* exported isChildValid */
function isChildValid(object, child) {
    if (!isValid(object)) {
        return false;
    }
    return Object.prototype.hasOwnProperty.call(object, child) && isValid(object[child]);
}

/* exported getDefaultIfInvalid */
function getDefaultIfInvalid(object, defaultValue) {
    if (!isValid(object)) {
        return defaultValue;
    }
    return object;
}

/* exported initTranslations */
function initTranslations(extension) {
    const localeDir = extension.dir.get_child('locale').get_path();

    if (GLib.file_test(localeDir, GLib.FileTest.EXISTS)) {
        // Extension installed in .local
        Gettext.bindtextdomain('todotxt', localeDir);
    } else {
        // Extension installed system-wide
        Gettext.bindtextdomain('todotxt', extension.metadata.locale);
    }
}

/* exported getIconFromNames */
function getIconFromNames(names) {
    if (!isValid(names)) {
        return null;
    }
    if (!(names instanceof Array)) {
        names = [ names ];
    }
    return Gio.ThemedIcon.new_from_names(names);
}

function getDottedChild(object, string) {
    return string.split('.').reduce((accumulator, value) => {
        if (Object.prototype.hasOwnProperty.call(accumulator, value) && isValid(accumulator, value)) {
            return accumulator[value];
        }
        return null;
    }, object);
}

/* exported getFirstValidChild */
function getFirstValidChild(object, candidateChildren) {
    for (let i = 0, len = candidateChildren.length; i < len; i++) {
        if (isValid(getDottedChild(object, candidateChildren[i]))) {
            return getDottedChild(object, candidateChildren[i]);
        }
    }
    return null;
}

/* exported arrayToString */
function arrayToString(array) {
    if (array instanceof Uint8Array) {
        return ByteArray.toString(array);
    }
    return array.toString();
}

/* vi: set expandtab tabstop=4 shiftwidth=4: */
