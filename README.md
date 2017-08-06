# D-Link DCH-S220 Web Control
This project aims to control via a custom REST API the D-Link's DCH-S220 Siren, to allow total cutomized control over this product for home automation enthiusiasts or hobbyists.

This project is only possible due to the great work of [@bikerp](https://github.com/bikerp) and his [dsp-w215-hnap](https://github.com/bikerp/dsp-w215-hnap) repo.

The project must run on a device in the same network as your siren (on a raspberry pi for example), you must open the configured ports on your router to access it from the outside. 

# Install

To install, clone this repo first via git
```
git@github.com:mtflud/DCH-S220-Web-Control.git
```

Navigate to the project's folder and install dependencies with NPM
```
npm i
```
Or with Yarn
```
yarn install
```

Configure the authentication and siren parameters on `config.js`
```
webhookPort = The port we should listen from
webhookUsername = Your webhook username
webhookPassword = Your webhook password
sirenIpAddress = Your D-Link's Siren IP Address
sirenPassword = The 6 digit pin that comes in your siren's card
```

Run it
```
node index.js
```

Additionally, you can add a watcher to the process with [pm2](http://pm2.keymetrics.io/)

# Consuming endpoints and controlling the siren

All endpoints must be consumed to the root "/" using basic authentication and are GET types.

## Start sounding the siren
```
Parameters: 
type = 'start'
volume = Value from 1 to 100
sound = Value from 1 to 6
duration = value from 1 to 88888 (infinite)
```
Example with curl
```
curl "http://127.0.0.1:9867/?type=start&volume=20&sound=1&duration=30" \
     -u yourUsername:yourPassword
```

## Stop sounding the siren
```
Parameters: 
type = 'stop'
```
Example with curl
```
curl "http://127.0.0.1:9867/?type=stop" \
     -u yourUsername:yourPassword
```

## Sound *n* beeps
```
Parameters: 
type = 'beep'
times = Number from 1 to n the siren must beep
```
Example with curl
```
curl "http://127.0.0.1:9867/?type=beep&times=1" \
     -u yourUsername:yourPassword
```

## Get the current status of the siren
Figure out if the siren is sounding or not.
```
Parameters: 
type = 'status'
```
Example with curl
```
curl "http://127.0.0.1:9867/?type=status" \
     -u yourUsername:yourPassword
```

Example response
```
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sun, 06 Aug 2017 19:57:48 GMT
Connection: close
Transfer-Encoding: chunked

{"status":"OK","message":"Successfully processed","isPlaying":false}
```
