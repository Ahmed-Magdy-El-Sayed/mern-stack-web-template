const mongoose = require("mongoose");

mongoose.set('strictQuery', false);

module.exports = cb=>{
    return new Promise(async (resolve, reject)=>{
        await mongoose.connect(process.env.MONGODB_URI)// create .env file and add the variable
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