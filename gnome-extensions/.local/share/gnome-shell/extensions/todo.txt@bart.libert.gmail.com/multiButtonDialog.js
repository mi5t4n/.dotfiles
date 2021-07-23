const ModalDialog = imports.ui.modalDialog;
const {St, GObject} = imports.gi;
const valueOrDefault = imports.misc.extensionUtils.getCurrentExtension().imports.utils.getDefaultIfInvalid;

/* exported ButtonMapping */
var ButtonMapping = class {
    constructor(label, key, action) {
        this.label = valueOrDefault(label, null);
        this.key = valueOrDefault(key, null);
        this.action = valueOrDefault(action, null);
    }
};

/* exported MultiButtonDialog */
var MultiButtonDialog = GObject.registerClass({
    GTypeName: 'MultiButtonDialog',
    Signals: { 'opened': {}, 'closed': {} }
}, class extends ModalDialog.ModalDialog {
    _init(title, question, buttonMappings) {
        super._init({
            styleClass: 'confirm-dialog'
        });
        this.question = valueOrDefault(question, null);
        this.title = valueOrDefault(title, null);

        const tlabel = new St.Label({
            style_class: 'confirm-dialog-title',
            text: this.title
        });
        this.contentLayout.add(tlabel, {
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        const label = new St.Label({
            style_class: 'confirm-dialog-label',
            text: this.question
        });
        this.contentLayout.add(label, {
            y_align: St.Align.MIDDLE
        });

        const buttons = [];
        for (const i in buttonMappings) {
            /*jshint loopfunc: true */
            if (Object.prototype.hasOwnProperty.call(buttonMappings,i)) {
                const mapping = buttonMappings[i];
                buttons.push({
                    label: mapping.label,
                    key: mapping.key,
                    action: () => {
                        if (mapping.action !== null) {
                            mapping.action();
                        }
                        this.close();
                    }
                });
            }
        }

        this.setButtons(buttons);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
