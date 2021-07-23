const GObject = imports.gi.GObject;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const ButtonCellRenderer = Extension.imports.preferences.buttonCellRenderer;
const Markup = Extension.imports.markup.Markup;

const Gettext = imports.gettext.domain('todotxt');
const _ = Gettext.gettext;

const COL_PRIORITY = 0;
const COL_CHANGE_COLOR = 1;
const COL_COLOR = 2;
const COL_BOLD = 3;
const COL_ITALIC = 4;

/* exported PriorityMarkupWidget */
var PriorityMarkupWidget = GObject.registerClass({
    GTypeName: 'PriorityMarkupWidget'
}, class PriorityMarkupWidget extends Extension.imports.preferences.preferenceWidget.PreferenceWidget {

    _removePriorityStyle(priority) {
        if (priority === null) {
            log('Priority can not be null');
            return;
        }
        delete this.prioritiesMarkup[priority];
        this._settings.set('priorities-markup', this.prioritiesMarkup);
    }

    _updatePriorityStyling(priority, change_color, color, bold, italic, replace_prio) {
        if (priority === null) {
            log('Priority can not be null');
            return;
        }
        var currentValue = this.prioritiesMarkup[priority];
        if (typeof currentValue == 'undefined') {
            // create new tuple with default values
            this.prioritiesMarkup[priority] = new Markup();
            currentValue = this.prioritiesMarkup[priority];
        }
        if (change_color !== null) {
            if (change_color === true) {
                if (color !== null) {
                    currentValue.colorFromString = color;
                }
            }
            currentValue.changeColor = change_color;
        }
        if (bold !== null) {
            currentValue.bold = bold;
        }
        if (italic !== null) {
            currentValue.italic = italic;
        }
        if (replace_prio != priority) {
            if ((replace_prio !== null) && (replace_prio !== undefined)) {
                delete this.prioritiesMarkup[replace_prio];
            }
        }
        this._settings.set('priorities-markup', this.prioritiesMarkup);
    }


    _checkPriorityCondition(model, check_function, message) {
        let [validIterator, iter] = model.get_iter_first(); // eslint-disable-line prefer-const
        let result = true;
        let priority = '@';
        while (validIterator && result) {
            priority = model.get_value(iter, COL_PRIORITY);
            result = check_function(priority);
            validIterator = model.iter_next(iter);
        }
        if (!result) {
            const dialog = new Gtk.MessageDialog({
                buttons: Gtk.ButtonsType.OK,
                text: `${message}: ${priority}`,
                message_type: Gtk.MessageType.ERROR
            });
            dialog.run();
            dialog.destroy();
            return false;
        }
        return true;
    }

    _checkForInvalidPriorities(model) {
        return this._checkPriorityCondition(model, (priority) => {
            return (/^[A-Z]$/).test(priority);
        },
        _("Wrong priority"));
    }

    _checkForDuplicatePriorities(model) {
        const seenPriorities = [];
        let [validIterator, iter] = model.get_iter_first(); // eslint-disable-line prefer-const
        while (validIterator) {
            const priority = model.get_value(iter, COL_PRIORITY);
            if (!seenPriorities.includes(priority)) {
                seenPriorities.push(priority);
            } else {
                const dialog = new Gtk.MessageDialog({
                    buttons: Gtk.ButtonsType.OK,
                    text: _("Duplicate priority: %(priority)").replace('%(priority)', priority),
                    message_type: Gtk.MessageType.ERROR
                });
                dialog.run();
                dialog.destroy();
                return false;
            }
            validIterator = model.iter_next(iter);
        }
        return true;
    }

    _validateModel(model) {
        if (!this._checkForDuplicatePriorities(model)) {
            return false;
        }
        if (!this._checkForInvalidPriorities(model)) {
            return false;
        }
        return true;
    }

    _updatePriorityStylingFromModelRow(model, row, replace_prio) {
        if (!this._validateModel(model)) {
            model.remove(row);
            return;
        }
        this._updatePriorityStyling(
            model.get_value(row, COL_PRIORITY), model.get_value(row, COL_CHANGE_COLOR), model.get_value(
                row,
                COL_COLOR), model.get_value(row, COL_BOLD), model.get_value(row, COL_ITALIC),
            replace_prio);
    }

    _buildToggleColumn(title, attribute_column, model) {
        const column = new Gtk.TreeViewColumn({
            title,
            'expand': true
        });

        const renderer = new Gtk.CellRendererToggle({
            activatable: true
        });
        renderer.connect('toggled', (rend, iter) => {
            const newActiveState = !rend.active;
            const [returnCode, row] = model.get_iter_from_string(iter);
            if (!returnCode) {
                throw new Error('Something is broken!');
            }
            model.set(row, [attribute_column], [newActiveState]);
            this._updatePriorityStylingFromModelRow(model, row);
        });
        column.pack_start(renderer, true);
        column.add_attribute(renderer, 'active', attribute_column);
        return column;
    }

    _buildPriorityStyleWidget(model, row, priority, change_color, color, bold, italic) {
        const newRow = model.insert(row);
        model.set(newRow, [COL_PRIORITY, COL_CHANGE_COLOR, COL_COLOR, COL_BOLD, COL_ITALIC], [priority,
            change_color, color, bold, italic]);
    }

    _buildPrioritiesFromSettings(parentContainer, startRow) {
        this.prioritiesMarkup = this._settings.get('priorities-markup');
        let i = 1;
        for (const markup in this.prioritiesMarkup) {
            if (Object.prototype.hasOwnProperty.call(this.prioritiesMarkup,markup)) {
                this._buildPriorityStyleWidget(parentContainer,
                    startRow + i,
                    markup,
                    this.prioritiesMarkup[markup].changeColor,
                    this.prioritiesMarkup[markup].color.to_string(),
                    this.prioritiesMarkup[markup].bold,
                    this.prioritiesMarkup[markup].italic);
                i = i + 1; // eslint-disable-line no-magic-numbers
            }
        }
        return i;
    }

    _init(setting, settings) {
        super._init(setting, settings, true);
        this.spacing = 6;
        this.orientation = Gtk.Orientation.VERTICAL;
        this.box.orientation = Gtk.Orientation.VERTICAL;

        const scroller = new Gtk.ScrolledWindow();
        const model = new Gtk.ListStore();
        model.set_column_types([
            GObject.TYPE_STRING, GObject.TYPE_BOOLEAN, GObject.TYPE_STRING, GObject.TYPE_BOOLEAN, GObject.TYPE_BOOLEAN
        ]);
        const START_ROW = 1;
        this._buildPrioritiesFromSettings(model, START_ROW);
        const treeview = new Gtk.TreeView({
            'expand': true,
            model
        });

        const prioCol = new Gtk.TreeViewColumn({
            'title': _("Priority"),
            'expand': true,
            'sort-indicator': true,
            'sort-column-id': COL_PRIORITY,
        });

        const prioRend = new Gtk.CellRendererText({
            editable: true
        });

        prioRend.connect('edited', (rend, iter, newPrio) => {
            const [returnCode, row] = model.get_iter_from_string(iter);
            if (!returnCode) {
                throw new Error('Something is broken!');
            }
            const oldPrio = model.get_value(row, [COL_PRIORITY]);
            model.set(row, [COL_PRIORITY], [newPrio]);
            this._updatePriorityStylingFromModelRow(model, row, oldPrio);
        });
        prioCol.pack_start(prioRend, true);
        prioCol.add_attribute(prioRend, 'text', COL_PRIORITY);

        treeview.append_column(prioCol);

        treeview.append_column(this._buildToggleColumn(_("Change color"), COL_CHANGE_COLOR, model));

        const colorCol = new Gtk.TreeViewColumn({
            'title': _("Color"),
            'expand': true,
        });

        const colorRend = new ButtonCellRenderer.ButtonCellRenderer({
            activatable: true
        });
        colorRend.connect('clicked', (rend, iter) => {
            const [returnCode, row] = model.get_iter_from_string(iter);
            if (!returnCode) {
                throw new Error('Something is broken!');
            }
            const oldColor = new Gdk.RGBA();
            oldColor.parse(model.get_value(row, [COL_COLOR]));
            const colorChooser = new Gtk.ColorChooserDialog({
                modal: true,
                rgba: oldColor
            });
            if (colorChooser.run() == Gtk.ResponseType.OK) {
                const newColor = colorChooser.get_rgba();
                model.set(row, [COL_COLOR], [newColor.to_string()]);
                this._updatePriorityStylingFromModelRow(model, row);
            }
            colorChooser.destroy();
        });
        colorCol.pack_start(colorRend, true);
        colorCol.add_attribute(colorRend, 'cell-background', COL_COLOR);
        colorCol.add_attribute(colorRend, 'sensitive', COL_CHANGE_COLOR);
        treeview.append_column(colorCol);

        treeview.append_column(this._buildToggleColumn(_("Bold"), COL_BOLD, model));
        treeview.append_column(this._buildToggleColumn(_("Italic"), COL_ITALIC, model));

        model.set_sort_column_id(COL_PRIORITY, Gtk.SortType.ASCENDING);
        scroller.add(treeview);
        this.box.add(scroller);

        const toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

        const addButton = new Gtk.ToolButton({
            icon_name: Gtk.STOCK_ADD,
            label: _("Add style"),
            is_important: true
        });
        toolbar.add(addButton);
        addButton.connect('clicked', () => {
            const dialog = new Gtk.MessageDialog({
                buttons: Gtk.ButtonsType.OK_CANCEL,
                text: _("Please enter the priority"),
                message_type: Gtk.MessageType.QUESTION,
                title: _("New priority style"),
            });
            const dialogbox = dialog.get_content_area();
            const userentry = new Gtk.Entry();
            const PADDING = 0;
            dialogbox.pack_end(userentry, false, false, PADDING);
            dialog.show_all();
            const response = dialog.run();
            const priority = userentry.get_text();
            if ((response == Gtk.ResponseType.OK) && (priority !== '')) {
                const NEW_ROW_POSITIION = 10;
                const newRow = model.insert(NEW_ROW_POSITIION);
                model.set(newRow, [COL_PRIORITY, COL_CHANGE_COLOR, COL_COLOR, COL_BOLD,
                    COL_ITALIC], [
                    priority, false, 'rgb(255,255,255)', false, false]);
                if (!this._validateModel(model)) {
                    model.remove(newRow);
                }
            }
            dialog.destroy();
        });
        const deleteButton = new Gtk.ToolButton({
            stock_id: Gtk.STOCK_DELETE,
            label: _("Delete")
        });
        toolbar.add(deleteButton);
        deleteButton.connect('clicked', () => {
            const [success, model, iter] = treeview.get_selection().get_selected();
            this._removePriorityStyle(model.get_value(iter, COL_PRIORITY));
            if (success) {
                model.remove(iter);
            }
        });
        this.box.add(toolbar);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
