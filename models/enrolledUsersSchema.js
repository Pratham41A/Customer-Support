const mongoose = require("mongoose");

const Schema = mongoose.Schema

const EnrolledUsersSchema = new Schema ({
   
courseid:{
    type:Schema.Types.ObjectId,
    // ref:"cmeFormData"
    ref:"coursedetails"
},
userid:{
    type:Schema.Types.ObjectId,
    ref:"user"
    // ref:"cmeFormData"
},
userid:{
    type:Schema.Types.ObjectId,
    ref:"PaymentGatways"
    // ref:"cmeFormData"
},
courseid:{
    type:Schema.Types.ObjectId,
    ref:"PaymentGatways"
    // ref:"cmeFormData"
},
fullname:{
    type:String,
},
email:{
    type:String,
},
mobileno:{
    type:String,
},
transactionid:{
    type:String,
},
invoicenum:{
    type:String,
},
gacampaign:{
    type:String,
},
currencytype:{
    type:String,
}, 
coursename:{
    type:String,
},
devicetype:{
    type:Number,
},
isprepaid:{
    type:Number,
},
couponcode:{
    type:String,
},
transactionstatus:{
    type:Number,
}
,transactionerror:{
    type:String,
},
paymentmethod:{
    type:String,
},
currencytype:{
    type:String,
},
amountpaid:{
    type:Number,
},
whenentered:{
    type:Date,
}
})

const EnrolledUsersCollection = mongoose.model('enrolldetails',EnrolledUsersSchema,'enrolldetails');

module.exports = EnrolledUsersCollection;