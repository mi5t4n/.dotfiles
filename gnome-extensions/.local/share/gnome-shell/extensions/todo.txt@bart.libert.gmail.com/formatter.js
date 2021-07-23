const Params = imports.misc.params;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Errors = Extension.imports.errors;
const Utils = Extension.imports.utils;

const DEFAULT_LEFT_DELIMITER = '%';
const DEFAULT_RIGHT_DELIMITER = '';
const DEFAULT_TOKEN_LENGTH = 1;
const DEFAULT_EXTERNAL_PARSER_LEFT_DELIMITER = '|';
const DEFAULT_EXTERNAL_PARSER_RIGHT_DELIMITER = '|';

const ORIG_REGEX_POSITION = 0;
const PAD_LENGTH_POSTION = 2;
const PAD_DIRECTION_POSITION = 3;
const PAD_CHARACTER_POSITION = 4;
const TOKEN_POSITION = 5;

const PADDING_EXTENSION = 1;

/* exported Formatter */
var Formatter = class {
    constructor(format = null, logger = null) {
        this._leftDelimiter = DEFAULT_LEFT_DELIMITER;
        this._rightDelimiter = DEFAULT_RIGHT_DELIMITER;
        this._externalParserLeftDelimiter = DEFAULT_EXTERNAL_PARSER_LEFT_DELIMITER;
        this._externalParserRightDelimiter = DEFAULT_EXTERNAL_PARSER_RIGHT_DELIMITER;
        this._replacements = {};
        this._tokenLength = DEFAULT_TOKEN_LENGTH;
        this._externalParser = null;
        this.formatString = format;
        if (typeof logger != 'undefined') {
            this.logger = logger;
        } else {
            this.logger = Utils.getDefaultLogger();
        }
    }

    set logger(logger) {
        this._logger = logger;
    }

    get logger() {
        return this._logger;
    }

    set leftDelimiter(left) {
        if (!Utils.isValid(left)) {
            this._leftDelimiter = DEFAULT_LEFT_DELIMITER;
            return;
        }
        this._leftDelimiter = left;
    }

    get leftDelimiter() {
        return this._leftDelimiter;
    }

    set rightDelimiter(right) {
        if (!Utils.isValid(right)) {
            this._rightDelimiter = DEFAULT_RIGHT_DELIMITER;
            return;
        }
        this._rightDelimiter = right;
    }

    get rightDelimiter() {
        return this._rightDelimiter;
    }

    set externalParserLeftDelimiter(left) {
        this._externalParserLeftDelimiter = Utils.getDefaultIfInvalid(left,
            DEFAULT_EXTERNAL_PARSER_LEFT_DELIMITER);
    }

    get externalParserLeftDelimiter() {
        return this._externalParserLeftDelimiter;
    }

    set externalParserRightDelimiter(left) {
        this._externalParserRightDelimiter = Utils.getDefaultIfInvalid(left,
            DEFAULT_EXTERNAL_PARSER_RIGHT_DELIMITER);
    }

    get externalParserRightDelimiter() {
        return this._externalParserRightDelimiter;
    }

    set formatString(string) {
        if (typeof string != 'undefined') {
            this._format = string;
            return;
        }
        this._format = null;
    }

    get formatString() {
        return this._format;
    }

    _verifyConfiguration() {
        // eslint-disable-next-line no-magic-numbers
        if (this._rightDelimiter.length === 0 && this._tokenLength === 0) {
            throw new Errors.ConfigurationError('No end delimiter and no token length specified!',
                this.logger.error);
        }
        // If one externalParser delimiter is set, they should both be set
        /* eslint-disable no-magic-numbers */
        if ((this._externalParserLeftDelimiter.length + this._externalParserRightDelimiter.length) > 0 &&
            (this._externalParserLeftDelimiter.length * this._externalParserRightDelimiter.length) === 0) {
        /* eslint-enable no-magic-numbers */
            throw new Errors.ConfigurationError(
                'Either both or none of the delimiters for the external parser should be defined!',
                this.logger.error);
        }
    }

    _isFixedLengthPattern() {
        return (this._tokenLength !== 0); // eslint-disable-line no-magic-numbers
    }

    _getIteratorPattern() {
        if (this._isFixedLengthPattern()) {
            return `{${this._tokenLength}}`;
        }
        return '*';

    }

    _getTokenPattern() {
        const tokenPattern = new RegExp(
            `${this._leftDelimiter +
            this._getPaddingPattern()
            }([A-Za-z]${
                this._getIteratorPattern()
            })${
                this._rightDelimiter}`,
            'g');
        return tokenPattern;
    }

    _getPaddingPattern() {
        if (this._isFixedLengthPattern()) {
            return '(([0-9]*)([lrLR])(.?))?';
        }
        return '(([0-9]*)([lrLR])(.?):)?';
    }

    _getPaddingLength(toBePadded, targetLength) {
        return targetLength - toBePadded.toString().length;
    }

    _padLeft(toBePadded, paddingLength, padCharacter) {
        return Array(paddingLength + PADDING_EXTENSION).join(padCharacter) + toBePadded;
    }

    _padRight(toBePadded, paddingLength, padCharacter) {
        return toBePadded + Array(paddingLength + PADDING_EXTENSION).join(padCharacter);
    }

    _padToken(toBePadded, matchedString) {
        if (typeof matchedString[PAD_LENGTH_POSTION] == 'undefined') {
            return toBePadded;
        }
        if (typeof matchedString[PAD_DIRECTION_POSITION] == 'undefined') {
            return toBePadded;
        }
        const targetLength = parseInt(matchedString[PAD_LENGTH_POSTION]);
        if (typeof toBePadded == 'function') {
            toBePadded = toBePadded();
        }
        if (targetLength <= toBePadded.toString().length) {
            return toBePadded;
        }
        let padCharacter = ' ';
        if ((typeof matchedString[PAD_CHARACTER_POSITION] != 'undefined') &&
            (matchedString[PAD_CHARACTER_POSITION] !== '')) {
            padCharacter = matchedString[PAD_CHARACTER_POSITION];
        }
        const paddingLength = this._getPaddingLength(toBePadded, targetLength);
        if (matchedString[PAD_DIRECTION_POSITION] == 'l') {
            return this._padLeft(toBePadded, paddingLength, padCharacter);
        }
        if (matchedString[PAD_DIRECTION_POSITION] == 'r') {
            return this._padRight(toBePadded, paddingLength, padCharacter);
        }
        let rightPadded = null;
        let rightPadLength = 0;
        let leftPadLength = 0;
        if (matchedString[PAD_DIRECTION_POSITION] == 'R') {
            rightPadLength = Math.ceil(paddingLength / 2); // eslint-disable-line no-magic-numbers
            rightPadded = this._padRight(toBePadded, rightPadLength, padCharacter);
            leftPadLength = paddingLength - rightPadLength;
        }
        if (matchedString[PAD_DIRECTION_POSITION] == 'L') {
            leftPadLength = Math.ceil(paddingLength / 2);// eslint-disable-line no-magic-numbers
            rightPadLength = paddingLength - leftPadLength;
            rightPadded = this._padRight(toBePadded, rightPadLength, padCharacter);
        }
        if (rightPadded === null) {
            return toBePadded;
        }
        return this._padLeft(rightPadded, leftPadLength, padCharacter);
    }

    _parseMatch(match, resultString, overrideReplacements) {
        const token = match[TOKEN_POSITION];
        let replacements = this._replacements;
        if (overrideReplacements !== null) {
            replacements = overrideReplacements;
        }
        if (typeof replacements[token] == 'undefined') {
            throw new Errors.UndefinedTokenError(`No replacement defined for token ${token}`, this.logger.error);
        }
        const replaceRegex = new RegExp(match[ORIG_REGEX_POSITION], 'g');
        const paddedToken = this._padToken(replacements[token], match);
        return resultString.replace(replaceRegex, paddedToken);
    }

    getString(params) {
        const parameters = Params.parse(params, {
            formatString: this._format,
            overrideReplacements: null
        });
        const format = parameters.formatString;
        this._verifyConfiguration();
        const tokenPattern = this._getTokenPattern();
        let match = tokenPattern.exec(format);

        let resultString = format;
        while ((match !== null) && (typeof match != 'undefined')) {
            resultString = this._parseMatch(match, resultString, parameters.overrideReplacements);
            match = tokenPattern.exec(format);
        }
        if (this._externalParser === null) {
            return resultString;
        }
        const externalPattern = new RegExp('(\\|.+?\\|)');
        match = externalPattern.exec(resultString);
        const EXTERNAL_PATTERN_POSITION = 1;
        while ((match !== null) && (typeof match != 'undefined')) {
            const stripped = match[EXTERNAL_PATTERN_POSITION].replace(this._externalParserLeftDelimiter, '').replace(
                this._externalParserRightDelimiter, '');
            resultString = resultString.replace(match[EXTERNAL_PATTERN_POSITION], this._externalParser(stripped));
            match = externalPattern.exec(resultString);
        }

        return resultString;
    }

    setReplacement(token, replacement) {
        if (typeof token == 'undefined') {
            return true;
        }
        if (/^[A-Za-z]*$/.test(token) === false) {
            return false;
        }
        if (!Utils.isValid(replacement)) {
            delete this._replacements[token];
            return true;
        }
        this._replacements[token] = replacement;
        return true;
    }

    getReplacement(token) {
        return Utils.getFirstValidChild(this._replacements, [token]);
    }

    set tokenLength(length) {
        this._tokenLength = length;
    }

    get tokenLength() {
        return this._tokenLength;
    }

    set externalParser(parser) {
        if (typeof parser == 'function' || parser === null) {
            this._externalParser = parser;
        }
    }

    get externalParser() {
        return this._externalParser;
    }
};
/* vi: set expandtab tabstop=4 shiftwidth=4: */
