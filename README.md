Full-Stack Web App Template

Tech: MERN Stack, Redux, Bootstrap, Socket.io, React Router v7

Demo: https://excessive-daphna-amcodes-bd8ff04d.koyeb.app/

📖 Description

  A full-featured template for content platforms, marketplaces, and community-driven apps, with role-based access and CMS features.

✨ Features

  - REST APIs with Express.js
  - Authentication with sessions, email verification, password recovery + OAuth
  - Role-based UI: Admin, Editor, Author, User
  - Dashboards for content creation, moderation, and account control
  - Nested comments with replies, likes/dislikes
  - Real-time notifications (web + email)
  - React Router v7 protected & dynamic routes
  - Dark/Light mode toggle

 Repo Structure
 
  - Frontend & Backend Folders: MERN Stack seperated servers (client & server)
  - MERN Folder: Single server for frontend and backend (Node.js with React.js Built)
  - MEN Folder (old version): PugJS instead of React.js

📖 User Guide
 ** User Registration and Authentication
    - Registration:
        1- Navigate to the registration page.
        2- Fill in the required fields.
        3- Click the "Signup" button, the browser will navigate you to the verification page.
        4- Check your email for a verification code message and click on it to verify your account.
    - Email Verification:
        1- After registration, an email will be sent to the provided email address.
        2- Copy the verification code and paste it into the verification page. 
        3- Click the "Verify" button.  
    - Password Recovery: 
        1- Navigate to the login page and click on “Forgot Password”.
        2- Enter your registered email address and click “Submit”.
        3- Check your email for a password reset link and follow the instructions to reset your password.

  ** User Roles and Permissions
    - Author: Can create content, submit for review, and delete comments on their content.
    - Editor: Can review and approve/reject content, add new content directly, and delete comments on any content.
    - Admin: Can control all accounts, send warnings, ban/delete accounts, and change user roles.

  ** Main Bar Navigation
    - Logo: Link to the home page.
    - Page Links: Links to different sections of the app.
    - Notifications: View notifications.
    - Account Settings: Access and update account settings.
    - Logout: Log out of the app.

  ** Home Page
    - Slider: view custom slides that admins/editors are adding
    - Content Display:  start with the last added

  ** Profile Page
    - For Authors contains: 
      section for Contents that are approved
      section for content under review
      section for adding content
    - For admins/editors contains: the same as authors but without content under the review section
    - For normal users: it is empty for any upcoming features
  ** Content Page
    - Content Details: Viewing content details.
    - Hide/Delete Content: Options to hide or delete content.
    - Visitor Count: Viewing the number of visitors.
    - Comment Section: Liking, disliking, loving, editing, deleting, and replying to comments.
    - Content Review: Approving or rejecting content by editors or admins.

  ** Account Control Page
    - Search Accounts By Name
    - Managing Accounts: warning, ban, and delete

  ** Content Control Page
    - Slider Control: add, delete, arrange
    - Content Selected To Review
    - Content Waiting To Review
    Slider Control: add, delete, arrange
    Content Selected To Review
    Content Waiting To Review
