const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings.Settings;
const Utils = Extension.imports.utils;


const schema = 'org.gnome.shell.extensions.TodoTxt';

const PAGE = 0;
const SECTION = 1;

var Prefs = class {

    constructor(schema) {
        const params = {
            settingsFile: `${Extension.path}/settings.json`,
            schema
        };
        this.hiddenTabs = [];
        this.hiddenSections = [];
        this.shownSections = [];
        this.shownTabs = [];
        this.settings = new Settings(params);
        this.creator = new Extension.imports.prefsCreator.PrefsCreator(this.settings);
    }


    _removeFromArray(array, toRemove) {
        for (const remove in toRemove) {
            if (Object.prototype.hasOwnProperty.call(toRemove,remove)) {
                const index = array.indexOf(toRemove[remove]);
                const NOT_FOUND = -1;
                const NUMBER_OF_ITEMS_TO_REMOVE = 1;
                if (index > NOT_FOUND) {
                    array.splice(index, NUMBER_OF_ITEMS_TO_REMOVE);
                }
            }
        }
    }

    _showHiddenSectionsIfApplicable() {
        let updated = false;
        const removeMe = [];
        for (const section in this.hiddenSections) {
            if (this.hiddenSections[section][SECTION].isVisible()) {
                this.hiddenSections[section][PAGE].add(this.hiddenSections[section][SECTION]);
                updated = true;
                removeMe.push(this.hiddenSections[section]);
                this.shownSections.push(this.hiddenSections[section]);
            }
        }
        this._removeFromArray(this.hiddenSections, removeMe);
        return updated;
    }

    _showHiddenCategoriesIfApplicable() {
        let updated = false;
        const removeMe = [];
        for (const category in this.hiddenTabs) {
            if (this.hiddenTabs[category].isVisible()) {
                this.notebook.append_page(this.hiddenTabs[category], this.hiddenTabs[category].getTitle());
                updated = true;
                removeMe.push(this.hiddenTabs[category]);
                this.shownTabs.push(this.hiddenTabs[category]);
            }
        }
        this._removeFromArray(this.hiddenTabs, removeMe);
        return updated;
    }

    _hideSectionsIfApplicable() {
        let updated = false;
        const removeMe = [];
        for (const section in this.shownSections) {
            if (Object.prototype.hasOwnProperty.call(this.shownSections,section)) {
                if (this.shownSections[section][SECTION].isVisible() === false) {
                    this.shownSections[section][PAGE].remove(this.shownSections[section][SECTION]);
                    updated = true;
                    removeMe.push(this.shownSections[section]);
                    this.hiddenSections.push(this.shownSections[section]);
                }
            }
        }
        this._removeFromArray(this.shownSections, removeMe);
        return updated;
    }

    _hideCategoriesIfApplicable() {
        let updated = false;
        const removeMe = [];
        for (const category in this.shownTabs) {
            if (Object.prototype.hasOwnProperty.call(this.shownTabs,category)) {
                if (this.shownTabs[category].isVisible() === false) {
                    const page = this.notebook.page_num(this.shownTabs[category]);
                    this.notebook.remove_page(page);
                    updated = true;
                    removeMe.push(this.shownTabs[category]);
                    this.hiddenTabs.push(this.shownTabs[category]);
                }
            }
        }
        this._removeFromArray(this.shownTabs, removeMe);
        return updated;
    }


    _visibilityHasChanged() {
        let updated = this._showHiddenSectionsIfApplicable();
        updated = updated || this._hideSectionsIfApplicable();
        updated = updated || this._showHiddenCategoriesIfApplicable();
        updated = updated || this._hideCategoriesIfApplicable();
        if (updated) {
            this.frame.show_all();
        }
    }

    buildSubCategorySection(category, subcategory) {
        const section = this.creator.getSubCategoryWidget(category, subcategory);
        const allInSubContainer = this.settings.getAllInSubcontainer(category, subcategory);
        for (const setting in allInSubContainer) {
            if (Object.prototype.hasOwnProperty.call(allInSubContainer,setting)) {
                const SETTING_NAME = 0;
                const widget = this.creator.getWidget(allInSubContainer[setting][SETTING_NAME]);
                section.add(widget);
                if (widget !== null) {
                    widget.connect('visibility-changed', () => this._visibilityHasChanged());
                }
            }
        }
        return section;
    }

    buildCategoryTab(category) {
        const page = this.creator.getCategoryWidget(category);
        const allSubContainers = this.settings.getAllSubContainers(category);
        for (const subCategory in allSubContainers) {
            if (Object.prototype.hasOwnProperty.call(allSubContainers,subCategory)) {
                const section = this.buildSubCategorySection(category, allSubContainers[subCategory]);
                if (section.isVisible()) {
                    page.add(section);
                    this.shownSections.push([page, section]);
                } else {
                    this.hiddenSections.push([page, section]);
                }
            }
        }
        return page;
    }

    buildPrefsWidget() {
        this.notebook = new Gtk.Notebook();
        this.notebook.set_tab_pos(Gtk.PositionType.TOP);
        const allCategories = this.settings.getAllCategories();
        for (const category in allCategories) {
            if (Object.prototype.hasOwnProperty.call(allCategories,category)) {
                const tab = this.buildCategoryTab(allCategories[category]);
                if (tab.isVisible()) {
                    this.notebook.append_page(tab, tab.getTitle());
                } else {
                    this.hiddenTabs.push(tab);
                }
            }
        }
        this.frame = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            border_width: 10,
        });

        this.frame.add(this.notebook);

        this.frame.show_all();

        return this.frame;
    }
};

/* exported init */
function init() {
    Utils.initTranslations(Extension);
}

/* exported buildPrefsWidget */
function buildPrefsWidget() {
    const prefs = new Prefs(schema);
    return prefs.buildPrefsWidget();
}

/* vi: set expandtab tabstop=4 shiftwidth=4: */
