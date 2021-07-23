const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

/* exported StringWidget */
var StringWidget = GObject.registerClass({
    GTypeName: 'StringWidget'
}, class StringWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    _init(setting, settings) {
        super._init(setting, settings);

        const textFieldValue = new Gtk.Entry({
            hexpand: true
        });
        textFieldValue.set_text(this._settings.get(setting));
        textFieldValue.connect('focus-out-event', (ignored_object) => {
            log(`Setting ${setting} to ${textFieldValue.get_text()}`);
            this._settings.set(setting, textFieldValue.get_text());
        });
        textFieldValue.connect('activate', (ignored_object) => {
            log(`Setting ${setting} to ${textFieldValue.get_text()}`);
            this._settings.set(setting, textFieldValue.get_text());
        });
        this._addHelp(textFieldValue);
        this.box.add(textFieldValue);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
