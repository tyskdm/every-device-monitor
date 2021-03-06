

var sheetdb = require('gas-sheetdb'),
    server = require('./server');



function setUpSpreadsheet() {

  var deviceInfo = sheetdb.getTable('DeviceInfo'),
      dataHeader = sheetdb.getTable('DataHeader');

  var device_UUID = deviceInfo.getValue(/* 'device_UUID' */ 1, 1),
      data = server.getDeviceData(device_UUID);
      data = data[data.length - 1];                      // pick up latest one.

  var i, j, p, s, col = 1;
  for (i = 0; i < data.length; i++) {
    dataHeader.setValue(/* 'SensorName' */ 1, col, data[i]['sensor_name']);
    s = col;

    for (p in data[i]['data']) {
      if (data[i]['data'].hasOwnProperty(p)) {
        if (p === 'values') {
          for (j = 0; j < data[i]['data'][p].length; j++) {
            dataHeader.setValue(/* 'Data' */ 2, col, p + '[' + j + ']');
            col++;
          }
        } else {
          dataHeader.setValue(/* 'Data' */ 2, col, p);
          col++;
        }
      }
    }

    // TODO: Merge sensor_name cells "s --> col-1".

  }
  SpreadsheetApp.flush();
  Browser.msgBox('Done: setup Header Labels.');
}


function manualUpdate() {
  Browser.msgBox('update status.');
  updateStatus();
  Browser.msgBox('updated.');
}


function updateStatus() {
  
  var deviceInfo = sheetdb.getTable('DeviceInfo'),
      deviceData = sheetdb.getTable('DeviceData');

  var device_UUID = deviceInfo.getValue(/* 'device_UUID' */ 1, 1),
      data = server.getDeviceData(device_UUID);

  var dataRecords = new sheetdb.RowsList(deviceData, function(table, row) {
    return (table.getValue(row, 'SensorName.Data') !== '');
  });
  
  var openRecords = new sheetdb.RowsList(deviceData, function(table, row) {
    return (table.getValue(row, 'SensorName.Data') === '');
  });

  var lastData, oldDate;
  if (dataRecords.getNumRows() > 0) {
    lastData = dataRecords.getRow(dataRecords.getNumRows());
    oldDate = deviceData.getValue(lastData, 'SensorName.Data');
  } else {
    lastData = 0;
    oldDate = '0000';
  }

  lastData += 1;
  var i, j, k, indexString, val;

  for (i = 0; i < data.length; i++) {
    if (data[i][0].data.at > oldDate) {
      break;
    }
  }

  if ((data.length > 0) && (i === data.length)) {
    deviceData.setValue(lastData - 1, 'LastChecked', Date());
    return;
  }
  
  for ( ; i < data.length; i++, lastData++) {
    for (j = data[i].length - 1; j >= 0; j--) {

      indexString = data[i][j].sensor_name;

      val = data[i][j].data.at ? data[i][j].data.at : '';
      deviceData.setValue(lastData, indexString + '.at', val);                      // index stringが、マッチするか確認する方法が欲しい。

      val = data[i][j].data.value;
      if (val) {
        deviceData.setValue(lastData, indexString + '.value', '' + val);
      }

      val = data[i][j].data.values;
      if (val) {
        for (k = 0; k < val.length; k++) {
          deviceData.setValue(lastData, indexString + '.values[' + k + ']', '' + val[k]);
        }
      }

      val = data[i][j].data.unit;
      if (val) {
        deviceData.setValue(lastData, indexString + '.unit', val);
      }
    }
    deviceData.setValue(lastData, 'SensorName.Data', data[i][0].data.at);
  }

  lastData = lastData === 1 ? 2 : lastData;
  deviceData.setValue(lastData - 1, 'LastUpdated', '' + Date());
  
  SpreadsheetApp.flush();
}

function logOff() {

  // Set spreadsheet status messages

  server.deleteSessionKey();
}



module.exports = {
  "setUpSpreadsheet":   setUpSpreadsheet,
  "manualUpdate":       manualUpdate,
  "updateStatus":       updateStatus,
  "logOff":             logOff
};

