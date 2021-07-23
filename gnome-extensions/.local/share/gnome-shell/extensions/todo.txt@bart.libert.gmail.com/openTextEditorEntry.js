const {Gio, GLib, GObject} = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext;
const _ = Gettext.domain('todotxt').gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Message = Me.imports.messageDialog.MessageDialog;

/* exported OpenTextEditorEntry */
var OpenTextEditorEntry = GObject.registerClass({
    GTypeName: 'OpenTextEditorEntry'
}, class extends PopupMenu.PopupMenuItem {
    _init(data, params) {
        super._init(_("Open todo.txt file in text editor"), params);
        this.connect('activate', (object, event) => {
            try {
                const CURRENT_WORKSPACE = -1;
                Gio.AppInfo.launch_default_for_uri(GLib.filename_to_uri(data.todofile, null),
                    global.create_app_launch_context(event.get_time(), CURRENT_WORKSPACE));
            } catch (exception) {
                const message = new Message(_("Cannot open file"),
                    _(
                        "An error occured while trying to launch the default text editor: %(error)"
                    ).replace('%(error)', exception.message));
                message.open();
            }
        });
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
