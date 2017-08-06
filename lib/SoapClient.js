let AES = require('./AES');
let DOMParser = require('xmldom').DOMParser;
let request = require('request-promise');
let md5 = require('./hmac_md5');

class SoapClient {

    constructor(ipAddress, password) {
        this.HNAP1_XMLNS = "http://purenetworks.com/HNAP1/";
        this.HNAP_METHOD = "POST";
        this.HNAP_BODY_ENCODING = "UTF8";
        this.HNAP_LOGIN_METHOD = "Login";
        this.HNAP_AUTH = {
            URL: `http://${ipAddress}/HNAP1`,
            User: "admin",
            Pwd: password,
            Result: "",
            Challenge: "",
            PublicKey: "",
            Cookie: "",
            PrivateKey: ""
        };
    }

    _requestBody(method, parameters) {
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
            "<soap:Envelope " +
            "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
            "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
            "xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
            "<soap:Body>" +
            "<" + method + " xmlns=\"" + this.HNAP1_XMLNS + "\">" +
            parameters +
            "</" + method + ">" +
            "</soap:Body></soap:Envelope>";
    }

    _loginRequest() {
        return "<Action>request</Action>"
            + "<Username>" + this.HNAP_AUTH.User + "</Username>"
            + "<LoginPassword></LoginPassword>"
            + "<Captcha></Captcha>";
    }

    _loginParameters() {
        let login_pwd = md5.hex_hmac_md5(this.HNAP_AUTH.PrivateKey, this.HNAP_AUTH.Challenge);
        return "<Action>login</Action>"
            + "<Username>" + this.HNAP_AUTH.User + "</Username>"
            + "<LoginPassword>" + login_pwd.toUpperCase() + "</LoginPassword>"
            + "<Captcha></Captcha>";
    }

    _saveLoginResult(body) {
        let doc = new DOMParser().parseFromString(body);
        this.HNAP_AUTH.Result = doc.getElementsByTagName(this.HNAP_LOGIN_METHOD + "Result").item(0).firstChild.nodeValue;
        this.HNAP_AUTH.Challenge = doc.getElementsByTagName("Challenge").item(0).firstChild.nodeValue;
        this.HNAP_AUTH.PublicKey = doc.getElementsByTagName("PublicKey").item(0).firstChild.nodeValue;
        this.HNAP_AUTH.Cookie = doc.getElementsByTagName("Cookie").item(0).firstChild.nodeValue;
        this.HNAP_AUTH.PrivateKey = md5.hex_hmac_md5(this.HNAP_AUTH.PublicKey + this.HNAP_AUTH.Pwd, this.HNAP_AUTH.Challenge).toUpperCase();
    }

    _getHnapAuth(SoapAction, privateKey) {
        let current_time = new Date();
        let time_stamp = Math.round(current_time.getTime() / 1000);
        let auth = md5.hex_hmac_md5(privateKey, time_stamp + SoapAction);
        return auth.toUpperCase() + " " + time_stamp;
    }

    _readResponseValue(body, elementName) {
        if (body && elementName) {
            let doc = new DOMParser().parseFromString(body);
            let node = doc.getElementsByTagName(elementName).item(0);
            // Check that we have children of node.
            return (node && node.firstChild) ? node.firstChild.nodeValue : "ERROR";
        }
    }

    _soapAction(method, responseElement, body) {
        let options = {
            uri: this.HNAP_AUTH.URL,
            method: this.HNAP_METHOD,
            body,
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": '"' + this.HNAP1_XMLNS + method + '"',
                "HNAP_AUTH": this._getHnapAuth('"' + this.HNAP1_XMLNS + method + '"', this.HNAP_AUTH.PrivateKey),
                "Cookie": "uid=" + this.HNAP_AUTH.Cookie
            }
        };
        return request(options).then((body) => {
            return this._readResponseValue(body, responseElement);
        }).catch((err) => {
            console.log("error:", err);
        });
    }

    login() {
        return new Promise((resolve, reject) => {
            let options = {
                uri: this.HNAP_AUTH.URL,
                method: this.HNAP_METHOD,
                body: this._requestBody(this.HNAP_LOGIN_METHOD, this._loginRequest()),
                headers: {
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": '"' + this.HNAP1_XMLNS + this.HNAP_LOGIN_METHOD + '"'
                },
            };
            request(options).then(body => {
                this._saveLoginResult(body);
                return resolve(this._soapAction(this.HNAP_LOGIN_METHOD, "LoginResult", this._requestBody(this.HNAP_LOGIN_METHOD, this._loginParameters())));
            }).catch((err) => {
                console.log("error:", err);
                return reject(err);
            });
        });
    }
}

module.exports = SoapClient;