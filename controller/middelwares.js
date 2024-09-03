const multer = require("multer");

const isLoggedOut = (req, res, next)=>{
    const user = {...req.session.user};
    if(req.session.user && new Date(req.session.userSessionExp).getTime() > Date.now()){
        delete user.notifs;
        res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp})
        res.status(403).json({msg: "Forbidden"});
    }else next();
}

const isLoggedIn = (req, res, next)=>{
    if(req.session.user && new Date(req.session.userSessionExp).getTime() > Date.now())
        next()
    else{
        res.cookie("user", "", {expires: new Date("Thu, 01 Jan 1970 00:00:01 GMT")})
        res.status(403).json({msg: "Forbidden"});
    }
}

const isAdmin= (req, res, next)=>{
    req.session.user.authz.isAdmin? next() : res.status(403).json({msg: "Forbidden"})
}

const isReviewer= (req, res, next)=>{
    req.session.user.authz.isAdmin || req.session.user?.authz.isEditor? next() : res.status(403).json({msg: "Forbidden"})
}

const isAuthor= (req, res, next)=>{//author here means who can create content(author, editor admin), not the author role only
    req.session.user.authz.isAuthor || req.session.user.authz.isAdmin || req.session.user.authz.isEditor? next() : res.status(403).json({msg: "Forbidden"})
}

const upload = multer({
    storage: multer.diskStorage({
        destination:(req, file, cb)=>{
            cb(null, 'images');
        },
        filename:(req, file, cb)=>{
            const format = file.originalname.split('.').pop()
            
            file.originalname = file.originalname.split('.')[0] + '.' + Date.now() + '.' + format;

            if ((file.size / (1024 * 1024)) > 1)
                return cb('File too large', file.originalname)
            
            if (!["png", "jpg", "jpeg"].includes(format))
                return cb('Invalid file format', file.originalname)
            
            cb(null, file.originalname)
        }
    })
});

module.exports={
    isLoggedOut,
    isLoggedIn,
    isAdmin,
    isReviewer,
    isAuthor,
    upload
}