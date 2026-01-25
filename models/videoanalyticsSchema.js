const mongoose = require("mongoose");

const Schema = mongoose.Schema

const videoanalyticSchema = new Schema({
    
    courseid:{
        type:Schema.Types.ObjectId,
        ref:"coursedetails"
            // required:true
        },
        subcourseid:{
            type:Schema.Types.ObjectId,
                // required:true
            }
            ,
            userid:{
            type:Schema.Types.ObjectId,
                // required:true
            },
            percentvideoplay:{
                type:String
            },
            startvideo:{type:String},
            videopathmaincourse:{type:String},
            videopathsubcourse:{type:String},
            pausetime:{type:String},
            durationofvideo:{type:String},
            whenentered:{type:Date},
            lastseen:{type:Date},
            devices:{type:String},
            type:{type:Number},
            trackingflag:{type:Number},
            platform:{type:Number},
            live:{type:Number},
            isdeleted:Boolean
})

const videoanalyticDataCollection = mongoose.model('videotrack',videoanalyticSchema,'videotrack');

module.exports = videoanalyticDataCollection;