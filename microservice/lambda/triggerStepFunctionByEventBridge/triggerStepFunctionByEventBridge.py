import boto3
import json
import datetime as dt
import os

def lambda_handler(event, context):
    sfn = boto3.client('stepfunctions')
    arnSfnDelta = os.environ["arnSfnDelta"]
    
    #ejecuciones en curso
    response = sfn.list_executions(
            stateMachineArn=arnSfnDelta,
            statusFilter='RUNNING',
            maxResults=3
    )
    json_data = json.dumps(response,indent=4, sort_keys=True, default=str)
    countExe = json.loads(json_data)
    
    print("cantidad de ejecuciones en curso",len(countExe['executions']))
    

    
    if len(countExe['executions']) == 0:
        print("no habia ejecuciones en curso")
        #ultima ejecucion
        response = sfn.list_executions(
            stateMachineArn=arnSfnDelta,
            statusFilter='SUCCEEDED',
            maxResults=1
        )
        json_data = json.dumps(response,indent=4, sort_keys=True, default=str)
        countExe = json.loads(json_data)
        
        today = dt.date.today()
        todayString = today.strftime('%Y-%m-%d')

        if todayString not in countExe['executions'][0]['startDate']:
            print('tampoco hubo ejecuciones hoy')

            inputParams = """
                {
                    "type_event": "full",
                    "stage": "prd"
                }

                """
            
            response = sfn.start_execution(
                stateMachineArn=arnSfnDelta,
                input=inputParams
            )
            print('se ejecuta la SF')

 
    
    return {
        'status': 'ok'
    }