import boto3

s3 = boto3.client('s3')

get_last_modified = lambda obj: int(obj['LastModified'].strftime('%s'))
objs = s3.list_objects_v2(Bucket='bucket', Prefix='ruta' )['Contents']
last_added = [obj['Key'] for obj in sorted(objs, key=get_last_modified, reverse= True)][0]