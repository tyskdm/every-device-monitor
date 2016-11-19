'use_strict';

var BASE_URL,
    assert = require('./assert'),
    UrlFetchApp = require('UrlFetchApp');

function init(base_url) {
    BASE_URL = base_url;
}

function getDeviceData(device_uuid, sessionkey, opt) {

  var data, response, responseCode,
      url = BASE_URL +
            '/device_data/' + device_uuid +
            '?session_key=' + sessionkey();

  if (opt) {
    url += opt.limit ? '&limit=' + opt.limit : '';
    url += opt.from ? '&from=' + opt.from : '';
    url += opt.to ? '&to=' + opt.to : '';
  }

  response = UrlFetchApp.fetch(url);

  responseCode = response.getResponseCode();
  assert(responseCode === 200, 'HTTP(S) Response Error[' + responseCode + ']');

  data = JSON.parse(response.getContentText("UTF-8"));

  if (data.code === undefined) {   // Error
    return data;
  }
  
  data.sort(function(a, b){
    return compareTimeString_(a, b);
  });

  return data;
}

function compareTimeString_(a, b) {
    return (a[0].data.at.replace(/-(?=[1-9][-\s])/g, '-0') > b[0].data.at.replace(/-(?=[1-9][-\s])/g, '-0')) ? 1 : -1;
}





module.exports = {
  "init": init,
  // "postDeviceData": postDeviceData,
  "getDeviceData":  getDeviceData
  // "getRecipeData":  getRecipeData
};


