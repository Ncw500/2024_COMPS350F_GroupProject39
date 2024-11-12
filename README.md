# 2024_COMPS350F_GroupProject39
Based on the MVC architecture web applications：Food Tracking and Ordering

# How to run the project?

## 1. Install Node.js and npm
npm comes bundled with Node.js, so you need to install Node.js first. You can do this in several ways:

### Option A: Using Homebrew (Recommended)
If you don't have Homebrew installed, you can install it by running this command in your Terminal:

    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
After Homebrew is installed, you can install Node.js (which includes npm) by running:

    brew install node   

### Option B: Download from the Official Website
1.	Go to the Node.js official website.
2.	Download the macOS installer (choose the LTS version for stability).
3.	Run the installer and follow the instructions.

## 2. Verify the Installation
After installation, you can verify that Node.js and npm are installed correctly by checking their versions. Open your Terminal and run:

    node -v
    npm -v

You should see version numbers for both Node.js and npm.

## 3. Running npm Commands (If you have already completed the above steps before, please restart from this step.)
Now that you have npm installed, you can run npm commands. Here are some common commands:


\- Install a package: To install a package (e.g., express), run:

    npm install express body-parser cookie-session ejs mongoose multer gridfs-stream method-override


## 4. Running Project
If you have scripts defined in your package.json, you can run them using:

    npm run start

![serverRunning](/public/image/serverRunning.png)

## Folder Structure
![folderStructure](/public/image/folderStructure.png "folderStructure")


## All Functions
- Login & Sign up (Finish) 

### Customor
- Browse Menu (Processing)
- Place Order
- Track Order
- Rate Order
- Make Payment

### Restaurant
- Manage Menu Page (Processing)
    - Insert Meun (Finish)
    - Delete Menu
- Accept Order
- Update Order Status


### Delivery Man
- Accept Delivery Request
- Deliver Order
- Update Delivery Status

### Admin
- Manage Users Page (Processing)
    - Delete User (Finish)
- View Analytics
- Handle Complaints
