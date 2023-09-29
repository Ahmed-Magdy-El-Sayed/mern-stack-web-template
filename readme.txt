**To run the app**:
1. Install node.js and mongodb.
2. Go to the drive where MongoDB is installed (by default C:\) and create a folder named "data". Inside it, create another folder named "db".
3. In the `app.js` file (line 11) and `models/dbConnect.js` file (line 7), change the database URI name to your database name. 
    In `app.js` (line 20), change the secret. 
    In `controller/sendEmail.js` (lines 8, 9, and 16), add your email and app password.
4. Open the terminal:
    - Inside it, go to the directory of the MongoDB installation (the default path is "C:\Program Files\MongoDB\Server\6.0\bin") and run this command to start the server: `mongod --ipv6`.
    - Open another terminal with the directory of the app. Run:
        - `npm install` to install the app packages.
        - `node app.js` to run the app.

** App Description **
The script was built using the MVC architecture, which separates concerns into models, views, and controllers. 

	The app.js file contains the code to run the server using Express.js and the main routes to move to and sockets to update the user page without reloading it and connect the assets and user session. 
	The Router folder contains specific routes that receive requests and provide the middlewares and the function from the controller to respond. 
	The Controller folder contains functions to process requests, gets data from model functions, and provide the response while rendering web pages. 
	The Middlewares folder contains conditions to decide whether to continue to controller function or redirect to another route. 
	The Model folder contains functions that provide data from the database. 
    The View folder contains pages to view using PugJS. 
	The assets folder contains CSS, JavaScript, and image files.

**Notes**:
- The functionality of loading more elements on the same page requires repeating the HTML of the elements.
- If you change the code in the PugJS files, you may need to apply these changes in some JS files as follows:
    1. Change in `views/pages/home.pug` requires a change in `assets/js/home.js`.
    2. Change in `views/comment.pug` requires changes in `controller/createCommentHTML.js`, `assets/js/content/commentSockit.js`, and `assets/js/content/loggedInCommentOptions.js` (function: replyComment).
    3. Change in `views/accountControlCard.pug` requires changes in `assets/js/accountControl.js` (functions: createAccountHTML, sendBan, and unBan).
    4. Change in `views/main.pug` (notification part) requires a change in `assets/js/main.js`.

To add your content, you will mainly work in:
1. `models/contents.js`: Add the details of the content.
2. `views/pages/myContent.pug`: Where the content will be added.
3. `views/pages/contentReview.pug`: Where the contents to review will be displayed.
4. `views/pages/content.pug`: Where the details of the content will be shown.
5. `views/pages/home.pug`: Where the contents will be viewed.

6. `views/pages/main.pug`: Add links of your new pages.
7. `app.js`: Add more routers.
8. `routers/content.rout`.
Is there anything else you need help with?