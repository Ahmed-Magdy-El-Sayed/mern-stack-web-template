const fspromise = require("fs").promises
const path = require('path');

const {getLastAddedContents, getMoreLastContents,
    getUnderReviewContents, pushContent, getContentById, 
    selectToReview, unselectToReview, getContentsByName, 
    setContentApproved, setContentRejected, 
    markUnvisiable, markVisiable, updateContent,
    removeContent
} = require('../models/contents');
const {incTotleReviews, incAuthorContentNum, decAuthorContentNum} = require('../models/users'); 
const {uniqueNotifyReviewers} = require("./account.controller")

const { sendEmail } = require('./sendEmail');
const validateId = require('./validateId');
const sharp = require("sharp");
const { unlink, existsSync } = require("fs");

const getContents = (req, res, next)=>{//get the home page content
    getLastAddedContents(req.session.user).then(async contents=>{
        res.status(200).json({contents, sliderContents: JSON.parse(await fspromise.readFile(path.join(__dirname,"sliderContents.json"), "utf-8"))})
    }).catch(err=> next(err));
}

const getMoreContents = (req, res, next)=>{
    getMoreLastContents(req.session.user, req.body.skip).then(contents=>{
        res.status(200).json(contents)
    }).catch(err=> next(err));
}

const getContent = (req, res, next) =>{// get the content details
    const user = req.session.user;
    const normalUser = user? user.authz.isAuthor? false: user.authz.isEditor? false: user.authz.isAdmin? false: true : true; // prevente increase views number if the req owner admin or editor or author
    const id = req.params.id
    if(!validateId(id))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    const visited = req.cookies.visited
    if(!visited?.includes(id))
        res.cookie('visited', visited?[...visited, id]:[id], { maxAge: 90*60*60*24, httpOnly: true/* , secure: true, sameSite: "none" */ });
    getContentById({id: id, normalUser, increaseViews: !visited?.includes(id)})
    .then(content=>{
        if(!content) res.status(404).json({msg: "Content not exist!"})
        else res.status(200).json(content)
    }).catch(err=> next(err))
}

/* start the functions for profile page */
const addContent = (req, res, next)=>{
    const user = req.session.user;
    const author = {
        id: user._id,
        name: user.name,
        img: user.img,
        role: user.authz.isAuthor? "author" : user.authz.isEditor? "editor":"admin" 
    }
    const imageName = req.file?.originalname.split(".").slice(1).join(".")
    //next resizing the image to remove malicious
    if(imageName)
        sharp(req.file.path)
        .resize(500,500, {fit: "inside"}).toFile(path.join(__dirname,"..","images", "content", imageName))
        .then(()=>{
            unlink(req.file.path, err=>{
                if(err)
                    console.log(err)
            })
            pushContent({...req.body, img: imageName, author}).then( content=>{
                if(user.authz.isAuthor)//send notification of new content to review, and not add it if there is previous notification with the same body and not readed
                uniqueNotifyReviewers("there are new contents to review", {contentName: req.body.name, authorName: author.name, root:req.protocol + '://' + req.get('origin')})
                res.status(201).json(content)
                incAuthorContentNum(user._id)
            }).catch(err=> next(err))
        })
        .catch(err=> next(err))
    else
        pushContent({...req.body, author}).then( content=>{
            if(user.authz.isAuthor)//send notification of new content to review, and not add it if there is previous notification with the same body and not readed
            uniqueNotifyReviewers("there are new contents to review", {contentName: req.body.name, authorName: author.name, root:req.protocol + '://' + req.get('origin')})
            res.status(201).json(content)
            incAuthorContentNum(user._id)
        }).catch(err=> next(err))
}
const hideContent = (req, res, next)=>{
    if(!validateId(req.body.contentID))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    markUnvisiable({...req.body, userID: req.session.user._id}).then( ()=>{
        res.status(201).end()
    }).catch(err=> next(err))
}

const showContent = (req, res, next)=>{
    if(!validateId(req.body.contentID))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    markVisiable({...req.body, userID: req.session.user._id}).then( ()=>{
        res.status(201).end()
    }).catch(err=> next(err))
}

const editContent = async(req, res, next)=>{
    const imageName= req.file?.originalname.split(".").slice(1).join(".");
    let continueToNext;
    if(imageName)//next resizing the image to remove malicious
        await sharp(req.file.path)
        .resize(500,500, {fit: "inside"}).toFile(path.join(__dirname, "..", "images", "content", imageName))
        .then(()=>{
            unlink(req.file.path, err=>{
                if(err)
                    throw err
            })
            continueToNext = true
        })
        .catch(err=>{
            next(err)
            continueToNext = false;
        })
    else continueToNext = true
    if(continueToNext){
        const newContent = {...req.body};
        delete newContent.contentID;
        newContent.img = imageName;
        updateContent({newContent, contentID: req.body.contentID, userID: req.session.user._id}).then(({newContent, oldImg})=>{
            const imgPath = path.join(__dirname, "..", "images", "content", oldImg);
            if(imageName && oldImg !== "content.png" && existsSync(imgPath))
                unlink(imgPath, err=>{
                    if(err)
                        throw err
                })
            res.status(201).json(newContent)
        }).catch(err=> next(err))
    }
    
}

