const {Gtk, GObject} = imports.gi;
const Signals = imports.signals;

var ButtonCellRenderer = GObject.registerClass({
    GTypeName: 'ButtonCellRenderer'

}, class ButtonCellRenderer extends Gtk.CellRendererPixbuf {

    _init() {
        super._init();
        this.activateable = true;
        this.mode = Gtk.CellRendererMode.ACTIVATABLE;
    }

    vfunc_activate(event, widget, path) {
        this.emit('clicked', path);
    }
});
Signals.addSignalMethods(ButtonCellRenderer.prototype);

/* vi: set expandtab tabstop=4 shiftwidth=4: */
