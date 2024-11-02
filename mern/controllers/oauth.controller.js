const { setUsername } = require("../models/users");

const oauthCallback = (req, res) => {
    if (!req.user) 
      return res.status(400).json({ msg: "Authentication failed" });

    if(!req.user.isNew){
      if(req.user.data.ban.current?.ending)
        return res.status(403).json({case:"banned", ban:req.user.data.ban.current});

      delete req.user.data.warning
      delete req.user.data.ban
    }
    req.user = req.user.data
    delete req.session.passport
    req.session.user = req.user
    req.session.userSessionExp = new Date(Date.now()+3*24*60*60*1000)
    const user = {...req.user, role: req.user.authz.isAdmin? "admin" : req.user.authz.isEditor? "editor" : req.user.authz.isAuthor? "author" : "user"}
    delete user.authz;
    req.session.save(()=>{
      res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp, path: "/"})
      res.redirect(301, "/");
    });
}
const postUsername = (req, res, next)=>{
    const user = req.session.user
    const username = req.body.username
    setUsername(user._id, username).then(()=>{
      user.username = username
      req.session.save(()=>{
        res.cookie("user", JSON.stringify({...JSON.parse(req.cookies.user), username}), {expires: req.session.userSessionExp, path: "/"})
        res.status(201).end()
      })
    }).catch(err=> next(err))
}

module.exports = {
    oauthCallback,
    postUsername
}