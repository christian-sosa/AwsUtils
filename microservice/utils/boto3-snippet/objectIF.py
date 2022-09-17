def sendSlack(user):
    print('slack: ',user)

def sendEmail(user):
    print('email: ',user)

def sendSms(user):
    print('sms: ',user)

def sendNotification(user):
    """
    if user == 'slack':
        sendSlack(user)
    elif user == 'email':
        sendEmail(user)
    elif user == 'sms':
        sendSms(user)
    """ 

    ### Esto reemplaza a lo de arriba 
    notificationType = {
        'email': sendEmail,
        'sms': sendSms,
        'slack': sendSlack
    }
    aux = notificationType[user]
    aux(user)

sendNotification('slack')

