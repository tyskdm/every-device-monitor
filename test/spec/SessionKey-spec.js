'use_strict';

var _GAS_ = !((typeof process !== 'undefined') && process.versions && process.versions.node),
    BASE_URL = "https://api.every-sense.com:8001";

if ( _GAS_) {

    describe('SessionKey:', function() {
        var SessionKey, sessionkey;
    
        beforeEach(function() {
            SessionKey = require('../../src/SessionKey');
            sessionkey = new SessionKey(BASE_URL);
            sessionkey.delete_session();
        });
      
        afterEach(function () {
            sessionkey.delete_session();
        });
    
    
        it("Confirm: session is closed.", function() {
            expect(sessionkey.get()).toBe(null);
        });

        describe('set()/get():', function() {
            it("set and get sessionkey:", function() {
                expect(sessionkey.sessionkey_).toBe(null);
                expect(sessionkey.get()).toBe(null);

                sessionkey.set('TEST');

                expect(sessionkey.sessionkey_).toBe('TEST');
                expect(sessionkey.get()).toBe('TEST');
            });
        });
    
        describe('create_session():', function() {
            it("creates session and get session_key:", function() {
                var result, info = require('./.sessionkey-info.json');
                result = sessionkey.create_session(info.login_name, info.password);

                expect(typeof result).toBe('object');
                expect(result.code).toBe(0);

                expect(typeof result.session_key).toBe('string');
                expect(sessionkey.sessionkey_).toBe(result.session_key);
            });

            it("returns error when password mismatch:", function() {
                var result, info = require('./.sessionkey-info.json');
                result = sessionkey.create_session(info.login_name, info.password + 'error');
                expect(result.code).toBe(-2);
                expect(sessionkey.get()).toBe(null);
            });
        });

        describe('delete_session():', function() {
            it("deletes session and clear stored session_key:", function() {
                var result, info = require('./.sessionkey-info.json');
                result = sessionkey.create_session(info.login_name, info.password);

                expect(result.code).toBe(0);
                expect(typeof sessionkey.get()).toBe('string');

                result = sessionkey.delete_session();

                expect(result.code).toBe(0);
                expect(sessionkey.get()).toBe(null);
            });

            it("returns error when sessionkey was broken:", function() {
                var result, backupKey, info = require('./.sessionkey-info.json');
                result = sessionkey.create_session(info.login_name, info.password);
                expect(result.code).toBe(0);
                expect(typeof sessionkey.get()).toBe('string');

                backupKey = sessionkey.get();
                sessionkey.set('TEST');

                result = sessionkey.delete_session();

                expect(result.code).toBe(-1);
                expect(sessionkey.get()).toBe(null);

                // tear down
                sessionkey.set(backupKey);
                result = sessionkey.delete_session();

                expect(result.code).toBe(-0);
                expect(sessionkey.get()).toBe(null);
            });

            it("returns null when session has been closed:", function() {
                var result;
                sessionkey.delete_session();  // set up: close session.

                result = sessionkey.delete_session();

                expect(result).toBe(null);
            });
        });
    });
}




