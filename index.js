
const Alexa = require('ask-sdk-core');


const registeredMonths = {};


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bienvenido, puedes decir quiero registrar algun gasto seleccionando un mes y tu presupuesto';

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
        const speakOutput = 'You can say hello to me! How can I help?';

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
        const speakOutput = 'Goodbye!';

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
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



const AgregarMesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgregarMesIntent';
    },
    handle(handlerInput) {
        const { requestEnvelope } = handlerInput;
        const month = Alexa.getSlotValue(requestEnvelope, 'month');
        const year = Alexa.getSlotValue(requestEnvelope, 'year');
        const income = Alexa.getSlotValue(requestEnvelope, 'income');
        const budget = Alexa.getSlotValue(requestEnvelope, 'budget');

        const currentDate = new Date();
        const inputDate = new Date(`${month} 1, ${year}`);

        if (inputDate < currentDate) {
            const speakOutput = 'No puedes agregar un mes anterior al mes actual. ¿Quieres intentar con otro mes?';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Puedes decir "Agregar un mes" o "Consultar un reporte".')
                .getResponse();
        }

        const key = `${month.toLowerCase()}_${year}`;
        if (registeredMonths[key]) {
            const speakOutput = `El mes de ${month} ${year} ya está registrado. ¿Quieres intentar con otro mes?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Puedes decir "Agregar un mes" o "Consultar un reporte".')
                .getResponse();
        }

        registeredMonths[key] = { month, year, income, budget, expenses: [] };

        const speakOutput = `Añadiendo el mes de ${month} ${year} con una ganancia de ${income} y un presupuesto de ${budget}. ¿Quieres hacer algo más?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Puedes decir "Agregar un mes" o "Consultar un reporte".')
            .getResponse();
    }
};


const AgregarGastoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgregarGastoIntent';
    },
    handle(handlerInput) {
        const { requestEnvelope } = handlerInput;
        const amount = Alexa.getSlotValue(requestEnvelope, 'amount');
        const category = Alexa.getSlotValue(requestEnvelope, 'category');

        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' }).toLowerCase();
        const currentYear = currentDate.getFullYear();

        const key = `${currentMonth}_${currentYear}`;
        if (!registeredMonths[key]) {
            const speakOutput = `No puedes agregar un gasto porque el mes actual no está registrado. ¿Quieres intentar con otro comando?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Puedes decir "Agregar un mes" o "Consultar un reporte".')
                .getResponse();
        }

        registeredMonths[key].expenses.push({ amount, category });

        const speakOutput = `Agregando un gasto de ${amount} en la categoría ${category} para el mes de ${currentMonth} ${currentYear}. ¿Quieres hacer algo más?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Puedes decir "Agregar un gasto" o "Consultar un reporte".')
            .getResponse();
    }
};

const ConsultarReporteIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarReporteIntent';
    },
    handle(handlerInput) {
        const { requestEnvelope } = handlerInput;
        const month = Alexa.getSlotValue(requestEnvelope, 'month');
        const year = Alexa.getSlotValue(requestEnvelope, 'year');

        const key = `${month.toLowerCase()}_${year}`;
        if (!registeredMonths[key]) {
            const speakOutput = `No se encontró el mes de ${month} ${year}. ¿Quieres intentar con otro mes?`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Puedes decir "Agregar un mes" o "Consultar un reporte".')
                .getResponse();
        }

        const { income, budget, expenses } = registeredMonths[key];
        const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const balance = income - totalExpenses;
        const status = balance >= 0 ? 'ahorro' : 'deuda';

        const speakOutput = `Reporte para ${month} ${year}: Ganancia mensual ${income}, presupuesto mensual ${budget}, cantidad de gasto ${totalExpenses}, y tu saldo es de ${balance} (${status}). ¿Quieres hacer algo más?`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Puedes decir "Agregar un mes" o "Consultar un reporte".')
            .getResponse();
    }
};


const ModificarMesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ModificarMesIntent';
    },
    handle(handlerInput) {
        const { requestEnvelope } = handlerInput;
        const month = Alexa.getSlotValue(requestEnvelope, 'month');
        const year = Alexa.getSlotValue(requestEnvelope, 'year');
        const income = Alexa.getSlotValue(requestEnvelope, 'income');
        const budget = Alexa.getSlotValue(requestEnvelope, 'budget');

        const speakOutput = `Updating income to ${income} and budget to ${budget} for ${month} ${year}.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
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
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        AgregarMesIntentHandler,
        AgregarGastoIntentHandler,
        ConsultarReporteIntentHandler,
        ModificarMesIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();