# Totally Real Timecard System
http://totally-real-authentication.herokuapp.com/

## Info
Login using username/password:
- 1 / 1 - Supervisor (Accesses the manager dashboard)
- 2 / 2 - Employee (Accesses the punch in/punch out functionality)

## Resource
___
### employeeDB
- employees
	- _id (Object ID)
	- fName (String)
    - lName (String)
	- id (Number)
	- payRate (Number)
    - encryptedPassword (String)
    - supervisor (Boolean)
    - timecards (Array)
        - date (String)
        - startTime (String)
        - endTime (String)


## REST Endpoints
___
Name                           | Method | Path
-------------------------------|--------|------------------
Retrieve employees collection  | GET    | /employees
Create employees member        | POST   | /employees
Delete employees member        | DELETE | /employees
Update employees member        | PUT    | /employees/*\<databaseId\>*
Create timecard for employee   | POST   | /timecards/*\<databaseId\>*
Delete timecard for employee   | DELETE | /timecards/*\<databaseId\>*
Update timecard for employee   | PUT    | /timecards/*\<databaseId\>*
Get list of active employees   | GET    | /activities
Get active status for employee | GET    | /activities/*\<employeeId\>*
Create activity for employee   | POST   | /activities
Delete activity for employee   | DELETE | /activities/*\<employeeId\>*
Create session                 | POST   | /session
Get session                    | GET    | /session
Logout of session              | POST   | /logout