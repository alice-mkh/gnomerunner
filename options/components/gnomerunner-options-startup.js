/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const cssService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
const prefs = Services.prefs.getBranch("extensions.gnomerunner-options.");

const NATIVE_MODES = ["none", "gtk", "freedesktop"];
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

var nativeIcons;
var fallbackTheme;
var visibleGrippies;
var showMenubarGrippies;
var showToolbarGrippies;
var throbberStyle;

function GnomerunnerOptions() {
  this.start();
}

GnomerunnerOptions.prototype = {
  classDescription: "Gnomerunner Options",
  contractID: "@gnomerunner-options/startup;2",
  classID: Components.ID("{f7a5d193-3649-440f-9872-cbc9b9ec5c8c}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIObserver]),

  start: function () {
    Services.obs.addObserver(this, "final-ui-startup", false);
    prefs.addObserver("", this, false);
  },

  stop : function () {
    Services.obs.removeObserver(this, "final-ui-startup");
    prefs.removeObserver("", this);
  },

  observe: function(aSubject, aTopic, aData) {
    if (aTopic == "final-ui-startup") {
      loadTheme();
      loadTweaks();
      return;
    }
    if (aTopic == "nsPref:changed") {
      if (aData == "native-icons" || aData == "fallback-icon-theme") {
        unloadTheme();
        loadTheme();
      } else {
        unloadTweaks();
        loadTweaks();
      }

      let windows = Services.ww.getWindowEnumerator();
      while (windows.hasMoreElements()) {
        let win = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
        refreshDocument(win.document);
      }
      return;
    }
  }
};

function loadCss(aCss) {
  var uri = Services.io.newURI(aCss, null, null);

  if (!cssService.sheetRegistered(uri, cssService.USER_SHEET)){
    cssService.loadAndRegisterSheet(uri, cssService.USER_SHEET);
  }
}

function unloadCss(aCss) {
  var uri = Services.io.newURI(aCss, null, null);

  if (cssService.sheetRegistered(uri, cssService.USER_SHEET)){
    cssService.unregisterSheet(uri, cssService.USER_SHEET);
  }
}

function loadTheme() {
  nativeIcons = prefs.getIntPref("native-icons");
  fallbackTheme = prefs.getCharPref("fallback-icon-theme");

  loadCss("chrome://icons/skin/icon-theme-" + fallbackTheme + ".css");
  loadCss("chrome://icons/skin/layer-" + NATIVE_MODES[nativeIcons] + ".css");
}

function unloadTheme() {
  unloadCss("chrome://icons/skin/icon-theme-" + fallbackTheme + ".css");
  unloadCss("chrome://icons/skin/layer-" + NATIVE_MODES[nativeIcons] + ".css");
}

function loadTweaks() {
  visibleGrippies = prefs.getBoolPref("visible-grippies");
  showMenubarGrippies = prefs.getBoolPref("show-menubar-grippies");
  showToolbarGrippies = prefs.getBoolPref("show-toolbar-grippies");
  throbberStyle = prefs.getCharPref("throbber-style");

  if (visibleGrippies) {
    loadCss("chrome://gnomerunner-options/content/tweaks/visible-grippies.css");
  }

  if (!showMenubarGrippies) {
    loadCss("chrome://gnomerunner-options/content/tweaks/hide-menubar-grippies.css");
  }

  if (!showToolbarGrippies) {
    loadCss("chrome://gnomerunner-options/content/tweaks/hide-toolbar-grippies.css");
  }

  loadCss("chrome://gnomerunner-options/content/tweaks/throbber/throbber-" + throbberStyle + ".css");
}

function unloadTweaks() {
  unloadCss("chrome://gnomerunner-options/content/tweaks/visible-grippies.css");
  unloadCss("chrome://gnomerunner-options/content/tweaks/hide-menubar-grippies.css");
  unloadCss("chrome://gnomerunner-options/content/tweaks/hide-toolbar-grippies.css");
  unloadCss("chrome://gnomerunner-options/content/tweaks/throbber/throbber-" + throbberStyle + ".css");
}

function refreshDocument(aDoc) {
  let trees = aDoc.getElementsByTagNameNS(XUL_NS, "tree");
  for (let i = 0; i < trees.length; i++)
    trees[i].treeBoxObject.invalidate();

  let iframes = aDoc.getElementsByTagNameNS(XUL_NS, "iframe");
  let browsers = aDoc.getElementsByTagNameNS(XUL_NS, "browser");

  for (let i = 0; i < iframes.length; i++)
    refreshDocument(iframes[i].contentDocument);
  for (let i = 0; i < browsers.length; i++)
    refreshDocument(browsers[i].contentDocument);

}

var NSGetFactory = XPCOMUtils.generateNSGetFactory([GnomerunnerOptions]);
