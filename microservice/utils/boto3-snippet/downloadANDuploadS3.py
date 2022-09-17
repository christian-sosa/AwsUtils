import boto3
import os


def lambda_handler(event, context):
    s3 = boto3.resource('s3')
    s3_client = boto3.client('s3')

    key_bucket = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']

    local_file_name = f"/tmp/{object_key}"


    print("downloadPath:", object_key)
    s3.Bucket(key_bucket).download_file(object_key, local_file_name)

	bucketDestino = 'bucket'
    response = s3_client.upload_file(local_file_name, bucketDestino, object_key)
    return {
        'statusCode': 200,
        'message': 'success'
    }