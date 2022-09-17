import os
import psycopg2
import base64
import time

def decode64(string):
    base64_bytes = string.encode("utf-8")  
    sample_string_bytes = base64.b64decode(base64_bytes)
    sample_string = sample_string_bytes.decode("utf-8")
    return sample_string
     
def execute_query(conn, query):
    try:
        cursor = conn.cursor()
        if(query["delete"] != False):
            cursor.execute(query["delete"])
            time.sleep(2)
        cursor.execute(query["copy"])
        conn.commit()
        status = 'success'
    except Exception as e:
        status = 'failed'
        conn.close()
        conn = None
        print(e)
        raise(e)
    finally:
        if cursor and cursor.closed is False:
            cursor.close()
            print("se cierra el cursor")
        if conn and conn.closed == 0:
            conn.close()
            conn = None
            print("se cierra la conexion")
        return status
        

def get_conn(redshift_credentials):
    try:
        conn_string = f"dbname='{redshift_credentials['REDSHIFT_DBNAME']}' port='{decode64(redshift_credentials['REDSHIFT_PORT'])}' user='{decode64(redshift_credentials['REDSHIFT_USER'])}' password='{decode64(redshift_credentials['REDSHIFT_PASS'])}' host='{decode64(redshift_credentials['REDSHIFT_HOST'])}'"
        conn = psycopg2.connect(conn_string)
        return conn
    except:
        raise Exception("ERROR: Couldn't connect to Redshift cluster")


def compose_query(table, path, role,fecha):
    query_dict = {"delete": f"delete from {table} where fecha LIKE '{fecha}%'", "copy": f"COPY {table} FROM '{path}' IAM_ROLE '{decode64(role)}' manifest FORMAT AS PARQUET"}
    return query_dict

def lambda_handler(event, context):
    fecha = event['Payload']['fecha']
    anho = event['Payload']['anho-inicio']
    count = event['Payload']['count']
    bucketAnalytics = os.environ["bucketAnalytics"]
    table = event['Payload']['table']
    role = os.environ['REDSHIFT_ROLE']
    path = 's3://'+bucketAnalytics+'/manifest/'+table+'.manifest'
    db_connection = get_conn(os.environ)
    query = compose_query(table, path, role , fecha)
    print(query)
    status = execute_query(db_connection, query)

    
    anho -= 1
    count -= 1

    return {
        "status": status,
        'count': count,
        'anho-inicio': anho
    }