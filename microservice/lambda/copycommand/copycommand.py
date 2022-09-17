import time
import os
import psycopg2
import base64
from datetime import datetime

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

def compose_query(table, path, role):
    query_dict = {"delete": f"TRUNCATE TABLE {table}", "copy": f"COPY {table} FROM '{path}' IAM_ROLE '{decode64(role)}' FORMAT AS PARQUET"}
    return query_dict

def lambda_handler(event, context):
    db_connection = get_conn(os.environ)
    table = event['table']
    path = event['path']
    role = os.environ['REDSHIFT_ROLE']
    print("table: ", table)
    print("path: ", path)

    query = compose_query(table, path, role)
    print(query)

    status = execute_query(db_connection, query)


    return {
        "status": status
    }