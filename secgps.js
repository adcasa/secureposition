/*
Adolfo Castro
*/
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialport = new SerialPort('/dev/serial0', { baudRate: 9600 })
const parser = serialport.pipe(new Readline({ delimiter: '\r\n' }))

nmea   = require('@drivetech/node-nmea');   

const { sendMessageFor } = require('simple-telegram-message')
require ('custom-env').env('development');

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');


/*
    DESTINO
*/
destination1=42.358703;
destination2=-71.091430;
modoViaje="walking";
frecuencia=20000;   // frecuencia/1000

    parser.on('data', (data) => {
        
        if(data.includes('$GPGGA')){
            //console.log(data + '\n===');
            msg = nmea.parse(data);
            //console.log(msg.datetime + '\n');
            //console.log(msg.loc.dmm.latitude + '\n');
            //console.log(msg.loc.dmm.longitude + '\n');
            const locstr = JSON.stringify(msg.loc);
            let geojson = JSON.parse(locstr);
            let coordinates = geojson["geojson"];
            let posGPS = coordinates["coordinates"];
            let urlGPS = `https://www.google.com/maps/dir/?api=1&origin=${posGPS[1]},${posGPS[0]}&destination=${destination1},${destination2}&travelmode=${modoViaje}`;
            /*
                QUITAR COMENTARIO PARA POS FIJAS
            */
            //posGPS[1]=42.341111
            //posGPS[0]=-71.120980
            //console.log(coordinates)
            //console.log(coordinates["coordinates"])
            console.log("\r\n");
            console.log(urlGPS);
            console.log(msg.datetime);
            console.log(posGPS[1]);
            console.log(posGPS[0]);

            /*
                SEND DATA AWS
            */
            let gpsPos = {
                id: uuidv4(),
                urlGps: urlGPS,
                latitudGPS: posGPS[1],
                longitudGPS: posGPS[0],
                fechaGPS: msg.datetime
            };

            //const url = process.env.URL_SERVERLESS;
            fetch('com/items', {
                method: 'POST',
                body: JSON.stringify(gpsPos),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
              .then(json => console.log(json));

            /*
                SEND TELEGRAM
            */
            const sendMessage = sendMessageFor(process.env.TELEGRAM_TOKEN, process.env.TELEGRAM_CHANEL)
            sendMessage(urlGPS)


            //serialport.pause();
            serialport.close();
            setTimeout(function() {
                console.log(`Puasa ${frecuencia} segundos`);
                serialport.open();
            }, frecuencia);
            
            
        }
    });
//  npm install serialport
//  npm install @drivetech/node-nmea
//  npm install node-fetch
//  npm install uuid
//  https://serialport.io/docs/api-serialport
//  https://github.com/drivetech/node-nmea#readme
//  https://github.com/nebrius/raspi-serial