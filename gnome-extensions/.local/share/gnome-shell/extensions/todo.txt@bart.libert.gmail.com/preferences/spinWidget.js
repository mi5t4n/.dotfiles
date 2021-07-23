const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

/* exported SpinWidget */
var SpinWidget = GObject.registerClass({
    GTypeName: 'SpinWidget'
}, class SpinWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    _init(setting, settings) {
        super._init(setting, settings);

        const adjustment = new Gtk.Adjustment({
            lower: this._params.range.min,
            upper: this._params.range.max,
            step_increment: this._params.range.step
        });

        const spinButton = new Gtk.SpinButton({
            adjustment,
            snap_to_ticks: true,
        });

        spinButton.set_value(this._settings.get(setting));

        spinButton.connect('value-changed', (entry) => {
            log(`changing ${setting} to ${entry.get_value_as_int()}`);
            this._settings.set(setting, entry.get_value_as_int());
        });

        this._addHelp(spinButton);
        this.box.add(spinButton);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
