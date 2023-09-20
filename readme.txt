To run the app:-
    You can see this video or follow the following steps:
    1. Install node.js and mongodb 
    2. Go to the drive that install mongodb in (by default C:\) then create folder with name "data", then inside it create another folder with name "db"
    3. open the terminal and 
        1.inside it go to the directory of the mongodb installation (the default path "C:\Program Files\MongoDB\Server\6.0\bin")
            and run this command to start the server "mongod --ipv6"
        2. open another terminal and in it go to the directory of the app then run 
            "npm install" to install the app packages
            "node app.js" to run the app

Notes:-
    The functionality of loading more elements in the same page required to repeat the html of the elements.
    so if you change the code in the pugJS files you may need to apply this changes in some js files as follows:
        1. (chnage in)--> views\pages\home.pug (required change in)--> assets/js/home.js
        2. views\comment.pug ----> controller\createCommentHTML.js
                             ----> assets\js\content\commnetSockit.js
                             ----> assets\js\content\loggedInCommentOptions.js (function: replyComment)
        3. views\accountControlCard.pug ----> assets\js\accountControl.js (functions: createAccountHTML, sendBan, and unBan)
        4. views\main.pug (notification part) ---> assets\js\main.js
        
    To add your content, you will work mainly in:
        1. models\contents.js --> add the details of the content
        2. views\pages\myContent.pug --> where the content be added
        3. views\pages\contentReview.pug --> where the contents to review will shown
        4. views\pages\content.pug --> where the details of the content
        5. views\pages\home.pug --> where the contents be viewed
        
        6. views\pages\main.pug --> add links of your new pages
        7. controller\content.controller.js --> add more functions
        8. routers\content.router.js --> add more routs
        9. app.js --> add more routers