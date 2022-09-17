import boto3
import os

def lambda_handler(event, context):
    sfn = boto3.client('stepfunctions')
    arnSfn = os.environ["StepArn"]
    bucket = os.environ["bucketAnalytics"]
       
    inputParams = """
            {
                "table": "table1",
                "path": "s3://"""+bucket+""""",
                "type_event": "full",
            }

        """
    
    response = sfn.start_execution(
        stateMachineArn=arnSfn,
        input=inputParams
    )

    return {
        'status': 'ok'
    }