const {Clutter, GObject, St} = imports.gi;
const Params = imports.misc.params;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Formatter = Extension.imports.formatter.Formatter;
const Shared = Extension.imports.sharedConstants;
const Utils = Extension.imports.utils;

const Parser = Extension.imports.third_party.js_expression_eval.parser.Parser;

/* exported TodoTopBar */
var TodoTopBar = GObject.registerClass({
    GTypeName: 'TodoTopBar'
}, class extends St.BoxLayout {
    _init(params) {
        this.buttonText = null;
        this.icon = null;
        this.formatter = null;
        super._init({
            style_class: 'panel-status-menu-box'
        });

        const parameters = Params.parse(params, {
            initialText: '...',
            logger: null,
            decorator: null,
            taskInfoProvider: null,
            settings: null
        });

        const valueOrDefault = Utils.getDefaultIfInvalid;
        this.logger = valueOrDefault(parameters.logger, Utils.getDefaultLogger());


        if (parameters.taskInfoProvider === null) {
            this.logger.error('No taskInfoProvider specified!');
            return;
        }

        this.taskInfoProvider = parameters.taskInfoProvider;

        if (parameters.settings === null) {
            this.logger.error('No settings specified!');
            return;
        }


        this.settings = parameters.settings;
        this.formatString = valueOrDefault(this.settings.get('display-format-string'), '{unarchived}');
        this.hidePattern = valueOrDefault(this.settings.get('hide-pattern'), '');
        this.hideIfPatternZero = valueOrDefault(this.settings.get('hide-if-pattern-zero'),
            Shared.HIDE_ON_PATTERN_ZERO_NOTHING);
        this.showIcon = valueOrDefault(this.settings.get('show-status-icon'), false);

        this.decorator = parameters.decorator;

        this.settings.registerForChange('display-format-string', () => this._onSettingsChanged());
        this.settings.registerForChange('hide-pattern', () => this._onSettingsChanged());
        this.settings.registerForChange('hide-if-pattern-zero', () => this._onSettingsChanged());
        this.settings.registerForChange('show-status-icon', () => this._onSettingsChanged());

        this._setupFormatter();
        this._createText(parameters.initialText);

        if (this.showIcon) {
            this._createIcon();
        }
        this._delegate = this;
    }

    _setupFormatter() {
        this.formatter = new Formatter(this.formatString, this.logger);
        if (Utils.isValid(this.decorator)) {
            this.decorator.addLoggingToNamespace(this.formatter);
        }
        this.formatter.leftDelimiter = '{';
        this.formatter.rightDelimiter = '}';
        this.formatter.externalParserLeftDelimiter = '|';
        this.formatter.externalParserRightDelimiter = '|';
        this.formatter.externalParser = (string) => {
            return Parser.evaluate(string);
        };
        this.formatter.tokenLength = 0;
        this.formatter.setReplacement('unarchived', () => {
            return this.taskInfoProvider.getNbOfUnarchivedTasks();
        });
        this.formatter.setReplacement('undone', () => {
            return this.taskInfoProvider.getNbOfUndoneTasks();
        });
        this.formatter.setReplacement('hidden', () => {
            return this.taskInfoProvider.getNbOfHiddenTasks();
        });
    }

    _createText(initialText) {
        this.buttonText = new St.Label({
            text: _(initialText),
            y_align: Clutter.ActorAlign.CENTER
        });
        try {
            this.buttonText.set_y_expand(true);
        } catch (exception) {
            this.logger.debug(`Could not set y_expand: ${exception.message}`);
        }
        this.buttonText.set_style('text-align:center;');
        this.add_child(this.buttonText);
    }

    _createIcon() {
        this.icon = new St.Icon({
            style_class: 'system-status-icon',
            icon_name: 'object-select-symbolic'
        });
        this.insert_child_below(this.icon, this.buttonText);
    }

    _setBusy() {
        this._updateButtonText({
            'unarchived': '...',
            'undone': '...',
            'hidden': '...'
        });

        const iconNames = [
            'content-loading-symbolic',
            'content-loading',
            'emblem-synchronizing-symbolic',
            'emblem-synchronizing',
            'action-unavailable-symbolic',
            'action-unavailable'
        ];

        this._changeIcon(iconNames);
    }

    _setError() {
        this._updateButtonText({
            'unarchived': ' X ',
            'undone': ' X ',
            'hidden': ' X '
        });
        this._changeIcon('dialog-error-symbolic');
    }

    _changeIcon(iconName) {
        if (!this.showIcon) {
            return;
        }
        this._showIcon();
        this.icon.gicon = Utils.getIconFromNames(iconName);
    }

    _hideIfMatching() {
        this.get_parent().remove_style_class_name('panelButtonHidden');
        this.get_parent().add_style_class_name('panel-button');
        if (this.hideIfPatternZero == Shared.HIDE_ON_PATTERN_ZERO_NOTHING) {
            return;
        }
        try {
            const parsed = Parser.evaluate(this.formatter.getString({
                formatString: this.hidePattern
            }));
            const PATTERN_ZERO = 0;
            if (parsed !== PATTERN_ZERO) {
                return;
            }
        } catch (exception) {
            this.logger.error(`Error while parsing zero pattern: ${exception}`);
            return;
        }
        if (this.hideIfPatternZero & Shared.HIDE_ON_PATTERN_ZERO_TEXT) {
            this.buttonText.set_text('');
        }
        if (this.hideIfPatternZero & Shared.HIDE_ON_PATTERN_ZERO_ICON) {
            this._hideIcon();
        }
        if (this.hideIfPatternZero == Shared.HIDE_ON_PATTERN_ZERO_BOTH) {
            this.get_parent().remove_style_class_name('panel-button');
            this.get_parent().add_style_class_name('panelButtonHidden');
        }
    }

    _updateButtonText(formatterOverrides) {
        const overrides = Utils.getDefaultIfInvalid(formatterOverrides, null);
        try {
            this.buttonText.set_text(this.formatter.getString({
                overrideReplacements: overrides
            }));
        } catch (exception) {
            this.logger.error(`Error while parsing button pattern: ${exception}`);
        }
    }

    _showIcon() {
        if (Utils.isValid(this.icon)) {
            this.icon.icon_name = 'object-select-symbolic';
            return;
        }
        this._createIcon();
    }

    _hideIcon() {
        if (!Utils.isValid(this.icon)) {
            return;
        }
        this.remove_child(this.icon);
        this.icon = null;
    }

    update(params) {
        const parameters = Params.parse(params, {
            busy: false,
            error: false
        });
        if (parameters.busy === true && parameters.error === true) {
            this.logger.error(
                'Top bar cannot be busy and in error at the same time. Using error as default');
            parameters.busy = false;
        }
        if (parameters.busy === true) {
            this._setBusy();
            return;
        }
        if (parameters.error === true) {
            this._setError();
            return;
        }
        this._updateButtonText();
        if (this.showIcon) {
            this._showIcon();
        } else {
            this._hideIcon();
        }
        this._hideIfMatching();
    }

    _onSettingsChanged() {
        this.formatString = this.settings.get('display-format-string');
        this.hidePattern = this.settings.get('hide-pattern');
        this.hideIfPatternZero = this.settings.get('hide-if-pattern-zero');
        this.showIcon = this.settings.get('show-status-icon');
        this.formatter.formatString = this.formatString;
        this.update();
    }
});
/* vi: set expandtab tabstop=4 shiftwidth=4: */
