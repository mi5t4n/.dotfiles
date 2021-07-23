const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

/* exported ColorWidget */
var ColorWidget = GObject.registerClass({
    GTypeName: 'ColorWidget'
}, class ColorWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    _init(setting, settings) {
        super._init(setting, settings);

        const oldColor = new Gdk.RGBA();
        oldColor.parse(settings.get(setting));

        const customColorButton = new Gtk.ColorButton({
            'rgba': oldColor
        });

        customColorButton.connect('color-set', (ignored_object) => {
            const color = customColorButton.get_rgba().to_string();
            log(`Setting ${setting} to ${color}`);
            settings.set(setting, color);
        });

        this._addHelp(customColorButton);

        this.box.add(customColorButton);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
