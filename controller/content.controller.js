const {getReviewedContents, getUnderReviewContents, 
    pushContent, getContentById, getContentByAuthorId,
    setContentApproved, setContentRejected, markUnvisiable,
    markVisiable, removeContent
} = require('../models/contents');

const {notifyReviewerWithoutRepeat} = require("./account.controller")
const { sendEmailNotification } = require('./sendEmail');


let profileEditErr;
const getHome = (req, res)=>{//load the home page
    getReviewedContents().then(contents=>{
        const warning = req.session.warning
        if(warning){
            req.session.warning = null;
        }
        res.render('home',{contents, user: req.session.user, profileEditErr, warning})
        profileEditErr = null;
    }).catch(()=>{res.status(500).render("error",{user: req.session.user, error: "internal server error"})});
}

const getContent = (req, res) =>{// load the content page when user click on the content in home, myContent, or contentReview page
    const user = req.session.user;
    const normalUser = user? user.isAuthor? false: user.isEditor? false: user.isAdmin? false: true : true; // prevente increase views number if the req owner admin or editor or author
    if(!req.params.id.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    getContentById({id: req.params.id, normalUser}).then(content=>{
        res.render('content',{content, user: req.session.user})
    }).catch(err=>{
        console.log(err)
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    });
}

/* start the functions for myContent page */
const getContentsByAuthor = (req, res)=>{//load myContent page
    getContentByAuthorId(req.session.user._id).then(contents=>{
        const groupedContents = {underReview:[], reviewed: []};
        contents.forEach(content => {
            groupedContents[content.isUnderReview? "underReview" : "reviewed"].push(content)
        });
        res.render('myContent',{contents: groupedContents, user: req.session.user})
    }).catch(()=>{res.status(500).render("error",{user: req.session.user, error: "internal server error"})});
}

const addContent = (req, res)=>{
    const user = req.session.user;
    const author = {
        id: user._id,
        name: user.name,
        img: user.img,
        role: user.isAuthor? "author" : user.isEditor? "editor":"admin" 
    }
    pushContent({...req.body, author}).then( ()=>{
        notifyReviewerWithoutRepeat("there are new contents to review", {contentName: req.body.name, authorName: author.name, root:req.protocol + '://' + req.get('host')})//send notification of new content to review, and not add it if there is previous notification with the same body (their is new content to review) and not readed
        res.status(201).redirect(req.get('Referrer'))
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}
const hideContent = (req, res)=>{
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    markUnvisiable({...req.body, userID: req.session.user._id}).then( ()=>{
        res.status(201).redirect(req.get('Referrer'))
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}

const showContent = (req, res)=>{
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    markVisiable({...req.body, userID: req.session.user._id}).then( ()=>{
        res.status(201).redirect(req.get('Referrer'))
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}

const deleteContent = (req, res)=>{
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    removeContent({...req.body, userID: req.session.user._id}).then( ()=>{
        res.status(201).redirect("/")
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}
/* end the functions for myContent page */

/* start the functions for contentReview page */
let setReviewMsg;
const reviewContent = (req, res)=>{//load the page
    getUnderReviewContents().then(contents=>{
        res.render('contentReview',{contents, user: req.session.user, setReviewMsg})
        setReviewMsg = null;
    }).catch(()=>{res.status(500).render("error",{user: req.session.user, error: "internal server error"})});
}

const approveContent = (req, res)=>{
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    setContentApproved(req.body).then( data=>{
        setReviewMsg = "The content approved successfully"
        res.status(201).redirect("/content/review")
        sendEmailNotification(
            data.email, 
            {
                title:"Your Content Is Approved", 
                content:`<p>${data.notif.msg} <a href='${req.protocol + '://' + req.get('host')}${data.notif.href}'>click here</a> to go to the content</p>`
            }
        )
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}

const rejectContent = (req, res)=>{
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    setContentRejected(req.body).then( data=>{
        setReviewMsg = "The content rejected successfully"
        res.status(201).redirect("/content/review")
        sendEmailNotification(
            data.email, 
            {
                title:"Your Content Is Rejected", 
                content:`
                <p>${data.notif.msg}</p>
                <a href='${req.protocol + '://' + req.get('host')}${data.notif.href}'>click here</a> to go to content page
                `
            }
        )
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}
/* end the functions for contentReview page */

module.exports={
    getHome, getContent,
    getContentsByAuthor, addContent, 
    hideContent, showContent,
    deleteContent, reviewContent, 
    approveContent, rejectContent
};