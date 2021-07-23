const Clutter = imports.gi.Clutter;
const ModalDialog = imports.ui.modalDialog;
const {St, GObject} = imports.gi;

const Gettext = imports.gettext;
const _ = Gettext.domain('todotxt').gettext;

/* exported MessageDialog */
var MessageDialog = GObject.registerClass({
    GTypeName: 'MessageDialog',
    Signals: { 'opened': {}, 'closed': {} }
}, class extends ModalDialog.ModalDialog {

    _init(title, message) {
        super._init({
            styleClass: 'message-dialog'
        });

        this.message = message;
        this.title = title;

        const tlabel = new St.Label({
            style_class: 'message-dialog-title',
            text: this.title
        });
        this.contentLayout.add(tlabel, {
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        const label = new St.Label({
            style_class: 'message-dialog-label',
            text: this.message,
        });
        label.clutter_text.line_wrap = true;
        this.contentLayout.add(label, {
            y_align: St.Align.MIDDLE
        });

        const buttons = [{
            label: _("Ok"),
            action: () => this._onOkButton(),
            key: Clutter.Return
        }];
        this.setButtons(buttons);
    }

    close() {
        super.close();
    }

    _onOkButton() {
        this.close();
    }

    open() {
        super.open();
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
