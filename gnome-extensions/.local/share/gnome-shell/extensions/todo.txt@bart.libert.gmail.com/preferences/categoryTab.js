const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;
const _ = imports.gettext.domain('todotxt').gettext;

/* exported CategoryTab */
var CategoryTab = GObject.registerClass({
    GTypeName: 'CategoryTab'
}, class CategoryTab extends Gtk.Box {
    _init(title) {
        super._init();
        this._visible = false;
        this.orientation = Gtk.Orientation.VERTICAL;
        this.border_width = 10;
        this.vexpand = true;
        this.spacing = 6;

        this.titleLabel = new Gtk.Label({
            label: _(title),
            xalign: 0,
            margin_top: 0
        });
    }

    _updateVisibility() {
        this._visible = false;
        for (const child in this.get_children()) {
            if (Object.prototype.hasOwnProperty.call(this.get_children(),child)) {
                if (Utils.isValid(this.get_children()[child].isVisible)) {
                    this._visible = this._visible || this.get_children()[child].isVisible();
                }
            }
        }
    }

    isVisible() {
        this._updateVisibility();
        return this._visible;
    }

    getTitle() {
        return this.titleLabel;
    }

    add(child) {
        super.add(child);
        this._updateVisibility();
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
