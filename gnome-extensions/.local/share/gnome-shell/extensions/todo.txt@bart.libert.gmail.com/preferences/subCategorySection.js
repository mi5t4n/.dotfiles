const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;

const _ = imports.gettext.domain('todotxt').gettext;

/* exported SubCategorySection */
var SubCategorySection = GObject.registerClass({
    GTypeName: 'SubCategorySection'
}, class SubCategorySection extends Gtk.Box {

    _init(title) {
        super._init();
        this._visible = false;
        this.label = new Gtk.Label({
            label: `<b>${_(title)}</b>`,
            use_markup: true,
            xalign: 0
        });
        this.orientation = Gtk.Orientation.VERTICAL;
        this.vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_start: 20,
        });
        Gtk.Box.prototype.add.call(this, this.label);
        Gtk.Box.prototype.add.call(this, this.vbox);
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
    }

    isVisible() {
        this._updateVisibility();
        return this._visible;
    }

    add(child) {
        if (child === null) {
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
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
