const mongoose = require("mongoose");

const Schema = mongoose.Schema

const SubsDetailManageSchema = new Schema({
    userid: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    fullname: String,
    email: String,
    mobileno: String,
    city:String,
    country:String,
    state:String,
    MRegorStudentId:String,
      packageId: {
        type: Schema.Types.ObjectId,
        ref: "PackageMaster",
      },
    
        status:{
            type:String,
        },
        pgSubscriptionId:{
            type:String,
        },
        pgPaymentId:{
            type:String,
        },
        currencytype:{
            type:String,
        },
        // userid:{
        //     type:Schema.Types.ObjectId,
        // },
        paymentmethod:{
            type:String,
        },
        couponcode:{
            type:String,
        },
        paymentsku:{
            type:String,
        },
        startDate:{
            type:Date,
        },
        endDate:{
            type:Date,
        },
        amountpaid:{
            type:Number,
        },
        discountamount:{
            type:Number,
        },
        // packageId:{
        //     type:Schema.Types.ObjectId,
        // },
        whenentered:{
            type:Date,
           
        },
        whenmodified:{
            type:Date,
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
        transactionstatus:{
            type:Number,
        },
        transactionstatus:{
            type:Number,
        },
        planType:{
            type:Number,
        },
        isactive:{
            type:Number,
        },
})

const SubsManageCollection = mongoose.model('subscriptiondetails',SubsDetailManageSchema,'subscriptiondetails');

module.exports = SubsManageCollection;