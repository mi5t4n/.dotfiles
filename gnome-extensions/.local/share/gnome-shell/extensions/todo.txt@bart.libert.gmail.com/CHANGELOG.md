# Changelog

## v33
*  Gnome 3.38 compatibility done by Adam Schmalhofer.

## v32
* Fix compatibility with newer GTK/GDK versions

## v31
* Fix compatibility with newer GTK versions
* Add Brazilian Portuguese translation (thanks Danton Medrado)
* Add Slovakian translation (thanks F H)

## v30
* Gnome 3.36 compatibility with input from Vladislav Svitlichniy. Backwards compatibility is again broken, sorry!

## v29 "Thank you Adam!"
*  Gnome 3.34 compatibility done by Adam Schmalhofer. Backwards compatibility with older versions is broken, sorry!

## v28 "Polyglot"
* Translation updates

## v27 "Too hasty"
* Bugfix so all necessary files are included in the distributed zip

## v26 "Velasco"
* Big refactoring for Gnome 3.32 compatibility. Backwards compatibility with older versions is broken, sorry!
* Add an option to disable the sorting by priority (thanks Adam Schmalhofer)
* Add an option to hide completed unarchived tasks (thanks Adam Schmalhofer)
* Add an option to show tasks above a given priority (thanks Adam Schmalhofer)
* Bugfix: couple of warnings solved
* Bugfix: Tasks were added twice on some versions of gnome-shell
* Bugfix: Task insertion location setting had no level
* Move code to git and gitlab
* Move unit tests to jasmine-gjs
* Code cleanup

## v25
* Bugfix: Done tasks were not shown in italics anymore

## v24 "The quick and dirty 3.26 release"
* Update metadata for gnome-shell 3.26
* Update logger and logDecorator to new versions (ES6 compliance)
* Update German translation
* Change "const" to "var" for exported objects
* Add French translation by Maestrochan

## v23
* Bugfix for Toto: Update metadata to indicate 3.24 compatibility

## v22 "Toto"
* Style fixes to work better with different shell themes
* Removed support for Gnome versions below 3.10
* Slight change in behaviour of priority buttons: they now loop around in all cases
* Keep open the tasks menu after a new task is added (can be disabled in settings)
* Possibility to choose the location of new tasks: on top or on bottom of the file
* Location of "new task entry" reflects insert location setting
* Bugfix: When a shorcut was changed in the settings, the old one was removed, but the new one was not used
* Gnome 3.24 compatibility

## v21 "Carla"
* Last version with support for Gnome versions below 3.10
* In-line editing of tasks added
* In-line removal of tasks added
* Allow "top bar" patterns to be mathematically parsed
* Add support for the "hidden tasks" extension
* Bugfix: Text editor now opens on current workspace
* Bugfix: "New entry" field stays focused when hovering over other tasks
* Bugfix: German translation was not included in the distribution
* Gnome 3.22 compatibility

## v20 "Olivia"
* Changes to file monitoring: removed files, files on drives that only become available after boot,... are detected now
* New task entry is now always focussed on opening the extension
* Removed "open and focus" shortcut, as it is now obsolete
* Added "levels" to preferences interface to make it less cluttered for first-time users
* Redesign buttons to make it clearer what will be clicked
* Add accessible names to some UI elements
* Make "new task entry" style follow gnome overview search box styling
* Show number of tasks in subgroups
* Gnome 3.20 compatibility

## v19 "Lola"
* Priority for archived tasks is now handled according to todo.txt standard (legacy behaviour still available)
* Update installation instructions to reflect internal changes
* Make task list scrollable
* Enable showing an icon in the top bar
* Better handling of missing or wrongly specified todo.txt and done.txt file paths
* Don't force the square brackets in the top bar interface
* Fix translations and add some new languages (big thanks to gmg and Nuno Martins)
* Gnome 3.18 compatibility
* Bugfix: Debug level was not correctly applied at boot
* Bugfix: Extension path was not always correctly detected
* Enable earlier debugging
* Internal changes (no functional impact):
    * Move some internal code to external libraries
    * Get third party libraries from their repos instead of copying them to the project
    * Large redesign on settings handling

## v18 "Eva"
* Improved design for the new task entry (thank you Larissa Reis)
* Bugfix: Not possible to set priority color on certain Gnome versions
* Bugfix: Aligning status indicator vertically does not work on older Gnome versions
* Show warning message if todo or done files are unwritable
* Initial changes for more fine-grained logging
* Translation updates
* Layout changes to the preferences dialog
* The top bar display is now configurable
* Top bar display can be hidden if a configurable pattern (e.g. number of undone tasks) is zero
* Add more fine-grained debug logging configuration
* Gnome 3.16 compatibility

## v17 "Sal"
* Enable use of 'Keypad Enter' to confirm entry of a new task
* Add 'open todo.txt file in text editor' button
* Fix vertical alignment of button in top bar on gnome 3.12
* Update jsTodoTxt version to 0.5.1 (fixes parsing of tasks with + and @)
* Fix horizontal alignment of buttons on gnome 3.10+
* Allow truncation of long tasks
* Fix a clutter warning

## v16
* Bugfix release:
	* Bugfix release for "Manny" was rushed and again not properly tested.
	* Was not working on gnome 3.12

## v15
* Bugfix release:
	* "Manny" release was unfinished and not properly tested.
	* Custom URL color broke everything

## v14 "Manny"
* URLs in tasks are detected and can be clicked on to open them in default browser
* URL color is customizable
* Tabs are on the left in the preferences dialog
* Confirmation dialog for task deletion now contains description of task

## v13
* Bugfix: Extension was broken on gnome-shell < 3.8 because of the keybinding changes (thanks Cristian Beskid for
  reporting)

## v12
* Bugfix: Some dates where interpreted wrong (fixed in upstream jsTodoTxt project)
* Bugfix: keyboard shortcuts not working on gnome 3.8+
* Bugfix: when a project or context name was also a reserved JavaScript keyword (e.g. "watch"), grouping was broken
* Help text added to preferences dialog
* Default task priority colours changed to resemble original todo.sh settings
* Some style and syntax fixes
* Updated documentation
* Updated metadata for gnome 3.12

## v11
* Gnome 3.10 compatibility (thanks to Nneko Branche)
* Confirm on delete added (thanks to Nneko Branche)
* Add buttons for increasing and decreasing priority
* Some fixes in style and syntax

## v10
* Bugfix: Setting colors for priorities did not work with newer gnome versions (thanks to Jayme)
* Remove apply button for file selection for consistency with other settings

## v9
* Catch and log exceptions generated by jsTodoTxt API (thanks to Andrea Cozzolino)
* If no valid todo.txt file is found, the menu contains the possibility to create the necessary files for you or open the settings dialog (thanks to Pravin Satpute)

## v8
* Editing tasks from the interface by clicking on a task or via an optional edit button
* Choose what to do when clicking on a task: edit/archive/nothing
* Keyboard shortcuts
* Styles (color, bold, italic) for different priorities
* Optionally add creation date to new tasks
* Refactoring

## v7
* Update metadata for gnome-shell 3.8
* Bugfix: Syntax error
* Better symlink handling
* Fix some issues related to invalid todo.txt file in configuration
* Cancel file monitoring and start new monitor on todo file change

## v4 - v6
* Whitespace fixes
* Small refactoring

## v3
* Add archive button
* Show archived tasks in italic style

## v2
Replaced minified jsTodoTxt library with normal one

## v1
Initial version, never released
