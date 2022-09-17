import boto3
s3resource = boto3.resource('s3')

my_bucket = s3resource.Bucket('stnglambdaoutput')

folder = 'Paso1/' 

for object_summary in my_bucket.objects.filter(Prefix=folder):
    if (object_summary.key == folder):
        continue
    else: 
        print(object_summary.key)