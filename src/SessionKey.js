'use_strict';

var PropertiesService = require('PropertiesService'),
    UrlFetchApp = require('UrlFetchApp'),
    assert = require('./assert');


function SessionKey(baseUrl) {
    this.baseUrl_ = baseUrl;
    this.sessionkey_ = PropertiesService.getUserProperties().getProperty("Session-Key");   // if not exist, null. 
}

SessionKey.prototype.get = function () {
  return this.sessionkey_;
};

SessionKey.prototype.set = function (sessionkey) {
  this.sessionkey_ = sessionkey;
  if (sessionkey) {
    PropertiesService.getUserProperties().setProperty("Session-Key", sessionkey);
  } else {
    PropertiesService.getUserProperties().deleteProperty("Session-Key");
  }
};

SessionKey.prototype.create_session = function (login_name, password) {

  var response, content,
      payload = {};

  payload.login_name = login_name;
  payload.password = password;

  response = UrlFetchApp.fetch(this.baseUrl_ + '/session', {
    "method" : "POST",
    "payload" : JSON.stringify(payload)
  });

  content = check_response_(response);
  if (content.code === 0) {
      this.set(content.session_key);
  }

  return content;
};


SessionKey.prototype.delete_session = function() {

  var sessionkey, response, content;

  sessionkey = this.get();
  if (sessionkey === null) {
    return null;
  }

  response = UrlFetchApp.fetch(this.baseUrl_ + '/session/' + sessionkey, { "method" : "DELETE" });
  content = check_response_(response);

  this.set(null);

  return content;
};


function check_response_(response) {
  var responseCode, content;

  responseCode = response.getResponseCode();
  assert(responseCode === 200, 'HTTP(S) Response Error[' + responseCode + ']');

  content = JSON.parse(response.getContentText("UTF-8"));
  
  if (content.code === 0) {
    return content;
  }

  switch (content.code) {
    case -1:    // fail / data not exists.
      break;
    
    case -2:    // Authentication Error
      break;
    
    case -10:   // Error: device gateway
      assert(content.code === 0,
             'Server Error[-10]: ' + content.message);
      break;
    
    case -20:   // Error: data-subsystem
      assert(content.code === 0,
             'Server Error[-20]: message = "' + content.message + '" trace = "' + content.trace + '"');
      break;

    default:    // Unknown Error type
      var errorMessage = 'Unknown Error[' + content.code + ']:';
      if (content.reason) {
        errorMessage += ' reason = "' + content.reason + '"';
      }
      if (content.reason) {
        errorMessage += ' message = "' + content.message + '"';
      }
      if (content.reason) {
        errorMessage += ' trace = "' + content.trace + '"';
      }
      assert(content.code === 0, errorMessage);
      break;
  }

  return content;
}


module.exports = SessionKey;

