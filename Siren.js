let SoapClient = require('./lib/SoapClient');
const SOUNDS = {
    EMERGENCY: 1,
    FIRE: 2,
    AMBULANCE: 3,
    POLICE: 4,
    DOOR_CHIME: 5,
    BEEP: 6
};

class Siren {

    constructor(ipAddress, password) {
        this.sounds = SOUNDS;
        this.client = new SoapClient(ipAddress, password);
    }

    login() {
        return this.client.login().catch(err => {
            console.log(err);
        });
    }

    beep(times = 1) {
        return this.client._soapAction('SetSoundPlay', 'SetSoundPlayResult', this.client._requestBody('SetSoundPlay', `
                <ModuleID>1</ModuleID>
                <Controller>1</Controller>
                <SoundType>${this.sounds.BEEP}</SoundType>
                <Volume>100</Volume>
                <Duration>${times}</Duration>
            `))
    }

    play(sound = 1, volume = 100, duration = 88888) {
        return this.client._soapAction('SetSoundPlay', 'SetSoundPlayResult', this.client._requestBody('SetSoundPlay', `
                <ModuleID>1</ModuleID>
                <Controller>1</Controller>
                <SoundType>${sound}</SoundType>
                <Volume>${volume}</Volume>
                <Duration>${duration}</Duration>
            `));
    }

    getPlayingStatus() {
        return new Promise((resolve, reject) => {
            this.client._soapAction('GetSirenAlarmSettings', 'IsSounding', this.client._requestBody('GetSirenAlarmSettings', `
                <ModuleID>1</ModuleID>
                <Controller>1</Controller>
            `)).then(isPlaying => {
                let status = (isPlaying == 'false' || isPlaying == false) ? false : true;
                return resolve(status);
            }).catch(err => {
                console.log(err);
                return reject(err);
            })
        });
    }

    stop() {
        return this.client._soapAction('SetAlarmDismissed', 'SetAlarmDismissedResult', this.client._requestBody('SetAlarmDismissed', `
                <ModuleID>1</ModuleID>
                <Controller>1</Controller>
            `))
    }
}

module.exports = Siren;