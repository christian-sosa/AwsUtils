invokeLan = boto3.client("lambda",region_name = "us-east-1")

#ASYNC
invoke_response  = invokeLan.invoke(FunctionName=functionName, InvocationType='RequestResponse')
data = json.loads(invoke_response['Payload'].read())


#SYNC
payload = {"Placa": row['Placa'],"Unidad": row['Unidad'],"Url": folder }
invokeLan.invoke(FunctionName='DescargaCsvPlaca', InvocationType='Event', Payload=json.dumps(payload))