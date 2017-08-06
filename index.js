const Siren = require('./Siren');
const co = require('co');
const http = require('http');
const url = require('url');
const auth = require('basic-auth');
const config = require('./config');


http.createServer((req, res) => {
    let credentials = auth(req);
    let query = url.parse(req.url, true).query;

    // :: Validate credentials
    if (!credentials || credentials.name !== config.webhookUsername || credentials.pass !== config.webhookPassword) {
        res.writeHead(401, {'Content-Type': 'application/json'});
        let response = {status: 'ERROR', message: 'Access Denied'};
        return res.end(JSON.stringify(response));
    }

    // :: Validate query type
    let type = query.type;
    if (!type || (type != 'start' && type != 'stop' && type != 'status' && type != 'beep')) {
        res.writeHead(422, {'Content-Type': 'application/json'});
        let response = {
            status: 'ERROR',
            message: 'The param "type" must be present and be either "start", "stop", "beep" or "status"'
        };
        return res.end(JSON.stringify(response));
    }

    co(function* () {

        let siren = new Siren(config.sirenIpAddress, config.sirenPassword);
        let loginStatus = yield siren.login();
        if(loginStatus !== 'success') {
            res.writeHead(503, {'Content-Type': 'application/json'});
            let response = {status: 'ERROR', message: 'An error occurred while processing siren webhook'};
            return res.end(JSON.stringify(response));
        }

        // :: Stop sounding the siren
        if (type === 'stop') {
            let status = yield siren.stop();
            if (status == 'OK') {
                res.writeHead(200, {'Content-Type': 'application/json'});
                let response = {status: 'OK', message: 'Siren has been stopped.'};
                return res.end(JSON.stringify(response));
            } else {
                res.writeHead(503, {'Content-Type': 'application/json'});
                let response = {status: 'ERROR', message: 'Siren could not be stopped'};
                return res.end(JSON.stringify(response));
            }
        }

        // :: Beep the siren
        if (type === 'beep') {
            let times = (query.times && !isNaN(query.times) && query.times > 0 && query.times < 10) ? query.times : 1;
            let status = yield siren.beep(times);
            if (status == 'OK') {
                res.writeHead(200, {'Content-Type': 'application/json'});
                let response = {status: 'OK', message: 'Siren beeping'};
                return res.end(JSON.stringify(response));
            } else {
                res.writeHead(503, {'Content-Type': 'application/json'});
                let response = {status: 'ERROR', message: 'Siren could not beep'};
                return res.end(JSON.stringify(response));
            }
        }

        // :: Get the current status of the siren
        if (type === 'status') {
            let status = yield siren.getPlayingStatus();
            res.writeHead(200, {'Content-Type': 'application/json'});
            let response = {status: 'OK', message: 'Successfully processed', isPlaying: status};
            return res.end(JSON.stringify(response));
        }

        // :: Play a sound on the siren
        if (type === 'start') {
            let sound = (query.sound && !isNaN(query.sound) && query.sound > 0 && query.sound < 7) ? query.sound : 1;
            let duration = (query.duration && !isNaN(query.duration) && query.duration > 0 && query.duration < 88888) ? query.duration : 3;
            let volume = (query.volume && !isNaN(query.volume) && query.volume > 0 && query.volume < 101) ? query.volume : 100;
            let status = yield siren.play(sound, volume, duration);
            if (status == 'OK') {
                res.writeHead(200, {'Content-Type': 'application/json'});
                let response = {status: 'OK', message: 'Siren is sounding'};
                return res.end(JSON.stringify(response));
            } else {
                res.writeHead(503, {'Content-Type': 'application/json'});
                let response = {status: 'ERROR', message: 'Error sounding the siren'};
                return res.end(JSON.stringify(response));
            }
        }

    }).catch(err => {
        console.log(err);
        res.writeHead(503, {'Content-Type': 'application/json'});
        let response = {status: 'ERROR', message: 'An error occurred while processing siren webhook'};
        return res.end(JSON.stringify(response));
    });

}).listen(config.webhookPort);
console.log(`:: Kickstarted server on port ${config.webhookPort}`);
