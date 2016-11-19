'use_strict';

var SpreadsheetApp = require('SpreadsheetApp'),
    ScriptApp = require('ScriptApp'),
    Browser = require('Browser');


function init(global) {
  global.func0001 = require('./deviceMonitor').setUpSpreadsheet;
  global.func0002 = log_start_;
  global.func0003 = log_pause_;
  global.func0004 = require('./deviceMonitor').manualUpdate;
  global.func0005 = log_off_;
  global.func0011 = require('./deviceMonitor').updateStatus;
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries;

  menuEntries = [
    {name: 'Setup Sensor info', functionName: 'func0001'},
    {name: 'Log Start',         functionName: 'func0002'},
    {name: 'Log Pause',         functionName: 'func0003'},
    {name: 'Manual update',     functionName: 'func0004'},
    {name: 'Log Off',           functionName: 'func0005'}
  ];
  ss.addMenu('EveryDevice', menuEntries);
}


function log_start_() {
  var trigger,
      handler = [],
      ret;

  ret = Browser.msgBox(
      'Start device monitoring, OK?',
      Browser.Buttons.OK_CANCEL
  );

  if (ret !== 'ok') { return; }

  trigger = ScriptApp.newTrigger('func0011');
  trigger.timeBased().everyMinutes(15).create();

  Browser.msgBox('Started.');
  return;
}


function log_pause_() {
  var triggers = ScriptApp.getProjectTriggers();

  var ret = Browser.msgBox(
      'Pause device monitoring, OK?',
      Browser.Buttons.OK_CANCEL
    );
  if (ret !== 'ok') { return; }

  for (var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  Browser.msgBox('Paused.');
}


function log_off_() {
  var triggers = ScriptApp.getProjectTriggers();

  var ret = Browser.msgBox(
      'Log Off and Stop device monitoring, OK?',
      Browser.Buttons.OK_CANCEL
    );
  if (ret !== 'ok') { return; }

  for (var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  require('./deviceMonitor').logOff();

  Browser.msgBox('Logged off.');
}
