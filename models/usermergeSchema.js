const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserMergerSchema = new Schema({
    email:{type:String},
    password:{type:String},
    fcode:{type:String},
    nameprefix:{type:String},
    fullname:{type:String},
    dob:{type:Date},
    mobileno:{type:String},
    gender:{type:Number},
    address:{type:String},
    about:{type:String},
    city:{type:String},
    state:{type:String},
    country:{type:String},
    userimage:{type:String},
    facebookid:{type:String},
    googleplusid:{type:String},
    registeredfrom:{type:String},
    sendpushnotification:{type:Number},
    qualification:{type:String},
    isemailverified:{type:Number},
    isactive:{type:Number},
    isorganizer:{type:Number},
    issuperorganizer:{type:Number},
    IsOrgSuperAdmin:{type:String},
    issubadmin:{type:Number},
    Notifystatus:{type:Number},
    displaypp:{type:Number},
    EventIDs:{type:Array},
    OrganizerPanelID:{type:Schema.Types.ObjectId},
    whenentered:{type:Date},
    whenmodified:{type:Date},
    whendeactivated:{type:Date},
    LastModified:{type:Date},
    EnteredBy:{type:Array},
    deactivatedby:{type:Array},
    ModifiedBy:{type:Array},
    interest:{type:Array},
    expertise:{type:Array},
    organisers:[
        {
            _id:false,
            eventid:{
                type:Schema.Types.ObjectId,
                ref:"eventmaster"
            },
            enteredby:Schema.Types.ObjectId,
            isactive:Number,
            isorganiser:Number,
            writesaccess:[]
        }
    ],
    Coupons:{type:Array},
    enrolledinfo:{type:Array},
    version:{type:String},
    MRegorStudentId:{type:String},
    verifyprof:{type:Number},
    usertype:{type:Number},
    website:{type:String},
    RegCertificate:{type:String},
    Reason:{type:String},
    Changes:{type:String},
    StateMedicalCouncil:{type:String},
    userimage1:{type:String},
    isadminimg:{type:Number},
    isUploadshow:{type:Number},
    uploadstartdate:{type:Date},
    uploadtype:{type:String},
    followers:{type:Array},
    isuploadrequest:{type:Number},
    otp:{type:String},
    countrycode:{type:String},
    appleuserid:{type:String},
    identityToken:{type:String},
    usercountry:{type:String},
    ismobileverified:{type:Number},
    checkbox:{type:String},
    redirectTo:{type:String},
    noOfOtpAttampt:{type:Number},
    otpTimeStamp:{type:Number},
    passTimeStamp:{type:Number},
    noOfPassAttampt:{type:Number},
    deletionId:{type:Schema.Types.ObjectId},
    sendemaildate:{type:Date},
    issubscribe:{type:Number},
    isspecialuser:{type:Number},
    kolrequestaccept:{type:Number},
    subscribecomment:{type:String},
    speakersharelink:{type:String},
    isdeleted:{type:Boolean},
    subscriptionId:Schema.Types.ObjectId,
    videosviewed: Number,
    lastvideoviewedon: Date,
    lastloginfrom: {
        whenmodified: {
            type: Date,
        }
    },
    isLead: {
        type: Boolean,
        default: false
    }
})

const UserdataCollection = mongoose.model('user',UserMergerSchema,'user');

module.exports = UserdataCollection