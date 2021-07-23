// This extension was developed by Bart Libert
//
// Based on code by :
// * Baptiste Saleil http://bsaleil.org/
// * Arnaud Bonatti https://github.com/Obsidien
//
// Licence: GPLv2+

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const TodoTxtManager = Extension.imports.todoTxtManager;
const Utils = Extension.imports.utils;

/* exported init */
function init(ignored_metadata) {
    Utils.initTranslations(Extension);
    const logger = Utils.getDefaultLogger();
    return new TodoTxtManager.TodoTxtManager(logger);
}

/* vi: set expandtab tabstop=4 shiftwidth=4: */
