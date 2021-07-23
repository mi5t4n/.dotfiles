const GObject = imports.gi.GObject;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

/* exported HelpWidget */
var HelpWidget = GObject.registerClass({
    GTypeName: 'HelpWidget'
}, class HelpWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
