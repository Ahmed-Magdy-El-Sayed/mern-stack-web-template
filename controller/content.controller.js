const {getReviewedContents, getMoreReviewedContents,
    getUnderReviewContents, pushContent, getContentById, 
    selectToReview, unselectToReview, setContentApproved, setContentRejected, 
    markUnvisiable, markVisiable, removeContent
} = require('../models/contents');
const {incTotleReviews, incAuthorContentNum, decAuthorContentNum} = require('../models/users'); 
const {notifyReviewerWithoutRepeat} = require("./account.controller")

const { sendEmail } = require('./sendEmail');


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

const getMoreContents = (req, res)=>{
    getMoreReviewedContents({...req.session.user,notifs:null},req.body.skip).then(contents=>{
        res.status(200).json(contents)
    }).catch(()=>{
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    });
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
        if(user.isEditor || user.isAdmin)
            incAuthorContentNum(user._id)
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
    removeContent(req.body, {...req.session.user, notifs:null}).then( ({author})=>{
        res.status(201).redirect("/")
        decAuthorContentNum(author.id)
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}
/* end the functions for myContent page */

/* start the functions for contentReview page */
let setReviewMsg;
const reviewContent = (req, res)=>{//load the page
    getUnderReviewContents(req.session.user._id).then(contents=>{
        res.render('contentReview',{contents, user: req.session.user, setReviewMsg})
        setReviewMsg = null;
    }).catch(()=>{res.status(500).render("error",{user: req.session.user, error: "internal server error"})});
}

const selectContent = (req, res)=>{
    selectToReview({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(err=>{
        console.error(err)
        res.status(500).end()
    })
}

const unselectContent = (req, res)=>{
    unselectToReview(req.body).then(()=>{
        res.status(201).end()
    }).catch(err=>{
        console.error(err)
        res.status(500).end()
    })

}

const approveContent = (req, res)=>{
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    setContentApproved(req.body).then( data=>{
        if(!data){
            res.status(500).render("error", {error: "Internal server error"})
            return null
        }
        setReviewMsg = "The content approved successfully"
        res.status(201).redirect("/content/review")
        incTotleReviews(req.session.user._id)
        incAuthorContentNum(data.authorID)
        sendEmail(
            data.email, 
            {
                title:"Your Content Is Approved", 
                content:`<p>${data.notif.msg}
                <a href='${req.protocol + '://' + req.get('host')}${data.notif.href}'>click here</a> to go to the content
                </p>`
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
        if(!data){
            res.status(500).render("error", {error: "Internal server error"})
            return null
        }
        setReviewMsg = "The content rejected successfully"
        res.status(201).redirect("/content/review")
        incTotleReviews(req.session.user._id)
        sendEmail(
            data.email, 
            {
                title:"Your Content Is Rejected", 
                content:`
                <p>${data.notif.msg}
                <a href='${req.protocol + '://' + req.get('host')}${data.notif.href}'>click here</a> to go to content page
                </p>
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
    getHome, getContent, getMoreContents,
    addContent, hideContent, showContent,
    deleteContent, reviewContent, 
    selectContent, unselectContent,
    approveContent, rejectContent
};