Components.utils.import("resource://gre/modules/Services.jsm");
var prefs = Services.prefs.getBranch($OPTIONS_PREF_BRANCH);
var cssService = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

var prefList = ["visiblegrippies", "hidegrippies", "newtabplus", "urlbarhighlight", "buttontext"];

function getMaxValue(data){
    if (data == "hidegrippies"){
        return 2;
    }
    return 1;
}

function getValues(data){
    return [];
}

var obs = {
    observe: function(subject, topic, data){
        if (topic != "nsPref:changed"){
            return;
        }
        refreshPref(data);
    }
}

function refreshPref(data){
    switch(Services.prefs.getPrefType($OPTIONS_PREF_BRANCH+data)){
        case Services.prefs.PREF_BOOL: handleBool(data, Services.prefs.getBoolPref($OPTIONS_PREF_BRANCH+data)); break;
        case Services.prefs.PREF_INT: handleInt(data, Services.prefs.getIntPref($OPTIONS_PREF_BRANCH+data)); break;
        case Services.prefs.PREF_STRING: handleString(data, Services.prefs.getCharPref($OPTIONS_PREF_BRANCH+data)); break;
    }
}

function unloadPref(data){
    switch(Services.prefs.getPrefType($OPTIONS_PREF_BRANCH+data)){
        case Services.prefs.PREF_BOOL: handleBool(data, false); break;
        case Services.prefs.PREF_INT: handleInt(data, 0); break;
        case Services.prefs.PREF_STRING: handleString(data, "default"); break;
    }
}

function handleBool(data, value){
    debug(" Bool preference changed: "+data+", "+value);
    if (value == false){
        unloadCss(data);
        return;
    }
    loadCss(data);
}

function handleInt(data, value){
    debug(" Int preference changed: "+data+", "+value);
    for (j = 1; j <= getMaxValue(data); j++){
        unloadCss(data+"-"+j);
    }
    if (value == 0){
        return;
    }
    loadCss(data+"-"+value);
}

function handleString(data, value){
    debug(" String preference changed: "+data+", "+value);
    var values = getValues(data);
    for (j = 0; j < values.length; j++){
        unloadCss(data+"-"+values[j]);
    }
    if (value == "default"){
        return;
    }
    for (j = 0; j < values.length; j++){
        if (value == values[j]){
            loadCss(data+"-"+value);
            return;
        }
    }
    debug("  This should never happen! "+data+", "+value);
}

function loadCss(data){
    var uri = Services.io.newURI("chrome://gnomerunner-options/content/"+data+".css", null, null);
    if (!cssService.sheetRegistered(uri, cssService.USER_SHEET)){
        debug("  Registering sheet: "+"chrome://gnomerunner-options/content/"+data+".css");
        cssService.loadAndRegisterSheet(uri, cssService.USER_SHEET);
    }
}

function unloadCss(data){
    var uri = Services.io.newURI("chrome://gnomerunner-options/content/"+data+".css", null, null);
    if (cssService.sheetRegistered(uri, cssService.USER_SHEET)){
        debug("  Unregistering sheet: "+"chrome://gnomerunner-options/content/"+data+".css");
        cssService.unregisterSheet(uri, cssService.USER_SHEET);
    }
}

function startup(data, reason){
    debug("Startup");
    prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
    prefs.addObserver("", obs, false);
    for (i = 0; i < prefList.length; i++){
        refreshPref(prefList[i]);
    }
}

function shutdown(data, reason){
    debug("Shutdown");
    prefs.removeObserver("", obs);
    for (i = 0; i < prefList.length; i++){
        unloadPref(prefList[i]);
    }
}

function install(data, reason){
}

function uninstall(data, reason){
}

function debug(str){
    if ($ENABLE_DEBUG){
       dump(str+"\n");
    }
}