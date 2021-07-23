const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Signals = imports.signals;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;
const _ = imports.gettext.domain('todotxt').gettext;

/* exported PreferenceWidget */
var PreferenceWidget = GObject.registerClass({
    GTypeName: 'PreferenceWidget'
}, class PreferenceWidget extends Gtk.Box {

    _init(settingName, settings, noLabel) {
        super._init();
        this._settingName = settingName;
        this._settings = settings;
        this._help = this._settings.getHelp(this._settingName);
        this.spacing = 6;
        this.orientation = Gtk.Orientation.HORIZONTAL;

        this._params = Object.assign({
            sensitivity: null,
            description: _("No description"),
            options: ['No options defined'],
            shortcuts: [],
            range: {
                'min': 1,
                'max': 65535,
                'step': 1
            }
        }, settings.getExtraParams(settingName));

        this.box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            margin: 3
        });

        const PADDING = 0;

        this.revealer = new Gtk.Revealer();
        this.revealer.set_reveal_child(this.isVisible());
        this.revealer.add(this.box);

        this.pack_start(this.revealer, true, true, PADDING);
        this._registerLevel();
        this._registerSensitivity(this._params.sensitivity, () => {
            this._updateRevealerVisibility();
            this.revealer.sensitive = this._isSensitive(this._params.sensitivity);
        });

        if (noLabel === true) {
            return;
        }

        this.box.pack_start(this._getLabel(), true, true, PADDING);
    }

    _isSensitive(sensitivityArray) {
        if (sensitivityArray === null) {
            return true;
        }
        for (const checkSetting in sensitivityArray) {
            if (Object.prototype.hasOwnProperty.call(sensitivityArray,checkSetting)) {
                let checkSettingArray = sensitivityArray[checkSetting];
                if (this._settings.getType(checkSetting) == 'integer') {
                    checkSettingArray = this._convertOptionArrayToIndexedArray(sensitivityArray[
                        checkSetting]);
                }
                const currentCheckSettingValue = this._settings.get(checkSetting);
                if (typeof checkSettingArray[currentCheckSettingValue] != 'undefined') {
                    return checkSettingArray[currentCheckSettingValue];
                }
            }
        }
        return true;
    }

    _hasVisibleLevel() {
        return (this._settings.getLevel(this._settingName) <= this._settings.get('settings-level'));
    }

    isVisible() {
        return this._hasVisibleLevel() && this._isSensitive(this._params.sensitivity);
    }

    _updateRevealerVisibility() {
        if (Utils.isValid(Gtk.Revealer) && (this.revealer instanceof Gtk.Revealer)) {
            this.revealer.set_reveal_child(this.isVisible());
        } else {
            this.revealer.set_visible(this.isVisible());
        }
        this.emit('visibility-changed');
    }

    _registerLevel() {
        this._settings.registerForChange('settings-level', () => {
            this._updateRevealerVisibility();
        });
    }

    _registerSensitivity(sensitivityArray, callback) {
        if (sensitivityArray === null) {
            return;
        }
        for (const sensitivitySetting in sensitivityArray) {
            if (Object.prototype.hasOwnProperty.call(sensitivityArray,sensitivitySetting)) {
                this._settings.registerForChange(sensitivitySetting, callback);
            }
        }
    }

    _convertOptionArrayToIndexedArray(optionArray) {
        const indexedOptions = {};
        for (const option in optionArray) {
            if (Object.prototype.hasOwnProperty.call(optionArray,option)) {
                indexedOptions[this._optionToInteger(option)] = optionArray[option];
            }
        }
        return indexedOptions;
    }

    _optionToInteger(option) {
        const result = /^#(.*)#$/.exec(option);
        if (result !== null) {
            // eslint-disable-next-line no-magic-numbers
            const importPath = result[1].charAt(0).toLowerCase() + result[1].substring(1);
            const parts = importPath.split('.');
            const FIRST_PART = 0;
            let temp = Extension.imports[parts[FIRST_PART]];
            for (let i = 1; i < parts.length; i++) {
                temp = temp[parts[i]];
            }
            return parseInt(temp);
        }
        return parseInt(option);
    }

    _addHelp(target) {
        if (this._help !== undefined) {
            target.set_tooltip_text(_(this._help));
        }
    }

    _getLabel() {
        const preferenceLabel = new Gtk.Label({
            label: _(this._settings.getHumanName(this._settingName)),
            xalign: 0
        });

        this._addHelp(preferenceLabel);
        return preferenceLabel;
    }

});
Signals.addSignalMethods(PreferenceWidget.prototype);

/* vi: set expandtab tabstop=4 shiftwidth=4: */
