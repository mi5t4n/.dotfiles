const {Clutter, GObject, St} = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const TodoTxtItem = Me.imports.third_party.jsTodoTxt.jsTodoTxt.TodoTxtItem;
const Gettext = imports.gettext;
const _ = Gettext.domain('todotxt').gettext;

/* exported NewTaskEntry */
var NewTaskEntry = GObject.registerClass({
    GTypeName: 'NewTaskEntry'
}, class extends PopupMenu.PopupBaseMenuItem {
    _init(manager, params) {
        super._init(params);
        this.stEntry = new St.Entry({
            name: 'newTaskEntry',
            hint_text: _("New task..."),
            track_hover: true,
            can_focus: true
        });

        this.add_style_class_name('newTaskSection');
        this.stEntry.add_style_class_name('newTaskEntry');

        const tasksMenu = manager.menu;
        const entryNewTask = this.stEntry.clutter_text;

        entryNewTask.connect('key-press-event', (origin, event) => {
            const symbol = event.get_key_symbol();
            if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_KP_Enter || symbol == Clutter.KEY_ISO_Enter) {
                const text = origin.get_text();
                origin.set_text('');
                if (!manager.keepOpenAfterNew) {
                    tasksMenu.close();
                }
                if (text === '') {
                    return;
                }
                manager.topbar.update({
                    busy: true
                });
                const newTask = new TodoTxtItem(text, this.enabledExtensions);
                manager.decorator.addLoggingToNamespace(newTask);
                manager.addTask(newTask);
            }
        });
        this.add(this.stEntry);
    }

    grab_key_focus() {
        this.stEntry.grab_key_focus();
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
