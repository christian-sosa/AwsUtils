copy_source = {'Bucket': key_bucket, 'Key': object_key}
bucket = s3.Bucket(key_bucket)
# Copying the files to another folder
path = f"costos_marginales/en_linea/year={str(int(yearToday))}/month={str(int(monthToday))}/day={str(int(dayToday))}/{file}"
bucket.copy(copy_source, path)