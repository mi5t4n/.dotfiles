const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain('todotxt');
const _ = Gettext.gettext;

/* exported PathWidget */
var PathWidget = GObject.registerClass({
    GTypeName: 'PathWidget'
}, class PathWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    launchFileChooser(entryTarget, title, setting, settings) {
        let dialogTitle = _("Select file");
        if (title !== null) {
            dialogTitle = title;
        }
        const chooser = new Gtk.FileChooserDialog({
            title: dialogTitle,
            action: Gtk.FileChooserAction.OPEN,
            modal: true
        });

        const CANCEL = 0;
        const OPEN = 1;
        chooser.add_button(Gtk.STOCK_CANCEL, CANCEL);
        chooser.add_button(Gtk.STOCK_OPEN, OPEN);
        chooser.set_default_response(OPEN);
        let filename = null;
        if (chooser.run() == OPEN) {
            filename = chooser.get_filename();
            if (filename) {
                entryTarget.set_text(filename);
                settings.set(setting, filename);
            }
        }
        chooser.destroy();
    }

    _init(setting, settings) {
        super._init(setting, settings);
        this.spacing = 6;

        const locationValue = new Gtk.Entry({
            hexpand: true
        });
        locationValue.set_text(settings.get(setting));
        const locationBrowse = new Gtk.Button({
            label: _("Browse")
        });
        locationBrowse.connect('clicked', () => {
            this.launchFileChooser(locationValue, (this._params.description), setting, settings);
        });
        locationValue.connect('focus-out-event', (ignored_object) => {
            log(`Setting ${setting} to ${locationValue.get_text()}`);
            settings.set(setting, locationValue.get_text());
        });
        locationValue.connect('activate', (ignored_object) => {
            log(`Setting ${setting} to ${locationValue.get_text()}`);
            settings.set(setting, locationValue.get_text());
        });

        this._addHelp(locationValue);

        this.box.add(locationValue);
        this.box.add(locationBrowse);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
