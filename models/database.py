from mysql import connector
from controller import auth
from config import settings
import uuid

def createConnection():
    connection = None
    try:
        connection = connector.connect(
            host=settings.HOST_NAME,
            user=settings.USER_NAME,
            password=settings.USER_PASSWORD,
            database=settings.DB_NAME,
            port = 4000,
            ssl_disabled=False
        )
        print("Connection to MySQL DB successful")
    except connector.Error as e:
        print(f"The error '{e}' occurred")
    return connection


def getUser(email):
    conn = createConnection()
    cus = conn.cursor(dictionary=True)
    query = "SELECT email,password,userId,fname,lname,password FROM USERS WHERE email = %s"
    cus.execute(query, (email,))
    return cus.fetchone()

def getUserForDashboard(userId):
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "SELECT * FROM USERS WHERE userId = %s"
        cus.execute(query, (userId,))
        user = cus.fetchone()
        user.pop("password", None)  # Remove password field

        query2 = "SELECT * FROM ADDRESS WHERE userId = %s"
        cus.execute(query2, (userId,))
        address = cus.fetchone()
    
        query3 = "SELECT * FROM remainders WHERE userId = %s"
        cus.execute(query3, (userId,))
        reminders = cus.fetchall()
        return {"user": user, "address": address, "reminders": reminders}
    except Exception as e:
        return {"error from database": str(e)}

def createUser(fname, lname, email, password):
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        userId = str(uuid.uuid4())
        query = "INSERT INTO USERS(userId, fname, lname, email, password) VALUES (%s, %s, %s, %s, %s)"
        cus.execute(query, (userId, fname, lname, email, password))
        conn.commit()
        
        # Return userId along with success message
        return {"msg": "User created successfully", "userId": userId}
    except Exception as e:
        return {"error from database": str(e), "msg": "Failed to create user"}

def updateUser(
            userId,
            mobileNumber,
            emergencyContactNumber,
            birthDate,
            city,
            gender,
            streetAddress,
            state,
            pinCode,
            country,
            bloodGroup,
            medicalConditions=None,
            allergies=None):
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = """
        UPDATE USERS 
        SET  medicalConditions = %s, bloodGroup = %s, allergies = %s, mobileNumber=%s,emergencyContactNumber=%s,birthDate=%s, gender = %s
        WHERE userId = %s
        """
        cus.execute(query, (medicalConditions, bloodGroup, allergies, mobileNumber, emergencyContactNumber, birthDate, gender, userId))
       
        print("User table updated")
        query2 = """
        insert into ADDRESS (streetAddress, city, state, pinCode, country, userId)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        streetAddress = %s, city = %s, state = %s, pinCode = %s, country = %s
        """
        cus.execute(query2, (streetAddress, city, state, pinCode, country, userId, streetAddress, city, state, pinCode, country))
        conn.commit()
        print("Address table updated")
        return {"msg": "User updated successfully"}
    except Exception as e:
        return {"error": str(e), "msg": "Failed to update user"}

# def createReminder(userId,medicineName,dosage,time) -> dict:
#     try:
#         conn = createConnection()
#         cus = conn.cursor(dictionary=True)
#         reminderId = str(uuid.uuid4())
#         query = "INSERT INTO remainders (reminderId, userId, medicineName, dosage, time) VALUES (%s, %s, %s, %s, %s)"
#         cus.execute(query, (reminderId, userId, medicineName, dosage, time))
#         conn.commit()
#         return {"success": True , "msg": "Reminder created successfully"}
#     except Exception as e:
#         return {"error": str(e), "msg": "Failed to create reminder"}

def getReminders(time):
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "SELECT * FROM remainders WHERE time = %s"
        cus.execute(query, (time,))
        return cus.fetchall()
    except Exception as e:
        return {"error": str(e), "msg": "Failed to get reminders"}

def getUserReminders(userId):
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "SELECT * FROM remainders WHERE userId = %s"
        cus.execute(query, (userId,))
        return cus.fetchall()
    except Exception as e:
        return {"error": str(e), "msg": "Failed to get user reminders"}

def deleteReminder(reminderId):
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "DELETE FROM remainders WHERE reminderId = %s"
        cus.execute(query, (reminderId,))
        conn.commit()
        return {"msg": "Reminder deleted successfully"}
    except Exception as e:
        return {"error": str(e), "msg": "Failed to delete reminder"}

def getUserById(userId):
    """Get user details by ID"""
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "SELECT userId, fname, lname, mobileNumber, email, bloodGroup, emergencyContactNumber, allergies, medicalConditions FROM USERS WHERE userId = %s"
        cus.execute(query, (userId,))
        result = cus.fetchone()
        return result
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def getReminderById(reminderId):
    """Get reminder details by ID"""
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "SELECT reminderId, userId, medicineName, dosage, time FROM remainders WHERE reminderId = %s"
        cus.execute(query, (reminderId,))
        result = cus.fetchone()
        return result
    except Exception as e:
        print(f"Error getting reminder: {e}")
        return None

def updateReminder(reminderId, medicineName, dosage, time):
    """Update reminder"""
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = "UPDATE remainders SET medicineName = %s, dosage = %s, time = %s WHERE reminderId = %s"
        cus.execute(query, (medicineName, dosage, time, reminderId))
        conn.commit()
        return {"msg": "Reminder updated successfully", "success": True}
    except Exception as e:
        conn.rollback()
        print(f"Error updating reminder: {e}")
        return {"error": str(e), "msg": "Failed to update reminder", "success": False}

def getAllActiveReminders():
    """Get all active reminders with user phone numbers (for loading on startup)"""
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        query = """
        SELECT r.reminderId, r.userId, r.medicineName, r.dosage, r.time, u.mobileNumber
        FROM remainders r
        JOIN USERS u ON r.userId = u.userId
        WHERE u.mobileNumber IS NOT NULL AND u.mobileNumber != ''
        """
        cus.execute(query)
        results = cus.fetchall()
        return results
    except Exception as e:
        print(f"Error getting all reminders: {e}")
        return []

# Update createReminder to return reminderId
def createReminder(userId, medicineName, dosage, time) -> dict :
    try:
        conn = createConnection()
        cus = conn.cursor(dictionary=True)
        reminderId = str(uuid.uuid4())
        query = "INSERT INTO remainders (reminderId, userId, medicineName, dosage, time) VALUES (%s, %s, %s, %s, %s)"
        cus.execute(query, (reminderId, userId, medicineName, dosage, time))
        conn.commit()
        return {"msg": "Reminder created successfully", "reminderId": reminderId, "success": True}
    except Exception as e:
        conn.rollback()
        print(f"Error creating reminder 1: {e}")
        return {"error": str(e), "msg": "Failed to create reminder", "success": False}

"""
userId VARCHAR(50) PRIMARY KEY,
  fname VARCHAR(50) NOT NULL,
  lname VARCHAR(50) NOT NULL,
  mobileNumber DECIMAL(10) UNIQUE,
  email VARCHAR(50) UNIQUE NOT NULL,
  gender ENUM("male","female"),
  bloodGroup ENUM("A+","A-","B+","B-","AB+","AB-","O+","O-"),
  emergencyContactNumber DECIMAL(10),
  allergies VARCHAR(200),
  medicalConditions VARCHAR(200),

  streetAddress VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  pinCode INT,
  country VARCHAR(100),

  userId VARCHAR(50),
  medicineName VARCHAR(100),
  dosage VARCHAR(100),
  time VARCHAR(100)
"""