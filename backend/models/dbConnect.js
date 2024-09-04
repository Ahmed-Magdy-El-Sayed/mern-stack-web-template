const mongoose = require("mongoose");

mongoose.set('strictQuery', false);
"mongodb+srv://AhmedMagdy:1YLcRgPR4L0fPQzW@cluster0.kbcoecs.mongodb.net/codexpress?retryWrites=true"
module.exports = cb=>{
    return new Promise(async (resolve, reject)=>{
        await mongoose.connect('mongodb://localhost:27017/comment')//change database name here and in app.js to your database name
        .then(()=>{
            return cb()
            .then(resalt=>{
                resalt? resolve(resalt) : resolve();
            }).catch(err=>{
                console.error(err);
                reject()
            })
        })
        .catch(err=>{
            console.error(err)
            reject()
        })
    })
}