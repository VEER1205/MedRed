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
            port = 4000
        )
        print("Connection to MySQL DB successful")
    except connector.Error as e:
        print(f"The error '{e}' occurred")
    return connection

conn = createConnection()
cus = conn.cursor(dictionary=True)

def getUser(email):
    query = "SELECT email,password,userId,fname,lname,password FROM USERS WHERE email = %s"
    cus.execute(query, (email,))
    return cus.fetchone()



def createUser(fname, lname, email, password):
    try:
        userId = str(uuid.uuid4())
        query = "INSERT INTO USERS (userId, fname, lname, email, password) VALUES (%s, %s, %s, %s, %s)"
        cus.execute(query, (userId, fname, lname, email, password))
        conn.commit()
        
        # Return userId along with success message
        return {"msg": "User created successfully", "userId": userId}
    except Exception as e:
        return {"error": str(e), "msg": "Failed to create user"}

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
        query = """
        UPDATE USERS 
        SET  medicalConditions = %s, bloodGroup = %s, allergies = %s,mobileNumber=%s,emergencyContactNumber=%s,birthDate=%s, gender = %s
        WHERE userId = %s
        """
        cus.execute(query, (medicalConditions, bloodGroup, allergies, mobileNumber, emergencyContactNumber, birthDate, gender, userId))
        conn.commit()
        query2 = """
        UPDATE ADDRESS  
        SET streetAddress = %s, city = %s, state = %s, pinCode = %s, country = %s
        WHERE userId = %s
        """
        cus.execute(query2, (streetAddress, city, state, pinCode, country, userId))
        conn.commit()
        return {"msg": "User updated successfully"}
    except Exception as e:
        return {"error": str(e), "msg": "Failed to update user"}

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
"""