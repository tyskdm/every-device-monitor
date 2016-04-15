
var url = "https://api.every-sense.com:8001/session";


function getDeviceData(device_uuid, opt) {

  var data, sessionkey, response,
      url = "https://api.every-sense.com:8001/device_data/";
  
  sessionkey = getSessionKey();
  url += device_uuid;

  response = UrlFetchApp.fetch(url + '?session_key=' + sessionkey + '&limit=10');
  //{
  //  "method" : "GET",
  //  "payload" : {
  //    "session_key": sessionkey
  //    // "limit": 1000
  //    // "from":  取得開始時刻
  //    // "to":    取得終了時刻
  //  }
  //});

  data = JSON.parse(response.getContentText());

  data.sort(function(a, b){
    return (a[0].data.at > b[0].data.at) ? 1 : -1;
  });

  saveSessionKey(sessionkey);

  return data;
}




function getSessionKey() {
  
  var sessionkey,
      up = PropertiesService.getUserProperties();
      //cache = CacheService.getUserCache();

  sessionkey = up.getProperty("Session-Key");
  //sessionkey = cache.get("Session-Key");

  if (sessionkey === null) {
    sessionkey = createSessionKey();
  }

  return sessionkey;
}


function saveSessionKey(sessionkey) {
  if (sessionkey !== null) {
    var up = PropertiesService.getUserProperties();
    //var cache = CacheService.getUserCache();

    up.setProperty("Session-Key", sessionkey);
    //cache.put("Session-Key", sessionkey, 518400);     // cache for 6 days. EverySense Session key is effective for 7 days.
  }
}


function createSessionKey() {

  var sessionkey, response, content,
      payload = {},
      ui = SpreadsheetApp.getUi();

  response = ui.prompt('Login name:',
                       "This information will be used for login only one time." +
                       "It'll be removed at onece and never be stored anywhere.",
                       ui.ButtonSet.OK_CANCEL);  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return null;
  }
  payload.login_name = response.getResponseText();

  response = ui.prompt('Password',
                       "This information will be used for login only one time." +
                       "It'll be removed at onece and never be stored anywhere.",
                       ui.ButtonSet.OK_CANCEL);  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return null;
  }
  payload.password = response.getResponseText();

  response = UrlFetchApp.fetch(url, {
    "method" : "POST",
    "payload" : JSON.stringify(payload)
  });

  if (response.getResponseCode() !== 200) {
    Browser.msgBox('HTTP Response Error. Try again later.');
    return null;
  }

  content = JSON.parse(response.getContentText("UTF-8"));
  
  if (content.code === 0) {
    sessionkey = content.session_key;
  } else {
    // todo: add error type check.
    Browser.msgBox('EverySense returns ERROR : ' + content.message);
    sessionkey = getSessionKey();
  }
  
  return sessionkey;
}


function deleteSessionKey() {

  var sessionkey, response, content,
      cache = CacheService.getUserCache();

  sessionkey = cache.get("Session-Key");

  if (sessionkey === null) {
    return;
  }

  response = UrlFetchApp.fetch(url + '/' + sessionkey, { "method" : "DELETE" });

  if (response.getResponseCode() !== 200) {
    Browser.msgBox('HTTP Response Error. Try again later.');
    return null;
  }

  content = JSON.parse(response.getContentText("UTF-8"));
  
  cache.remove("Session-Key");

  if (content.code !== 0) {
    Browser.msgBox('EverySense returns ERROR : ' + content.message);
  }
}


module.exports = {
  "getDeviceData":      getDeviceData,
  "deleteSessionKey":   deleteSessionKey
};



