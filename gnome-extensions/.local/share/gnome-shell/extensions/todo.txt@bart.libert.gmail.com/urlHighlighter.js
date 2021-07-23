const GObject = imports.gi.GObject;
const Util = imports.misc.util;
const getDefaultIfInvalid = imports.misc.extensionUtils.getCurrentExtension().imports.utils.getDefaultIfInvalid;

/* exported TaskURLHighlighter */
var TaskURLHighlighter = GObject.registerClass(class extends imports.ui.messageList.URLHighlighter {
    _init(text, lineWrap, allowMarkup, urlMarkupFunction) {
        super._init(text, lineWrap, allowMarkup);
        this.markupFunction = getDefaultIfInvalid(urlMarkupFunction, null);
        this._highlightUrls();
    }

    _highlightUrls() {
        if (typeof this.markupFunction === 'undefined') {
            // not initialized yet
            return;
        }
        const urls = Util.findUrls(this._text);
        let markup = '';
        let pos = 0;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const str = this._text.substr(pos, url.pos - pos);
            markup += str + this.markupFunction(url.url, this._linkColor);
            pos = url.pos + url.url.length;
        }
        markup += this._text.substr(pos);
        this.clutter_text.set_markup(markup);
    }
});

/* vi: set expandtab tabstop=4 shiftwidth=4: */
