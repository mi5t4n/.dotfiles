const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

/* exported BooleanWidget */
var BooleanWidget = GObject.registerClass({
    GTypeName: 'BooleanWidget'
},
class BooleanWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    _init(setting, settings) {
        super._init(setting, settings);

        const settingsSwitch = new Gtk.Switch({
            active: settings.get(setting),
        });

        this._addHelp(settingsSwitch);

        settingsSwitch.connect('notify::active', (object) => {
            log(`changing boolean ${setting} to ${object.active}`);
            settings.set(setting, object.active);
        });

        this.box.add(settingsSwitch);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
