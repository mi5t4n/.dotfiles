const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;

const _ = imports.gettext.domain('todotxt').gettext;

const PADDING = 0;

/* exported SubCategoryTab */
var SubCategoryTab = GObject.registerClass({
    GTypeName: 'SubCategoryTab'
}, class SubCategoryTab extends Gtk.Box {

    _init(title) {
        super._init();
        this._visible = false;
        this._buttonBox = null;
        this._helpCreated = false;
        this.label = new Gtk.Label({
            label: _(title),
            margin_top: 0
        });
        this.orientation = Gtk.Orientation.VERTICAL;
        this.vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            border_width: 10,
            vexpand: true,
        });
        Gtk.Box.prototype.add.call(this, this.vbox);
        this._helpWidgets = [];
    }

    _getHelpText() {
        let helpText = '';

        for (const widget in this._helpWidgets) {
            if (Object.prototype.hasOwnProperty.call(this._helpWidgets, widget)) {
                if (this._helpWidgets[widget].isVisible()) {
                    helpText = helpText + this._helpWidgets[widget]._help;
                }
            }
        }
        return helpText;
    }

    _createHelp() {
        const helpButton = new Gtk.Button({
            label: _("Help"),
        });

        this._buttonBox = new Gtk.HButtonBox({
            layout_style: Gtk.ButtonBoxStyle.END
        });

        helpButton.connect('clicked', (ignored_object) => {
            const dialog = new Gtk.MessageDialog({
                buttons: Gtk.ButtonsType.OK,
                text: _(this._getHelpText()),
                message_type: Gtk.MessageType.INFO
            });
            dialog.run();
            dialog.destroy();
        });
        this._buttonBox.add(helpButton);
        this.vbox.pack_end(this._buttonBox, false, false, PADDING);
    }

    _updateVisibility() {
        this._visible = false;
        for (const child in this.vbox.get_children()) {
            if (Object.prototype.hasOwnProperty.call(this.vbox.get_children(),child)) {
                if (Utils.isValid(this.vbox.get_children()[child].isVisible)) {
                    this._visible = this._visible || this.vbox.get_children()[child].isVisible();
                }
            }
        }
        let buttonBoxVisible = false;
        for (const widget in this._helpWidgets) {
            if (Object.prototype.hasOwnProperty.call(this._helpWidgets,widget)) {
                buttonBoxVisible = buttonBoxVisible || this._helpWidgets[widget].isVisible();
            }
        }
        if (buttonBoxVisible) {
            if (!this._helpCreated) {
                this._createHelp();
                this._helpCreated = true;
            }
            this._buttonBox.show();
        } else {
            if (this._buttonBox !== null) {
                this._buttonBox.hide();
            }
        }
    }

    isVisible() {
        this._updateVisibility();
        return this._visible;
    }

    add(child) {
        if (child === null) {
            return;
        }
        if (child instanceof Extension.imports.preferences.helpWidget.HelpWidget) {
            this._helpWidgets.push(child);
            return;
        }

        this.vbox.add(child);
        this._updateVisibility();
    }

    remove(child) {
        if (child === null) {
            return;
        }
        this.vbox.remove(child);
        this._updateVisibility();
    }

    getTitle() {
        return this.label;
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
