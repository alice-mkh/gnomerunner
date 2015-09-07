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
      nativeIcons = prefs.getIntPref("native-icons");
      fallbackTheme = prefs.getCharPref("fallback-icon-theme");
      loadTheme();
      return;
    }
    if (aTopic == "nsPref:changed" && (aData == "native-icons" || aData == "fallback-icon-theme")) {
      unloadTheme();
      nativeIcons = prefs.getIntPref("native-icons");
      fallbackTheme = prefs.getCharPref("fallback-icon-theme");
      loadTheme();

      let windows = Services.ww.getWindowEnumerator();
      while (windows.hasMoreElements()) {
        let win = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
        refreshDocument(win.document);
      }
      return;
    }
  }
};

function loadTheme() {
  var native = "chrome://icons/skin/layer-" + NATIVE_MODES[nativeIcons] + ".css";
  var fallback = "chrome://icons/skin/icon-theme-" + fallbackTheme + ".css";

  var nativeUri = Services.io.newURI(native, null, null);
  var fallbackUri = Services.io.newURI(fallback, null, null);

  if (!cssService.sheetRegistered(fallbackUri, cssService.USER_SHEET)){
    cssService.loadAndRegisterSheet(fallbackUri, cssService.USER_SHEET);
  }
  if (!cssService.sheetRegistered(nativeUri, cssService.USER_SHEET)){
    cssService.loadAndRegisterSheet(nativeUri, cssService.USER_SHEET);
  }
}

function unloadTheme() {
  var native = "chrome://icons/skin/layer-" + NATIVE_MODES[nativeIcons] + ".css";
  var fallback = "chrome://icons/skin/icon-theme-" + fallbackTheme + ".css";

  var nativeUri = Services.io.newURI(native, null, null);
  var fallbackUri = Services.io.newURI(fallback, null, null);

  if (cssService.sheetRegistered(fallbackUri, cssService.USER_SHEET)){
    cssService.unregisterSheet(fallbackUri, cssService.USER_SHEET);
  }
  if (cssService.sheetRegistered(nativeUri, cssService.USER_SHEET)){
    cssService.unregisterSheet(nativeUri, cssService.USER_SHEET);
  }
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
