const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Errors = Extension.imports.errors;
const File = Extension.imports.jsTextFile.JsTextFile;
const Utils = Extension.imports.utils;

/* exported Settings */
var Settings = class {
    constructor(params) {
        const parameters = Object.assign({
            settingsFile: undefined,
            schema: null,
            schemaDir: null,
            logger: null
        }, params);
        if (typeof parameters.logger == 'undefined' || parameters.logger === null) {
            this.logger = Utils.getDefaultLogger();
            this.logger.warning('Using default logger instead of injected one');
        } else {
            this.logger = parameters.logger;
        }
        this._loadedSettings = Utils.getDefaultIfInvalid(this._jsonFileToDictionary(parameters.settingsFile), null);
        this._flatSettings = this._getFlatSettings();
        this._settings = null,
        this._createGioSettings(parameters.schema, parameters.schemaDir);
        this._connectedSignals = [];
    }

    _jsonFileToDictionary(settingsFile) {
        if (settingsFile === undefined) {
            settingsFile = `${Extension.path}/settings.json`;
        }
        const jsonFile = new File(settingsFile, this.logger);
        try {
            return JSON.parse(jsonFile.lines.join(''));
        } catch (err) {
            if (err.name == 'SyntaxError') {
                throw new Errors.JsonError(`${settingsFile} is not a valid JSON file`);
            }
            throw err;
        }
    }

    _createGioSettings(schema, schemaDir) {
        if (Utils.isValid(schemaDir)) {
            schemaDir = Gio.File.new_for_path(schemaDir);
        } else {
            schemaDir = Extension.dir.get_child('schemas');
        }
        let schemaSource;
        const GioSSS = Gio.SettingsSchemaSource;
        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
        } else {
            schemaSource = GioSSS.get_default();
        }
        const schemaObj = schemaSource.lookup(schema, true);
        if (!schemaObj) {
            throw new Error(`Schema ${schema} could not be found for extension ${Extension.metadata.uuid
            }. Please check your installation.`);
        }

        this._settings = new Gio.Settings({
            settings_schema: schemaObj
        });
    }

    _getFlatRecursive(toFlatten, resultDict) {
        for (const element in toFlatten) {
            if (Object.prototype.hasOwnProperty.call(toFlatten, element)) {
                if (element == 'type') {
                    continue;
                }
                if (this._isContainer(toFlatten[element])) {
                    resultDict[element] = toFlatten[element];
                    this._getFlatRecursive(toFlatten[element], resultDict);
                    continue;
                }
                resultDict[element] = toFlatten[element];
            }
        }
    }

    _getFlatSettings() {
        const resultDict = {};
        this._getFlatRecursive(this._loadedSettings, resultDict);
        return resultDict;
    }

    _getProperty(element, property, errorValue, inCategory) {
        const setting = this._getSetting(element, inCategory);
        if (!Utils.isChildValid(setting, property)) {
            return errorValue;
        }
        return setting[property];
    }

    getType(name, inCategory) {
        return this._getProperty(name, 'type', null, inCategory);
    }

    getValueObject(setting) {
        return this._getProperty(setting, 'value_object', null);
    }

    getSignature(setting) {
        return this._getProperty(setting, 'signature', null);
    }

    exists(setting) {
        return Utils.isValid(this._getSetting(setting));
    }

    _translatePath(path) {
        return path.replace('$HOME', GLib.get_home_dir()).replace('~', GLib.get_home_dir());
    }

    _getFromSchema(setting) {
        if (this.getType(setting) == 'boolean') {
            return this._settings.get_boolean(setting);
        }
        if (this.getType(setting) == 'string') {
            return this._settings.get_string(setting);
        }
        if (this.getType(setting) == 'path') {
            return this._translatePath(this._settings.get_string(setting));
        }
        if (this.getType(setting) == 'integer') {
            return this._settings.get_int(setting);
        }
        if (this.getType(setting) == 'dictionary') {
            const valueObject = this.getValueObject(setting);
            const value = this._settings.get_value(setting);
            if (valueObject !== null) {
                const dictionary = value.unpack();
                const valueArray = valueObject.split('.');
                let ctr = Extension.imports;
                for (const element in valueArray) {
                    if (Object.prototype.hasOwnProperty.call(valueArray,element)) {
                        ctr = ctr[valueArray[element]];
                    }
                }
                for (const key in dictionary) {
                    if (Object.prototype.hasOwnProperty.call(dictionary,key)) {
                        dictionary[key] = new ctr(dictionary[key]);
                    }
                }
                return dictionary;
            }
            return value.deep_unpack();
        }
        if (this.getType(setting) == 'shortcut') {
            const SHORTCUT_LOCATION = 0;
            return this._settings.get_strv(setting)[SHORTCUT_LOCATION];
        }
        return null;
    }

    _keyExistsInSchema(setting) {
        return (this._settings.list_keys().includes(setting));
    }

    _jsonHasDefault(setting) {
        return Utils.isChildValid(this._getSetting(setting), 'default_value');
    }

    _getDefaultFromJson(setting) {
        return this._getProperty(setting, 'default_value', null);
    }

    _getTypeBasedDefault(setting) {
        if (this.getType(setting) == 'boolean') {
            return false;
        }
        if (this.getType(setting) == 'string') {
            return '';
        }
        if (this.getType(setting) == 'path') {
            return this._translatePath('~');
        }
        if (this.getType(setting) == 'integer') {
            const DEFAULT_INTEGER_SETTING_VALUE = 0;
            return DEFAULT_INTEGER_SETTING_VALUE;
        }
        if (this.getType(setting) == 'dictionary') {
            return [];
        }
        if (this.getType(setting) == 'shortcut') {
            return '';
        }
        this.logger.error(`Could not return correct value for ${setting}`);
        return null;

    }

    get(setting) {
        if (this.getType(setting) === null) {
            return null;
        }
        if (this._keyExistsInSchema(setting)) {
            return this._getFromSchema(setting);
        }
        if (this._jsonHasDefault(setting)) {
            this.logger.info(`${setting} not found in schema, using default value from json file`);
            return this._getDefaultFromJson(setting);
        }
        this.logger.info(`${setting} not found in schema, trying to use type-based default value`);
        return this._getTypeBasedDefault(setting);
    }

    set(setting, value) {
        this.logger.debug(`Setting ${setting} to ${value}`);

        if (this.getType(setting) == 'boolean') {
            this._settings.set_boolean(setting, value);
            return;
        }

        if (this.getType(setting) == 'string' || this.getType(setting) == 'path') {
            if (typeof value == 'string') {
                this._settings.set_string(setting, value);
                return;
            }

            throw new Errors.SettingsTypeError(setting, 'string', value);

        }

        if (this.getType(setting) == 'integer') {
            if (typeof value == 'number') {
                this._settings.set_int(setting, value);
                return;
            }

            throw new Errors.SettingsTypeError(setting, 'integer', value);

        }

        if (this.getType(setting) == 'dictionary') {
            let variant = null;
            if (this.getValueObject(setting) !== null) {
                const keyType = new GLib.VariantType(this.getSignature(setting)).element().key();
                const dictToWrite = [];
                for (const key in value) {
                    if (Object.prototype.hasOwnProperty.call(value,key)) {
                        dictToWrite.push(GLib.Variant.new_dict_entry(new GLib.Variant(keyType.dup_string(),
                            key), value[key].toVariant()));
                    }
                }
                variant = GLib.Variant.new_array(null, dictToWrite);
            } else {
                variant = new GLib.Variant(this.getSignature(setting), value);
            }
            this._settings.set_value(setting, variant);
            return;
        }

        if (this.getType(setting) == 'shortcut') {
            this._settings.set_strv(setting, [value]);
            return;
        }
        this.logger.error(`Trying to set non-existing setting ${setting}`);
    }

    getGioSettings() {
        return this._settings;
    }

    registerForChange(setting, callback) {
        this.logger.debug(`Registering ${callback} for ${setting}`);
        try {
            this._connectedSignals.push(this._settings.connect(`changed::${setting}`, callback));
        } catch (err) {
            this.logger.error(`Could not register for changed signal on setting ${setting} : ${err}`);
        }
    }

    unregisterCallbacks() {
        if (this._connectedSignals !== null) {
            this._connectedSignals.forEach((signal) => {
                if (signal !== undefined && signal !== null && signal !== 0) { // eslint-disable-line no-magic-numbers
                    this._settings.disconnect(signal);
                }
            });
        }
        this._connectedSignals = [];
    }

    getCategory(name) {
        const [setting, category, ] = this._recursiveSearch(name, this._loadedSettings);
        if (!Utils.isValid(setting)) {
            return null;
        }
        return category;
    }

    getSubContainer(name) {
        const [setting, category, subcontainer] = this._recursiveSearch(name, this._loadedSettings);
        if (!Utils.isValid(setting)) {
            return null;
        }
        if (Utils.isChildValid(this._loadedSettings, category) &&
            Utils.isChildValid(this._loadedSettings[category], name)) {
            // TODO: the recursive search function should handle this case
            return null;
        }
        return subcontainer;
    }

    getAllInCategory(category) {
        if (!Utils.isValid(this._loadedSettings[category])) {
            return [];
        }
        const toReturn = [];
        const catArr = this._loadedSettings[category];
        for (const key in catArr) {
            if (Object.prototype.hasOwnProperty.call(catArr,key)) {
                if (key == 'type') {
                    continue;
                }
                if (this._isSubcontainer(catArr[key])) {
                    for (const subkey in catArr[key]) {
                        if (Object.prototype.hasOwnProperty.call(catArr[key],subkey)) {
                            if (subkey == 'type') {
                                continue;
                            }
                            toReturn.push([subkey, catArr[key][subkey]]);
                        }
                    }
                    continue;
                }
                toReturn.push([key, catArr[key]]);
            }
        }
        return toReturn;
    }

    getAllInSubcontainer(category, subcontainer) {
        if (!Utils.isChildValid(this._loadedSettings, category)) {
            return [];
        }
        if (!Utils.isChildValid(this._loadedSettings[category], subcontainer)) {
            return [];
        }
        const toReturn = [];
        for (const key in this._loadedSettings[category][subcontainer]) {
            if (Object.prototype.hasOwnProperty.call(this._loadedSettings[category][subcontainer],key)) {
                if (key == 'type') {
                    continue;
                }
                toReturn.push([key, this._loadedSettings[category][subcontainer][key]]);
            }
        }
        return toReturn;
    }

    getAll(type) {
        const toReturn = [];
        for (const setting in this._flatSettings) {
            if (this.getType(setting) == type) {
                toReturn.push([setting, this._flatSettings[setting]]);
            }
        }
        return toReturn;
    }

    getAllCategories() {
        const toReturn = [];
        for (const category in this.getAll('category')) {
            if (Object.prototype.hasOwnProperty.call(this.getAll('category'),category)) {
                const NAME = 0;
                toReturn.push(this.getAll('category')[category][NAME]);
            }
        }
        return toReturn;
    }

    getAllSubContainers(category) {
        const toReturn = [];
        for (const element in this._loadedSettings[category]) {
            if (Object.prototype.hasOwnProperty.call(this._loadedSettings[category],element)) {
                if (element == 'type') {
                    continue;
                }
                const subElement = this._loadedSettings[category][element];
                if (!Utils.isValid(subElement.type)) {
                    continue;
                }
                if (this._isSubcontainer(subElement)) {
                    toReturn.push(element);
                }
            }
        }
        return toReturn;
    }

    getSummary(setting) {
        return this._getProperty(setting, 'summary', '');
    }

    getHumanName(setting) {
        return this._getProperty(setting, 'human_name', setting);
    }

    getHelp(setting) {
        return this._getProperty(setting, 'help', '');
    }

    getExtraParams(setting) {
        return this._getProperty(setting, 'extra_params', null);
    }

    getWidget(setting) {
        return this._getProperty(setting, 'widget', 'default');
    }

    getLevel(setting) {
        return this._getProperty(setting, 'level', '0');
    }

    _isContainer(element) {
        if (Object.prototype.hasOwnProperty.call(element, 'type') && element.type == 'category') {
            return true;
        }
        return this._isSubcontainer(element);
    }

    _isSubcontainer(element) {
        if (Object.prototype.hasOwnProperty.call(element, 'type') && element.type == 'subcategory') {
            return true;
        }
        if (Object.prototype.hasOwnProperty.call(element, 'type') && element.type == 'subsection') {
            return true;
        }
        return false;
    }

    _recursiveSearch(needle, haystack, lastCategory, lastSubcontainer) {
        lastCategory = Utils.getDefaultIfInvalid(lastCategory, null);
        lastSubcontainer = Utils.getDefaultIfInvalid(lastSubcontainer, null);
        for (const element in haystack) {
            if (Object.prototype.hasOwnProperty.call(haystack,element)) {
                let result = null;
                if (this._isContainer(haystack[element])) {
                    if (this._isSubcontainer(haystack[element])) {
                        lastSubcontainer = element;
                    } else {
                        lastCategory = element;
                    }
                    [result, lastCategory, lastSubcontainer] = this._recursiveSearch(needle, haystack[element],
                        lastCategory, lastSubcontainer);
                }
                if (element == needle) {
                    result = haystack[element];
                }
                if (result !== null) {
                    return [result, lastCategory, lastSubcontainer];
                }
            }
        }
        return [null, lastCategory, lastSubcontainer];
    }

    _getSetting(name, inCategory) {
        const searchRoot = Utils.getFirstValidChild(this, [`_loadedSettings.${inCategory}`, '_loadedSettings']);
        const [setting, ] = this._recursiveSearch(name, searchRoot);
        if (setting === null) {
            this.logger.info(`Non-existing setting requested: ${name}`);
        }
        return setting;
    }

    hasSubcategories(category) {
        const subcontainers = this.getAllSubContainers(category);
        for (const i in subcontainers) {
            if (this._getSetting(subcontainers[i]).type == 'subcategory') {
                return true;
            }
        }
        return false;
    }
};

/* vi: set expandtab tabstop=4 shiftwidth=4: */
