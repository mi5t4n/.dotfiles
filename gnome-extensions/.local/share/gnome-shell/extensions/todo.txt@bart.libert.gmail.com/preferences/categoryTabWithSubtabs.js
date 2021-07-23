const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.utils;

const _ = imports.gettext.domain('todotxt').gettext;

/* exported CategoryTabWithSubtabs */
var CategoryTabWithSubtabs = GObject.registerClass({
    GTypeName: 'CategoryTabWithSubtabs'
}, class CategoryTabWithSubtabs extends Gtk.Notebook {

    _init(title) {
        super._init();
        this._visible = false;

        this.titleLabel = new Gtk.Label({
            label: _(title),
            xalign: 0,
            margin_top: 0
        });
    }

    getTitle() {
        return this.titleLabel;
    }

    _updateVisibility() {
        this._visible = false;
        for (let i = 0, len = this.get_n_pages(); i < len; i++) {
            const page = this.get_nth_page(i);
            if (Utils.isValid(page.isVisible())) {
                this._visible = this._visible || page.isVisible();
            }
        }
    }

    isVisible() {
        this._updateVisibility();
        return this._visible;
    }

    add(element) {
        this.append_page(element, element.getTitle());
        this._updateVisibility();
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
