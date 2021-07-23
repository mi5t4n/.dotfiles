const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Section = Extension.imports.preferences.subCategorySection.SubCategorySection;
const Subcategory = Extension.imports.preferences.subCategoryTab.SubCategoryTab;
const Tab = Extension.imports.preferences.categoryTab.CategoryTab;
const TabWithSubtabs = Extension.imports.preferences.categoryTabWithSubtabs.CategoryTabWithSubtabs;

/* exported PrefsCreator */
var PrefsCreator = class {
    constructor(settings) {
        this._settings = settings;
    }

    getWidget(setting) {
        let widgetType = this._settings.getType(setting);
        if (widgetType === null || typeof widgetType == 'undefined') {
            return null;
        }
        if (this._settings.getWidget(setting) == 'none') {
            return null;
        }
        if (this._settings.getWidget(setting) != 'default') {
            widgetType = this._settings.getWidget(setting);
        }
        /* eslint-disable no-magic-numbers */

        return new Extension.imports.preferences[`${widgetType}Widget`][`${widgetType.charAt(0).toUpperCase() +
            widgetType.substring(1)}Widget`](setting, this._settings);
        /* eslint-enable no-magic-numbers */
    }

    getCategoryWidget(category) {
        if (this._settings.hasSubcategories(category)) {
            return new TabWithSubtabs(category);
        }
        return new Tab(category);
    }

    getSubCategoryWidget(category, subcategory) {
        if (this._settings.getType(subcategory, category) == 'subsection') {
            return new Section(subcategory);
        }
        return new Subcategory(subcategory);
    }
};

/* vi: set expandtab tabstop=4 shiftwidth=4: */
