class Logs {

    info(data){
        console.log(JSON.stringify({ eventBusInternalLog: { traceId: data.traceId, _id: data._id, exchangeName: data.exchangeName } }))
    }

    error(data) {
        console.error(JSON.stringify({
            eventBusInternalError: error,
            eventBusInternalLog: { traceId: data.traceId, _id: data._id, exchangeName: data.exchangeName }
        })) 
    }
}


export const logs = new Logs()