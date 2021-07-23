const Lang = imports.lang;

/* exported LogDecorator */
var LogDecorator = class {
    constructor() {
        this._loggerFunction = log;
    }

    set logger(logger) {
        this._loggerFunction = logger;
    }

    _getLoggedFunction(object, func, name) {
        return Lang.bind(this, function() {
            let logText = `${name}(`;
            for (let i = 0; i < arguments.length; i++) {
                const NO_ARUMGENTS = 0;
                if (i > NO_ARUMGENTS) {
                    logText += ', ';
                }
                logText += arguments[i];
            }
            logText += ');';

            this._loggerFunction.apply(this, [logText]);
            return func.apply(object, arguments);
        });
    }

    addLoggingToNamespace(namespaceObject) {
        for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(namespaceObject))) {
            const potentialFunction = namespaceObject[name];
            if (potentialFunction instanceof Function) {
                namespaceObject[name] = this._getLoggedFunction(namespaceObject, potentialFunction, name);
            }
        }
    }
};

/* vi: set expandtab tabstop=4 shiftwidth=4: */
