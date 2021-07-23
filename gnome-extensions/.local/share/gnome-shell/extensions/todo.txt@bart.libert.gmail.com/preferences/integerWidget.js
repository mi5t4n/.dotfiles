const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;

const _ = imports.gettext.domain('todotxt').gettext;

const COL_COMBO_VALUE = 0;
const COL_COMBO_TEXT = 1;

/* exported IntegerWidget */
var IntegerWidget = GObject.registerClass({
    GTypeName: 'IntegerWidget'
}, class IntegerWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    _init(setting, settings) {
        super._init(setting, settings);

        const model = new Gtk.ListStore();
        model.set_column_types([GObject.TYPE_INT, GObject.TYPE_STRING]);
        const comboBox = new Gtk.ComboBox({
            model
        });

        const EMPTY = 0;
        if (this._params.options.length === EMPTY) {
            comboBox.sensitive = false;
        }

        const indexedOptions = this._convertOptionArrayToIndexedArray(this._params.options);
        for (const i in indexedOptions) {
            if (Object.prototype.hasOwnProperty.call(indexedOptions,i)) {
                if (!Utils.isValid(indexedOptions[i])) {
                    continue;
                }
                const row = model.insert(parseInt(i));
                model.set(row, [COL_COMBO_VALUE, COL_COMBO_TEXT], [parseInt(i), _(indexedOptions[i])]);
                if (model.get_value(row, COL_COMBO_VALUE) === this._settings.get(setting)) {
                    comboBox.set_active_iter(row);
                }
            }
        }

        const cell = new Gtk.CellRendererText();
        comboBox.pack_start(cell, true);
        comboBox.add_attribute(cell, 'text', COL_COMBO_TEXT);

        comboBox.connect('changed', (object) => {
            const model = object.get_model();
            const [success, iter] = object.get_active_iter();
            if (!success) {
                return;
            }
            const activeValue = model.get_value(iter, COL_COMBO_VALUE);
            const activeText = model.get_value(iter, COL_COMBO_TEXT);
            log(`changing ${setting} to ${activeValue} (${activeText})`);
            this._settings.set(setting, activeValue);
        });

        this._addHelp(comboBox);
        this.box.add(comboBox);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
