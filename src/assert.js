/**
 * assert function for Google Apps Script.<br/>
 * This function adds call stack infomation to error message.
 * @fileoverview assert() for Google Apps Script.
 */

/**
 * assert
 * @param {boolean} value
 * @param {string} message
 */
module.exports = function assert(value, message) {
  if (!!!value) {
    try {
      throw new Error();
    } catch (e) {
      e.message = message;
      e.message += e.stack ? (' [' + e.stack.replace(/^.+\)/, '') + ']') : '';
      throw e;
    }
  }
};

