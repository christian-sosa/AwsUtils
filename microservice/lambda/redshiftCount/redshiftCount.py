import os
import psycopg2
import base64

def decode64(string):
    base64_bytes = string.encode("utf-8")  
    sample_string_bytes = base64.b64decode(base64_bytes)
    sample_string = sample_string_bytes.decode("utf-8")
    return sample_string

def execute_query(conn, query):
    try:
        resultados = []
        cursor = conn.cursor()
        cursor.execute(query["generacionprogramada"])
        resultados.append(cursor.fetchone())
        cursor.execute(query["generacionreal"])
        resultados.append(cursor.fetchone())
        print(resultados)
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
        return status , resultados
        

def get_conn(redshift_credentials):
    try:
        conn_string = f"dbname='{redshift_credentials['REDSHIFT_DBNAME']}' port='{decode64(redshift_credentials['REDSHIFT_PORT'])}' user='{decode64(redshift_credentials['REDSHIFT_USER'])}' password='{decode64(redshift_credentials['REDSHIFT_PASS'])}' host='{decode64(redshift_credentials['REDSHIFT_HOST'])}'"
        conn = psycopg2.connect(conn_string)
        return conn
    except:
        raise Exception("ERROR: Couldn't connect to Redshift cluster")


def compose_query():
    query_dict = {
        "table1": f"select count(*) from table1",
        "table2": f"select count(*) from table2",
    }
    return query_dict


def lambda_handler(event, context):
    db_connection = get_conn(os.environ)
    query = compose_query()
    print(query)
    status , resultados = execute_query(db_connection, query)
    
    valores = []
    for result in resultados:
        stringFix = str(result)
        stringFix = stringFix.replace("(","")
        stringFix = stringFix.replace(")","")
        stringFix = stringFix.replace(",","")
        valores.append(stringFix)
    
    message = f"table1 Programada: {valores[0]}\ntable2: {valores[1]}\n"
    print(message)
    
    return {
        "status": status,
        "mensaje": message,
        "table1": valores[0],
        "table2": valores[1],
    }