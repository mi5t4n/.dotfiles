/*
    This file is part of Apt Update Indicator
    Apt Update Indicator is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    Apt Update Indicator is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with Apt Update Indicator.  If not, see <http://www.gnu.org/licenses/>.
    Copyright 2016 Raphael Rochet
    Copyright 2016-2020 Fran Glais
*/

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Indicator = Me.imports.indicator;
const Monitors = Me.imports.monitors;
const Prefs = Me.imports.prefs;
const Utils = Me.imports.utils;

const Gettext = imports.gettext.domain('apt-update-indicator');
const _ = Gettext.gettext;

/* Options */
const STOCK_CHECK_CMD  = '/usr/bin/pkcon refresh';
const STOCK_UPDATE_CMD = '/usr/bin/gnome-software --mode updates';
let CHECK_CMD          = STOCK_CHECK_CMD;
let UPDATE_CMD         = STOCK_UPDATE_CMD;

/* Various packages statuses */
const SCRIPT = Indicator.SCRIPT;

/* For error checking */
const STATUS = Indicator.STATUS;

var UpdateManager = class UpdateManager {
    constructor() {

        this._TimeoutId = null;
        this._initialTimeoutId = null;

        // Create indicator on the panel and initialize it
        this._indicator = new Indicator.AptUpdateIndicator(this);
        this._indicator.updateStatus(STATUS.INITIALIZING);

        // Prepare to track connections
        this._signalsHandler = new Utils.GlobalSignalsHandler();

        // The first run is initialization only: we only read the existing files
        this._initializing = true;

        // We don't update the date in some cases:
        //  - updates check comes from a folder change
        //  - after applying updates
        this._dontUpdateDate = false;

        // Load settings
        this._settings = Utils.getSettings();
        this._applySettings();

        // Start network and directory monitors
        this._netMonitor = new Monitors.NetworkMonitor(this);
        this._dirMonitor = new Monitors.DirectoryMonitor(this);

        // Initial run. We wait 30 seconds before listing the upgrades, this:
        //  - allows a smoother initialization
        //  - lets the async calls finish in case of a quick disable/enable loop
        let initialRunTimeout = 30;
        this._initialTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
                                                          initialRunTimeout,
                                                          () => {
                                                              this._launchScript(SCRIPT.UPGRADES);
                                                              this._initialTimeoutId = null;
                                                              return false;
                                                          });

        this._ignoreListTimeoutId = 0
    }

    _applySettings() {
        // Parse the various commands
        this._updateCMD();
        this._checkCMD();

        // Add a check at intervals
        this._initializeInterval();

        this._bindSettings();
    }

    _updateCMD() {
        let option = this._settings.get_enum('update-cmd-options');
        if (option == 1) {
            // Update manager, Ubuntu only
            UPDATE_CMD = '/usr/bin/update-manager';
        } else if (option == 2) {
            // Gnome Update Viewer: depends on pacakge-kit
            UPDATE_CMD = '/usr/bin/gpk-update-viewer';
        } else if (option == 3 && this._settings.get_string('update-cmd') !== '') {
            // Custom command
            if (this._settings.get_boolean('output-on-terminal')) {
                UPDATE_CMD = '/usr/bin/' + this._settings.get_string('terminal') +
                             ' "echo ' + this._settings.get_string('update-cmd') +
                             '; '      + this._settings.get_string('update-cmd') +
                             '; echo Press any key to continue' +
                             '; read -n1 key"';
            } else {
                UPDATE_CMD = '/usr/bin/' + this._settings.get_string('update-cmd');
            }
        } else {
            // Default, or in case the command is empty, Gnome-Software
            UPDATE_CMD = STOCK_UPDATE_CMD;
        }
    }

    _checkCMD() {
        if (this._settings.get_boolean('use-custom-cmd') &&
            this._settings.get_string('check-cmd-custom') !== '')
            CHECK_CMD = '/usr/bin/' + this._settings.get_string('check-cmd-custom');
        else
            CHECK_CMD = STOCK_CHECK_CMD;
    }

    _initializeInterval() {
        this._isAutomaticCheck = false;

        // Remove the periodic check before adding a new one
        if (this._TimeoutId)
            GLib.source_remove(this._TimeoutId);

        // Interval in hours from settings, convert to seconds
        let unit = this._settings.get_enum('interval-unit');
        let conversion = 0;

        switch (unit) {
        case 0: // Hours
            conversion = 60 * 60;
            break;
        case 1: // Days
            conversion = 60 * 60 * 24;
            break;
        case 2: // Weeks
            conversion = 60 * 60 * 24 * 7;
            break;
        }

        let CHECK_INTERVAL = conversion * this._settings.get_int('check-interval');

        if (CHECK_INTERVAL) {
            // This has to be relative to the last check!
            // Date is in milliseconds, convert to seconds
            let last_check = this._settings.get_double('last-check-date-automatic-double');
            let now = new Date();
            let elapsed = (now - last_check)/1000; // In seconds

            CHECK_INTERVAL -= elapsed;
            if (CHECK_INTERVAL < 0) {
                if (this._initializing)
                    // Wait 2 minutes if just initialized, i.e. after boot or
                    // unlock screen
                    CHECK_INTERVAL = 120;
                else
                    CHECK_INTERVAL = 10;
            }

            this._TimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
                                                       CHECK_INTERVAL, () => {
                                                           this._isAutomaticCheck = true;
                                                           this._checkNetwork();
                                                           this._checkInterval();
                                                           return true;
                                                       });
        }
    }

    _checkInterval() {
        // Remove the periodic check before adding a new one
        if (this._TimeoutId)
            GLib.source_remove(this._TimeoutId);

        let CHECK_INTERVAL = this._settings.get_int('check-interval') * 60 * 60;
        if (CHECK_INTERVAL) {
            this._TimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
                                                       CHECK_INTERVAL, () => {
                                                               this._isAutomaticCheck = true;
                                                               this._checkNetwork();
                                                               return true;
                                                       });
        }

    }

    _newPackagesBinding() {
        if (this._settings.get_boolean('new-packages')) {
            this._launchScript(SCRIPT.NEW);
        } else {
            this._indicator._newPackagesList = [];
            this._indicator._updateNewPackagesStatus();
        }
    }

    _obsoletePackagesBinding() {
        if (this._settings.get_boolean('obsolete-packages')) {
            this._launchScript(SCRIPT.OBSOLETE);
        } else {
            this._indicator._obsoletePackagesList = [];
            this._indicator._updateObsoletePackagesStatus();
        }
    }

    _residualPackagesBinding() {
        if (this._settings.get_boolean('residual-packages')) {
            this._launchScript(SCRIPT.RESIDUAL);
        } else {
            this._indicator._residualPackagesList = [];
            this._indicator._updateResidualPackagesStatus();
        }
    }

    _autoremovablePackagesBinding() {
        if (this._settings.get_boolean('autoremovable-packages')) {
            this._launchScript(SCRIPT.AUTOREMOVABLE);
        } else {
            this._indicator._autoremovablePackagesList = [];
            this._indicator._updateAutoremovablePackagesStatus();
        }
    }

    _bindSettings() {
        this._signalsHandler.add([
        // Apply updates
            this._settings,
            'changed::update-cmd-options',
            this._updateCMD.bind(this)
        ],[
            this._settings,
            'changed::terminal',
            this._updateCMD.bind(this)
        ],[
            this._settings,
            'changed::output-on-terminal',
            this._updateCMD.bind(this)
        ],[
            this._settings,
            'changed::update-cmd',
            this._updateCMD.bind(this)
        ],[
        // Checking for updates
            this._settings,
            'changed::check-cmd-custom',
            this._checkCMD.bind(this)
        ],[
            this._settings,
            'changed::use-custom-cmd',
            this._checkCMD.bind(this)
        ],[
        // Basic settings
            this._settings,
            'changed::check-interval',
            this._initializeInterval.bind(this)
        ],[
        // Basic settings
            this._settings,
            'changed::interval-unit',
            this._initializeInterval.bind(this)
        ],[
            this._settings,
            'changed::strip-versions',
            () => {
                this._launchScript(SCRIPT.UPGRADES);
            }
        ],[
            this._settings,
            'changed::show-critical-updates',
            () => {
                this._launchScript(SCRIPT.UPGRADES);
            }
        ],[
            this._settings,
            'changed::ignore-list',
            () => {
                // We add a timeout in case many entries are deleted
                if (this._ignoreListTimeoutId) {
                    GLib.source_remove(this._ignoreListTimeoutId)
                    this._ignoreListTimeoutId = 0;
                }

                this._ignoreListTimeoutId = GLib.timeout_add_seconds(
                    GLib.PRIORITY_DEFAULT,
                    5,
                    () => {
                        this._launchScript(SCRIPT.UPGRADES);
                        this._ignoreListTimeoutId = 0;
                        return false;
                    });
            }
        ],[
        // Synaptic features
            this._settings,
            'changed::new-packages',
            this._newPackagesBinding.bind(this)
        ],[
            this._settings,
            'changed::obsolete-packages',
            this._obsoletePackagesBinding.bind(this)
        ],[
            this._settings,
            'changed::residual-packages',
            this._residualPackagesBinding.bind(this)
        ],[
            this._settings,
            'changed::autoremovable-packages',
            this._autoremovablePackagesBinding.bind(this)
        ],[
            // Indicator buttons
            this._indicator.checkNowMenuItem,
            'activate',
            this._checkNetwork.bind(this)
        ],[
            this._indicator.applyUpdatesMenuItem,
            'activate',
            this._applyUpdates.bind(this)
        ]);
    }

    /* Upgrade functions:
     *     _applyUpdates
     *     _applyUpdatesEnd
     */

    _applyUpdates() {
        if(this._upgradeProcess_sourceId) {
            // A check is running ! Maybe we should kill it and run another one ?
            return;
        }
        try {
            // Parse check command line
            let [parseok, argvp] = GLib.shell_parse_argv( UPDATE_CMD );
            if (!parseok) { throw 'Parse error' };
            let proc = new Gio.Subprocess({argv: argvp, flags: Gio.SubprocessFlags.STDOUT_PIPE});
            proc.init(null);

            // Asynchronously call the output handler when script output is ready
            proc.communicate_utf8_async(null, null, this._applyUpdatesEnd.bind(this));

            this._upgradeProcess_sourceId = 1;
        } catch (err) {
        }
    }

    _applyUpdatesEnd() {
        // Free resources
        this._upgradeProcess_sourceId = null;

        // Check if updates are available
        this._dontUpdateDate = true;
        this._launchScript(SCRIPT.UPGRADES);
    }

    /* Update functions:
     *     _checkNetwork
     *     networkFailed
     *     checkUpdates
     *     _checkUpdatesEnd
     */

    _checkNetwork() {
        this._indicator.showChecking(true);
        this._netMonitor.networkTimeout();
    }

    networkFailed() {
        this._indicator.showChecking(false);
        this._indicator.updateStatus(STATUS.NO_INTERNET);
    }

    checkUpdates() {
        // Stop the dir monitor to prevent it from updating again right after
        // the update
        this._dirMonitor.stop();

        if(this._upgradeProcess_sourceId) {
            // A check is already running ! Maybe we should kill it and run another one ?
            return;
        }
        // Run asynchronously, to avoid  shell freeze - even for a 1s check
        try {
            // Parse check command line
            let [parseok, argvp] = GLib.shell_parse_argv( CHECK_CMD );
            if (!parseok) { throw 'Parse error' };
            let proc = new Gio.Subprocess({argv: argvp, flags: Gio.SubprocessFlags.STDOUT_PIPE});
            proc.init(null);

            // Asynchronously call the output handler when script output is ready
            proc.communicate_utf8_async(null, null, this._checkUpdatesEnd.bind(this));

            this._upgradeProcess_sourceId = 1;

        } catch (err) {
            this._indicator.showChecking(false);
            this._indicator.updateStatus(STATUS.ERROR);
        }
    }

    _checkUpdatesEnd() {
        // Free resources
        this._upgradeProcess_sourceId = null;

        // Update indicator
        this._launchScript(SCRIPT.UPGRADES);
    }

    /* Extra packages functions:
     *     _launchScript
     *     _packagesRead
     *     _packagesEnd
     *     _lastCheck
     */

    _launchScript(index) {
        let script_names = ['get-updates',
                            'new',
                            'obsolete',
                            'residual',
                            'autoremovable'];

        // Run asynchronously, to avoid shell freeze - even for a 1s check
        try {
            let path = Me.dir.get_path();
            let script = ['/bin/bash',
                          path + '/scripts/' + script_names[index] + '.sh',
                          this._initializing ? '1' : '0'];

            let proc = new Gio.Subprocess({argv: script, flags: Gio.SubprocessFlags.STDOUT_PIPE});
            proc.init(null);

            // Asynchronously call the output handler when script output is ready
            proc.communicate_utf8_async(null, null, this._packagesRead.bind(this, index));

        } catch (err) {
            if (index == SCRIPT.UPGRADES) {
                this._indicator.showChecking(false);
                this._indicator.updateStatus(STATUS.ERROR);
            }
        }
    }

    _packagesRead(index, proc, result) {
        // Reset the new packages list
        let [ok, output, ] = proc.communicate_utf8_finish(result);
        let packagesList = output.split('\n');
        packagesList.pop(); // Last item is empty

        // Since this runs async, the indicator might have been destroyed!
        if (this._indicator) {
            if (index == SCRIPT.UPGRADES) {
                packagesList = this._filterList(packagesList);
                this._indicator._updateList = packagesList;
            }
            else if (index == SCRIPT.NEW)
                this._indicator._newPackagesList = packagesList;
            else if (index == SCRIPT.OBSOLETE)
                this._indicator._obsoletePackagesList = packagesList;
            else if (index == SCRIPT.RESIDUAL)
                this._indicator._residualPackagesList = packagesList;
            else if (index == SCRIPT.AUTOREMOVABLE)
                this._indicator._autoremovablePackagesList = packagesList;
        }

        this._packagesEnd(index);
    }

    _packagesEnd(index) {
        // Since this runs async, the indicator might have been destroyed!
        if (this._indicator) {
            // Update indicator
            if (index == SCRIPT.UPGRADES && this._settings.get_boolean('show-critical-updates'))
                this._checkUrgency();
            else {
                this._indicator.updatePackagesStatus(index);
                this._indicator._urgentList = [];
            }

            if (index == SCRIPT.UPGRADES) {
                // Update indicator
                this._indicator.showChecking(false);

                // Update time on menu
                this._lastCheck();

                // Launch other checks
                if (this._settings.get_boolean('new-packages'))
                    this._launchScript(SCRIPT.NEW);
                if (this._settings.get_boolean('obsolete-packages'))
                    this._launchScript(SCRIPT.OBSOLETE);
                if (this._settings.get_boolean('residual-packages'))
                    this._launchScript(SCRIPT.RESIDUAL);
                if (this._settings.get_boolean('autoremovable-packages'))
                    this._launchScript(SCRIPT.AUTOREMOVABLE);
                this._initializing = false;

                this._dirMonitor.start();
            }
        }
    }

    _checkUrgency() {
        try {
            let path = Me.dir.get_path();
            let script = ['/bin/bash', path + '/scripts/urgency.sh'];

            let proc = new Gio.Subprocess({argv: script, flags: Gio.SubprocessFlags.STDOUT_PIPE});
            proc.init(null);
            // Asynchronously call the output handler when script output is ready
            proc.communicate_utf8_async(null, null, this._checkUrgencyRead.bind(this));
        } catch (err) {
            global.log('Apt Update Indicator LOG: failed to run urgency.sh');
        }
    }

    _checkUrgencyRead(proc, result) {
        // Reset the new packages list
        let [ok, output, ] = proc.communicate_utf8_finish(result);
        let urgencyList = output.split('\n');
        urgencyList.pop(); // Last item is empty

        let cleanUrgentList = this._indicator._updateList.filter(function(pkg) {
            for (let i = 0; i < urgencyList.length; i++) {
                // Only get the package name, in case the version is included
                var pkgName = pkg.split('\t',2)[0];
                if (urgencyList[i].indexOf(pkgName + '-') !== -1)
                    return true;
            }
            return false;
        });

        this._indicator._urgentList = cleanUrgentList;
        this._indicator.updatePackagesStatus(SCRIPT.UPGRADES);
    }

    _lastCheck() {
        if (this._dontUpdateDate) {
            this._dontUpdateDate = false;
            return;
        }
        let date;

        if (this._initializing) {
            let last_check = new Date(this._settings.get_double('last-check-date-double'));
            date = last_check.toLocaleFormat('%a %b %d, %H:%M').toString();
        } else {
            let now = new Date();
            date = now.toLocaleFormat('%a %b %d, %H:%M').toString();
            this._settings.set_double('last-check-date-double', now);
            if (this._isAutomaticCheck) {
                this._settings.set_double('last-check-date-automatic-double', now);
                this._isAutomaticCheck = false;
            }
        }

        if (date != '') {
            this._indicator.lastCheckMenuItem.label.set_text(_('Last check: ') + date);
            this._indicator.lastCheckMenuItem.actor.visible = true;
        }
    }

    _filterList(packagesList) {
        let ignoreList = this._settings.get_string('ignore-list');
        ignoreList = Prefs.splitEntries(ignoreList);

        return packagesList.filter(function(pkg) {
            // only get the package name, in case the version is included
            var pkgname = pkg.split('\t',2)[0];
            if (ignoreList.indexOf(pkgname) !== -1)
                return false;
            return true;
        });
    }

    destroy() {
        if (this._TimeoutId) {
            GLib.source_remove(this._TimeoutId);
            this._TimeoutId = null;
        }

        if (this._initialTimeoutId) {
            GLib.source_remove(this._initialTimeoutId);
            this._initialTimeoutId = null;
        }

        // Disconnect global signals
        this._signalsHandler.destroy();

        // Destroy monitors
        this._netMonitor.destroy();
        this._dirMonitor.destroy();

        this._indicator.destroy();
        this._indicator = null;
    }
}
