This is a FDLA course project

Name: Lukas Daude-Eichholtz
Matrikelnummer: 7424067


----------------------------
Follow these steps to set up and run the app:

**Clone the Repository:**
git clone https://github.com/lde-git/FDLA.git

**Install Dependencies:**
npm install

**Set up MySQL Database**
    Create Database 
    
    table should be created automatically but if not:
    Create table named 'events' with colums 'name' (VARCHAR) and 'date' (DATE)

**Create .env File** 
    DB_HOST=your_database_host
    DB_USER=your_database_user
    DB_PASSWORD=your_database_password
    DB_NAME=your_database_name

________________________________________________________________
http://localhost:3000/add-event to add event
http://localhost:3000/atom-feed for ATOM-Feed of the stored events
