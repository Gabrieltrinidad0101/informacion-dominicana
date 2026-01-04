class Logs {
    disabled = false

    info(event){
        if(this.disabled) return
        console.log(JSON.stringify({ eventBusInternalLog: { traceId: event.traceId, _id: event._id, exchangeName: event.exchangeName } }))
    }

    infoHistory(event,data){
        if(this.disabled) return
        console.log(JSON.stringify({ eventBusInternalLogHistory: { traceId: event.traceId, _id: event._id, exchangeName: event.exchangeName, ...data } }))
    }

    error(event,error = "") {
        if(this.disabled) return
        console.error(JSON.stringify({
            eventBusInternalError: error,
            eventBusInternalLog: { traceId: event.traceId, _id: event._id, exchangeName: event.exchangeName }
        })) 
    }
}


export const logs = new Logs()