const deleteContent = (req, res, next)=>{
    if(!validateId(req.body.contentID))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    removeContent(req.body, {...req.session.user, notifs:null}).then( ({author, img})=>{
        decAuthorContentNum(author.id)
        const imgPath = path.join(__dirname, "..", "images", "content", img);
        if(img !== "content.png" && existsSync(imgPath))
            unlink(imgPath, err=>{
                if(err)
                    console.error(err)
            })
        res.status(201).end()
    }).catch(err=> next(err))
}
/* end the functions for profile page */

/* start the functions for contentControl page */
let setReviewMsg;
const getContentControl = (req, res, next)=>{//get the page data
    getUnderReviewContents(req.session.user._id).then(async contents=>{
        res.status(200).json({
            contents, 
            sliderContents: JSON.parse(await fspromise.readFile(path.join(__dirname,"sliderContents.json"), "utf-8")), 
            msg: setReviewMsg
        })
        setReviewMsg = null;
    }).catch(err=> next(err))
}

const selectContent = (req, res, next)=>{
    selectToReview({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(err=> next(err))
}

const unselectContent = (req, res, next)=>{
    unselectToReview(req.body).then(()=>{
        res.status(201).end()
    }).catch(err=> next(err))
}

const searchContent = (req, res, next)=>{
    getContentsByName(req.query.name).then(contents=>{
        if(req.query.name.length > 1){
            const mostMatched = contents.filter(acc=>acc.name.match(new RegExp("^"+req.query.name,"gi")))
            const lessMatched = contents.filter(acc=>acc.name.match(new RegExp(".+"+req.query.name,"gi")))
            const remindedContents = contents.filter(acc=>!acc.name.match(new RegExp(req.query.name,"gi")))
            contents = mostMatched.concat(lessMatched).concat(remindedContents)// we made 3 filters to make the most relevent contents at the frist
        }
    res.status(200).json(contents)
    }).catch(err=> next(err))
}

const updateSlider = async (req, res, next)=>{
    const sliderContents = JSON.parse(req.body.data)
    if(req.files.length)//next resizing the image to remove malicious
        await req.files.forEach(file=>{
            const imageName = file.originalname.split(".").slice(1).join(".")
            sharp(file.path)
            .resize(500,500, {fit: "inside"}).toFile(path.join(__dirname,"..","images", "content", imageName))
            .then(()=>{
                unlink(file.path, err=>{
                    if(err)
                        throw err
                })
            })
            .catch(err=> next(err))
            sliderContents.forEach(content=>{// add the image name to the content data
                if(content.custom && content.img.split(".")[0] == file.originalname.split(".")[0])
                    content.img = imageName
            })
        })
    const customImgs = sliderContents.map(content=> content.custom?
        content.img : null
    );
    const oldSliderContents = JSON.parse(await fspromise.readFile(path.join(__dirname,"sliderContents.json"), "utf-8"))
    oldSliderContents.forEach(content=>{
        const imgPath = path.join(__dirname, "..", "images", "content", content.img)
        if(content.custom && content.img 
            && !customImgs.includes(content.img) && content.img !== "content.png"
            && existsSync(imgPath)
        )
            unlink(imgPath, err=>{
                if(err)
                    console.log(err)
            })
    })
    await fspromise.writeFile(path.join(__dirname,"sliderContents.json"), JSON.stringify(sliderContents))
    res.status(201).end()
}

const approveContent = (req, res, next)=>{
    if(!validateId(req.body.contentID))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    setContentApproved(req.body).then( data=>{
        if(!data){
            res.status(500).json({msg: "Internal server error"})
            return null
        }
        setReviewMsg = "The content approved successfully"
        res.status(201).end()
        incTotleReviews(req.session.user._id)
        incAuthorContentNum(data.authorID)
        sendEmail(
            data.email, 
            {
                title:"Your Content Is Approved", 
                content:`<p>${data.notif.msg}
                <a href='${req.protocol + '://' + req.get('origin')}${data.notif.href}'>click here</a> to go to the content
                </p>`
            }
        )
    }).catch(err=> next(err))
}

const rejectContent = (req, res, next)=>{
    if(!validateId(req.body.contentID))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    setContentRejected(req.body).then( data=>{
        if(!data){
            res.status(500).json({msg: "Content not exist!"})
            return null
        }
        setReviewMsg = "The content rejected successfully"
        const imgPath = path.join(__dirname, "..", "images", "content", data.img);
        if(data.img !== "content.png" && existsSync(imgPath))
            unlink(imgPath, err=>{
                if(err)
                    console.log(err)
            })
        res.status(201).end()
        incTotleReviews(req.session.user._id)
        sendEmail(
            data.email, 
            {
                title:"Your Content Is Rejected", 
                content:`
                <p>${data.notif.msg}
                <a href='${req.protocol + '://' + req.get('origin')}${data.notif.href}'>click here</a> to go to content page
                </p>
                `
            }
        )
    }).catch(err=> next(err))
}
/* end the functions for contentControl page */

module.exports={
    getContents, getContent, getMoreContents,
    addContent, hideContent, showContent,
    editContent, deleteContent, getContentControl, 
    selectContent, unselectContent, 
    searchContent, updateSlider,
    approveContent, rejectContent
};