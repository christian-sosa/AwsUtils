import json
import boto3
import os

def lambda_handler(event, context):
    sns = boto3.client('sns')

    message = event['result']['Payload']['mensaje']

    sendError = sns.publish(
        TopicArn=os.environ['TopicArn'],
        Message=message
    )    
        
    return {
        'statusCode': 200,
        'body': json.dumps('Mensaje enviado!')
    }