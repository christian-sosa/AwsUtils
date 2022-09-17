import json
import time
import boto3
import os

invokeLan = boto3.client("lambda",region_name = "us-east-1")
client = boto3.client('athena')

def sendSNS(concepto):
    sns = boto3.client('sns')
    env = os.environ["stage"]
    topic = os.environ["topic"]

    FinalMessage = f"{concepto} :  Ambiente: {env} ,Error: No coincide el conteo de Redshift con el de Athena"
    print("mensaje final", FinalMessage)
    sendError = sns.publish( TopicArn=topic, Message=FinalMessage)


    
def athenaQuery(table,database):
    response = client.start_query_execution(
        QueryString = f'Select count(*) FROM {table}', 
        QueryExecutionContext = {
            'Database' : database
        },
        ResultConfiguration = {
            'OutputLocation': 's3://aws-athena-query-results-dev-1/ / '
        }
    )
    query_execution_id = response['QueryExecutionId']
    return query_execution_id
    
def checkStatus(query_execution_id):
    RETRY_COUNT = 20
    for i in range(1, 1 + RETRY_COUNT):
        # get query execution
        query_status = client.get_query_execution(QueryExecutionId=query_execution_id)
        query_execution_status = query_status['QueryExecution']['Status']['State']

        if query_execution_status == 'SUCCEEDED':
            #print("STATUS:" + query_execution_status)
            break
        if query_execution_status == 'FAILED':
            raise Exception("STATUS:" + query_execution_status)
        else:
            #print("STATUS:" + query_execution_status)
            time.sleep(i)
    else:
        client.stop_query_execution(QueryExecutionId=query_execution_id)
        raise Exception('TIME OVER')
    
def lambda_handler(event, context):
    #SE INVOCA A LA LAMBDA QUE HACE EL CONTEO EN REDSHIFT
    if os.environ["stage"] == 'dev':
        functionName = 'DailyCount-dev'
        database = 'analytics_dev'
    else:
        functionName = 'DailyCount-prd'
        database = 'analytics_prd'

    invoke_response  = invokeLan.invoke(FunctionName=functionName, InvocationType='RequestResponse')
    data = json.loads(invoke_response['Payload'].read())
    
    #table1
    print("table1")
    table1_redshift = data['table1']
    print("Redshift: ",table1_redshift)
    query_execution_id = athenaQuery('table1',database)
    checkStatus(query_execution_id)
    result = client.get_query_results(QueryExecutionId=query_execution_id)
    table1_athena = result['ResultSet']['Rows'][1]['Data'][0]['VarCharValue']
    print("Athena:   ",table1_athena)
    
    if table1_redshift != table1_athena:
        print("NO COINCIDE TABLE1")
        sendSNS('table1')
  
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
