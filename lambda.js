const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({endpoint: 'a3v2gf9whawh53-ats.iot.us-east-2.amazonaws.com'});

AWS.config.update({
    region: 'us-east-2',
    apiVersion: '2012-08-10'
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TurnOnParams = {
    //topic: `$aws/things/${varGlobalThingName}/shadow/update`,
    topic: '$aws/things/dispenser/shadow/update',
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    payload: '{"state": {"desired": {"dispenser": "on"}}}',
};

const TurnOffParams = {
    topic: '$aws/things/dispenser/shadow/update',
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    payload: '{"state": {"desired": {"dispenser": "off"}}}',
};

const setManual = {
    topic: '$aws/things/dispenser/shadow/update',
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    payload: '{"state": {"desired": {"manual": "on"}}}',
};

const setAuto = {
    topic: '$aws/things/dispenser/shadow/update',
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    payload: '{"state": {"desired": {"manual": "off"}}}',
};

function getShadowPromise(params) {
    return new Promise((resolve, reject) => {
        IotData.getThingShadow(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject(`Failed to get thing shadow ${err.errorMessage}`);
            } else {
                resolve(JSON.parse(data.payload));
            }
        });
    });
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Water dispenser initiated';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const ShadowParams = {
    //thingName: 'arn:aws:iot:us-east-2:879374154165:thing/dispenser',
    thingName: 'dispenser',
};

function registerClientThing(IDClient, IDThing) {
    var DB_dispenser = 'DB_dispenser';
    const params = {
        TableName: DB_dispenser, 
        Item: {
            'id_usuario': IDClient,
            'id_thing': IDThing
        }
    };

    return new Promise((resolve, reject) => {
        dynamoDB.put(params, (error, data) => {
            if (error) {
                console.error('Error al registrar en DynamoDB:', error);
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

function checkUserThing(IDClient) {
    const DB_dispenser = 'DB_dispenser';
    const params = {
        TableName: DB_dispenser,
        KeyConditionExpression: 'id_usuario = :a',
        ExpressionAttributeValues: {
            ':a': IDClient
        }
    };
    
    return dynamoDB.query(params).promise()
        .then(result => {
            return result.Items || [];
        })
        .catch(error => {
            console.error('Error al realizar la consulta en DynamoDB:', error);
            throw error;
        });
}

const RegistrarIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarIntent';
    },
    async handle(handlerInput) {
        const id_usuario = handlerInput.requestEnvelope.context.System.user.userId;
        const id_thing = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Nombre'); 
        
        try {
            const response = await registerClientThing(id_usuario, id_thing);
            const speakOutput = `Dispenser ${id_thing} registered.`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            const speakOutput = 'Hubo un error al registrar el cliente. Por favor intenta nuevamente.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const UseIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UseIntent';
    },
    async handle(handlerInput) {
        const id_usuario = handlerInput.requestEnvelope.context.System.user.userId;
        const id_thing = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Nombre'); 
        var speakOutput = "Error";
        try {
            const response = await checkUserThing(id_usuario);
            //response lista de dispositivos
            //console.log(response);
            const existe_dispositivo = response.some(respuesta => respuesta.id_thing === id_thing);
            //console.log(id_thing);
            if (existe_dispositivo){
                speakOutput = `Your are using thing ${id_thing}`;
            }
            else{
                speakOutput = `Thing ${id_thing} does not exists`;
            }
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            const speakOutput = 'Hubo un error. Por favor intenta nuevamente.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const dispenserOnIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'dispenserOnIntent';
    },
    handle(handlerInput) {
        var speakOutput = 'Error';
        IotData.publish(TurnOnParams, function(err, data) {
            if (err) console.log(err);
        });

        speakOutput = 'Activating';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
  }
};

const dispenserOffIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'dispenserOffIntent';
    },
    handle(handlerInput) {
        var speakOutput = 'Error';
        IotData.publish(TurnOffParams, function(err, data) {
            if (err) console.log(err);
        });

        speakOutput = 'Deactivating';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
  }
};

const manualIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'manualIntent';
    },
    handle(handlerInput) {
        var speakOutput = 'Error';
        IotData.publish(setManual, function(err, data) {
            if (err) console.log(err);
        });

        speakOutput = 'Setting manual';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
  }
};

const autoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'autoIntent';
    },
    handle(handlerInput) {
        var speakOutput = 'Error';
        IotData.publish(setAuto, function(err, data) {
            if (err) console.log(err);
        });

        speakOutput = 'Setting auto';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
  }
};

const waterQueryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'waterQueryIntent';
    },
    async handle(handlerInput) {
        var weight = "unknown";
        await getShadowPromise(ShadowParams)
          .then((result) => weight = result.state.reported.weight);
        console.log(weight);
        var speakOutput = 'Error';
        if (weight >= 2000)
            speakOutput = "Dispenser is full";
        else if (weight >= 200)
            speakOutput = `There is ${weight} mililiters`;
        else
            speakOutput = "There is not enough water";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
  }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can activate and deactivate dispenser';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Bye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Error';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler,
                        RegistrarIntentHandler,
                        UseIntentHandler,
                        dispenserOnIntentHandler,
                        dispenserOffIntentHandler,
                        manualIntentHandler,
                        autoIntentHandler,
                        waterQueryIntentHandler,
                        HelpIntentHandler,
                        CancelAndStopIntentHandler,
                        FallbackIntentHandler,
                        SessionEndedRequestHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();
