const AWS = require('aws-sdk');
const iotData = new AWS.IotData({ endpoint: 'a3v2gf9whawh53-ats.iot.us-east-2.amazonaws.com' });
var thing_name;

const TurnOnParams = {
    //topic: `$aws/things/${varGlobalThingName}/shadow/update`,
    topic: `$aws/things/${thing_name}/shadow/update`,
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    payload: '{"state": {"desired": {"dispenser": "on"}}}',
};

const TurnOffParams = {
    topic: `$aws/things/${thing_name}/shadow/update`,
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    payload: '{"state": {"desired": {"dispenser": "off"}}}',
};

const turnOnDispenser = async () => {
    console.log(thing_name);
  iotData.publish(TurnOnParams, function(err, data) {
            if (err) console.log(err);
        });
  console.log('Encendiendo el dispositivo...');
};

const turnOffDispenser = async () => {
   iotData.publish(TurnOffParams, function(err, data) {
            if (err) console.log(err);
        });
  console.log('Apagando el dispositivo...');
};

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    thing_name = event.thing_name;
    const distanceGlassSensor = event.distanceGlassSensor;
    const distanceLiquidSensor = event.distanceLiquidSensor;
    const weight = event.weight;
    console.log(distanceGlassSensor);
    console.log(distanceLiquidSensor);
    console.log(weight);
    if (distanceGlassSensor < 7 && distanceLiquidSensor > 10) {
        await turnOnDispenser();
    } else {
        await turnOffDispenser();
    }
    return {
        speechText: 'Doneee'
    };
};



/*
// Register the handlers and make them ready for use in Lambda
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LaunchRequestHandler)
  .lambda();
*/
  
  
