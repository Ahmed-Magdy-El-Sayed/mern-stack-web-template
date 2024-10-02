const isLoggedOut = (req, res, next)=>{
    req.session.user? res.status(301).redirect('/') : next();
}

const isLoggedIn = (req, res, next)=>{
    req.session.user? next(): res.status(301).redirect('/') ;
}

const isAdmin= (req, res, next)=>{
    req.session.user?.isAdmin? next() : res.status(403).redirect('/')
}
const isReviewer= (req, res, next)=>{
    req.session.user?.isAdmin || req.session.user?.isEditor? next() : res.status(403).redirect('/')
}
const isAuthor= (req, res, next)=>{//author here means who can create content, not the author user role that in the user model 
    req.session.user?.isAuthor || req.session.user?.isAdmin || req.session.user?.isEditor? next() : res.status(403).redirect('/account/login')
}

module.exports={
    isLoggedOut,
    isLoggedIn,
    isAdmin,
    isReviewer,
    isAuthor
}