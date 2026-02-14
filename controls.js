const axios = require("axios");
const mongoose = require("mongoose");

const User = require("./models/usermergeSchema.js");
const Subscription = require("./models/subsDetailsManagementSchema.js");
const Payment = require("./models/enrolledUsersSchema.js");
const VideoTrack = require("./models/videoanalyticsSchema.js");

const {DummyUser} = require("./models/dummyUser.js");
const {Inbox} = require("./models/inbox.js");
const {Message} = require("./models/message.js");
const {Activity} = require("./models/activity.js");
const {QueryType} = require("./models/queryType.js");
const {DailyResolution} = require("./models/dailyResolution.js");
const { parsePhoneNumber } = require("libphonenumber-js");



//const { getIo } = require("./io.js");
const io = require("socket.io")();
const { getOutlookToken, uploadToS3, downloadWhatsappMedia, generateWhatsappTemplatePayload, extractParams } = require("./services.js");


exports.root = (req, res) => {
  return res.status(200).json("Om Ganeshay Namah");
};
exports.getDashboard = async (req, res) => {
  try {

    const inboxAgg = await Inbox.aggregate([
      {
        //Run Multiple Aggregations in Parallel
        $facet: {
          whatsappCounts: [
            {
              $match: {
                whatsappStatus: { $in: ["read", "unread"] }
              }
            },
            {
              $group: {
                _id: "$whatsappStatus",
                count: { $sum: 1 }
              }
            }
          ],
          totalCounts: [
            {
              $group: {
                _id: null,
                read: { $sum: "$total.read" },
                unread: { $sum: "$total.unread" }
              }
            }
          ]
        }
      }
    ]);

    const status = {
      read: 0,
      unread: 0,
      resolved: 0
    };

//whatsappStatus
    inboxAgg[0].whatsappCounts.forEach(item => {
      status[item._id] += item.count;
    });

    // total.read & total.unread
    const totals = inboxAgg[0].totalCounts[0] || { read: 0, unread: 0 };
    status.read += totals.read;
    status.unread += totals.unread;

    //resolution
    const channelAgg = await DailyResolution.aggregate([
      {
        $group: {
          _id: null,
          whatsapp: { $sum: "$channels.whatsapp" },
          email: { $sum: "$channels.email" },
          web: { $sum: "$channels.web" }
        }
      }
    ]);

    const sourceResolved = {
      whatsapp: channelAgg[0]?.whatsapp || 0,
      email: channelAgg[0]?.email || 0,
      web: channelAgg[0]?.web || 0
    };

    status.resolved =
      sourceResolved.whatsapp +
      sourceResolved.email +
      sourceResolved.web;

    const queryTypes = await DailyResolution.aggregate([
      {
        $project: {
          queryTypes: { $objectToArray: "$queryTypes" }
        }
      },
      { $unwind: "$queryTypes" },
      {
        $group: {
          _id: "$queryTypes.k",
          count: { $sum: "$queryTypes.v" }
        }
      }
    ]);

    const queryTypeResolved = {};
    for (const qt of queryTypes) {
      queryTypeResolved[qt._id] = qt.count;
    }

    return res.json({
      ...status,
      ...sourceResolved,
      ...queryTypeResolved
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


exports.updateInbox = async (req, res) => {
  try {
    const { inboxId, messageId, status, queryType } = req.body;

if(messageId){

if(status === "read"){  
  const message=await Message.findById(new mongoose.Types.ObjectId(messageId));
  message.status="read";
  const inbox=await Inbox.findById(new mongoose.Types.ObjectId(inboxId));
if(inbox.total.unread===1 && inbox.whatsappStatus!=='unread'){
  inbox.status="read";  
}
inbox.total.unread-=1
inbox.total.read+=1
  await message.save();
  await inbox.save()
}
else if(status==='unread'){
   const message=await Message.findById(new mongoose.Types.ObjectId(messageId));
   message.status='unread'
    const inbox=await Inbox.findById(new mongoose.Types.ObjectId(inboxId));
    inbox.total.read-=1
    inbox.total.unread+=1
    inbox.status='unread'
    await message.save();
    await inbox.save()
}
else if(status === "resolved"){
  const message=await Message.findById(messageId);
  message.status="resolved";
  message.queryType=queryType;
  await message.save();
const inbox=await Inbox.findById(new mongoose.Types.ObjectId(inboxId));
  if(inbox.total.read===1 && inbox.total.unread===0 && inbox.whatsappStatus==='resolved'){
inbox.status='resolved'
inbox.queryType=queryType
  }
  inbox.total.read-=1
        await QueryType.findOneAndUpdate(
          { name: queryType },
          { $setOnInsert: { name: queryType } },
          { upsert: true }
        );
   const today = new Date();
      today.setHours(0, 0, 0, 0);
       const incData = {};

        incData[`channels.email`] = 1;

        incData[`queryTypes.${queryType}`] = 1;
         await DailyResolution.findOneAndUpdate(
        { date: today },
        {
          $setOnInsert: { date: today },
          $inc: incData
        },
        { upsert: true }
      );
}
else if(status==="ignore"){
  await Message.updateOne(
  { _id: messageId },
  { $unset: { status: "" } }
);
if(inbox.total.unread===1 && inbox.total.read>0 && inbox.whatsappStatus!=='unread'){
inbox.status='read'
}
else if(inbox.total.unread===1 && inbox.total.read===0 ){
inbox.status=inbox.whatsappStatus
}
inbox.total.unread-=1
await inbox.save()
}
}
else if(inboxId){
if(status==='unread'){
const inbox=await Inbox.findById(new mongoose.Types.ObjectId(inboxId));
  inbox.whatsappStatus='unread'
    inbox.status='unread'
  }
else if(status==='read'){
const inbox=await Inbox.findById(new mongoose.Types.ObjectId(inboxId));
  inbox.whatsappStatus='read'
  if(inbox.total.unread===0 ){
    inbox.status='read'
  }
}
else if(status==='resolved'){
const inbox=await Inbox.findById(new mongoose.Types.ObjectId(inboxId));
  inbox.whatsappStatus='resolved'
  if(inbox.total.unread===0 && inbox.total.read===0){
    inbox.status='resolved'
  }
  inbox.queryType=queryType
await QueryType.findOneAndUpdate(
          { name: queryType },
          { $setOnInsert: { name: queryType } },
          { upsert: true }
        );
   const today = new Date();
      today.setHours(0, 0, 0, 0);
       const incData = {};

        incData[`channels.whatsapp`] = 1;

        incData[`queryTypes.${queryType}`] = 1;
         await DailyResolution.findOneAndUpdate(
        { date: today },
        {
          $setOnInsert: { date: today },
          $inc: incData
        },
        { upsert: true }
      );
}
}
    return res.sendStatus(200);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.getOutlookSubscriptions = async (req, res) => {
  try {
    const token = await getOutlookToken();
    const headers = { Authorization: `Bearer ${token}` };
    const webhookUrl = `${process.env.BACKEND}/outlook/webhook`;

    const subscriptionsResponse = await axios.get("https://graph.microsoft.com/v1.0/subscriptions", { headers });
    const allSubscriptions = subscriptionsResponse.data.value;
    const now = new Date();
    const userActiveSubscriptions = allSubscriptions.filter(
      (s) =>
        s.resource.includes(`/users/${process.env.USER_EMAIL}/`) &&
        s.notificationUrl === webhookUrl &&
        now < new Date(s.expirationDateTime)
    );


    return res.status(200).json({
      user: process.env.USER_EMAIL,
      activeSubscriptions: userActiveSubscriptions.length
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
exports.getSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;
    const filter = { userid: new mongoose.Types.ObjectId(userId) };

    const subscriptions = await Subscription.find(filter)
      .populate('packageId')
      .sort({ whenmodified: -1 })

    res.json({
      count: subscriptions.length,
      subscriptions
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const filter = { userid: new mongoose.Types.ObjectId(userId) };

    const payments = await Payment.find(filter)
    .populate('courseid')
      .sort({ whenmodified: -1 })



    res.json({ count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
exports.getViews = async (req, res) => {
  try {
    const { userId } = req.params;

    const filter = { userid: new mongoose.Types.ObjectId(userId) };

    const videoTracks = await VideoTrack.find(filter)
      .populate('courseid')
      .populate('subcourseid')
      .sort({ lastseen: -1 })



    res.json({
      count: videoTracks.length,
      videoTracks
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getActivities = async (req, res) => {
  try {
    const { inboxId } = req.params;
    const filter = { inbox: new mongoose.Types.ObjectId(inboxId) };

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })

    res.json({ count: activities.length, activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getInboxes = async (req, res) => {
  try {
    const { status } = req.params;
    const filter = status ? { status } : {};

    const inboxes = await Inbox.find(filter)
      .populate('owner')
      .populate('dummyOwner')
      .sort({ inboxDateTime: -1 })
    res.json({ count: inboxes.length, inboxes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getQueryTypes = async (req, res) => {
  try {

    const filter = {};

    const queryTypes = await QueryType.find(filter)
      .sort({ createdAt: -1 })

    res.json({
      count: queryTypes.length,
      queryTypes
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createActivity = async (req, res) => {
  try {
    const { inboxId, body, dueDate } = req.body;

    const activity = await Activity.create({
      inbox: new mongoose.Types.ObjectId(inboxId),
      body,
      dueDate: new Date(dueDate)
    });

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getMessages = async (req, res) => {
  try {
    const { inboxId } = req.params;
    const { source } = req.query
    const filter = { inbox: new mongoose.Types.ObjectId(inboxId) }
    if (source) {
      filter.source = source
    }
    const messages = await Message.find(filter)
      .populate('inReplyTo')
      .sort({ messageDateTime: -1 })
    res.json({
      count: messages.length,
      messages
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createQueryType = async (req, res) => {
  try {
    const { name } = req.body;

    const queryType = await QueryType.create({
      name
    });

    res.status(201).json(queryType);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
exports.manageIncomingOutlook = async (req, res) => {
  if (req.query.validationToken) {
    res.set("Content-Type", "text/plain");
    return res.status(200).send(req.query.validationToken);
  }

  res.sendStatus(202);
  if (!req.body.value || !Array.isArray(req.body.value)) return;

  try {
   // const io = getIo();
    const notifications = req.body.value;

    for (const notification of notifications) {
      const clientState = notification.clientState;
      const email = clientState.split("+")[0];
      const outlookSubscriptionSecret = clientState.split("+")[1];

      if (outlookSubscriptionSecret !== process.env.OUTLOOK_SUBSCRIPTION_SECRET) continue;

      const messageId = notification.resourceData.id;
      const token = await getOutlookToken();
      const emailTextResponse=await axios.get(
        `https://graph.microsoft.com/v1.0/users/${email}/messages/${messageId}?$select=from,subject,body,internetMessageId,internetMessageHeaders,hasAttachments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Prefer: 'outlook.body-content-type="html"'
          }
        }
      )

      let {from ,subject ,body, internetMessageId, internetMessageHeaders, hasAttachments } = emailTextResponse.data;

      let attachments = [];

      if (hasAttachments) {
        const attachmentResponse = await axios.get(
          `https://graph.microsoft.com/v1.0/users/${email}/messages/${messageId}/attachments`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        for (const attachment of attachmentResponse.data.value) {
          if (attachment["@odata.type"] !== "#microsoft.graph.fileAttachment") continue;

          let buffer = Buffer.from(attachment.contentBytes, "base64");

          let url = await uploadToS3({
            buffer,
            filename: attachment.name,
            contentType: attachment.contentType
          });

          attachments.push(url);
        }
      }

 const user=await User.findOne({email:from.emailAddress.address})
 var inbox
      if(user){
      inbox=await Inbox.findOne({owner:new mongoose.Types.ObjectId(user._id)})
       if(inbox){
        if(!inbox.source){
          inbox.source='email'
        }
        inbox.preview={value:`Subject: ${subject}`}
        inbox.contentType='normal'
         inbox.status='unread'
        inbox.total.unread+=1
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({owner:new mongoose.Types.ObjectId(user._id),preview:{value:`Subject: ${subject}`},contentType:'normal',status:'unread',source:'email',total:{unread:1}})        
      }
    }
      else{
        var dummyUser=await DummyUser.findOne({email:from.emailAddress.address})
        if(dummyUser){
 inbox=await Inbox.findOne({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id)})
       if(inbox){
      if(!inbox.source){
          inbox.source='email'
        }
        inbox.preview={value:`Subject: ${subject}`}
        inbox.contentType='normal'
     inbox.status='unread'
        inbox.total.unread+=1
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:`Subject: ${subject}`},contentType:'normal',status:'unread',source:'email',total:{unread:1}})         
      }
        }
        else{
        dummyUser=await DummyUser.create({name:from.emailAddress.address,email:from.emailAddress.address})
inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:`Subject: ${subject}`},contentType:'normal',status:'unread',source:'email',total:{unread:1}})        
     
        }
      }
    const inReplyToHeader = internetMessageHeaders.find(
        header => header.name.toLowerCase() === "in-reply-to"
      );

      let inReplyToMessage = null;
      if (inReplyToHeader) {
          inReplyToMessage = await Message.findOne({
            internetMessageId:inReplyToHeader.value
          });
        }
     
      var message = await Message.create({
        isSent:false,
        inbox:new mongoose.Types.ObjectId(inbox._id),
        subject,
        content: {value:body.content},
        contentType:'html',
        attachments,
        source: "email",
        messageId,
        internetMessageId,
        inReplyTo: inReplyToMessage ? new mongoose.Types.ObjectId(inReplyToMessage._id) : null,
        status:'unread'
      });

      message=await Message.findById(new mongoose.Types.ObjectId(message._id)).populate('inReplyTo').populate('inbox')

      io.emit('message',message)
      console.log('Handled Inbox ',inbox._id)
      console.log('Received Message' ,message._id)
    }
    }
   catch (e) {
    console.error(e.message+" manageIncomingOutlook");
  }
}
exports.manageOutgoingNewOutlook = async (req, res) => {
  try {
    //const io=getIo()
    const { email, subject, htmlBody } = req.body;

    const token = await getOutlookToken();

    const toRecipients =[{ emailAddress: { address: email } }];

    const draftResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages`,
      {
        subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const messageId = draftResponse.data.id;

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages/${messageId}/send`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const emailResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages/${messageId}?$select=internetMessageId`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { internetMessageId } = emailResponse.data;
   
 const user=await User.findOne({email})
 var inbox
      if(user){
      inbox=await Inbox.findOne({owner:new mongoose.Types.ObjectId(user._id)})
       if(inbox){
        if(!inbox.source){
          inbox.source='email'
        }
        if(inbox.status=='resolved'){
        inbox.status='read'         
        }
        inbox.preview={value:`Subject: ${subject}`}
         inbox.contentType='normal'
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({owner:new mongoose.Types.ObjectId(user._id),preview:{value:`Subject: ${subject}`},contentType:'normal',status:'read',source:'email'})        
      }
    }
      else{
         var dummyUser=await DummyUser.findOne({email})
        if(dummyUser){
 inbox=await Inbox.findOne({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id)})
       if(inbox){
        if(!inbox.source){
          inbox.source='email'
        }
        if(inbox.status=='resolved'){
        inbox.status='read'         
        }
        inbox.preview={value:`Subject: ${subject}`}
        inbox.contentType='normal'
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:`Subject: ${subject}`},contentType:'normal',status:'read',source:'email'})        
      }
        }
        else{
        dummyUser=await DummyUser.create({name:email,email})
inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:`Subject: ${subject}`},contentType:'normal',status:'read',source:'email'})        
        }
      }
     
      var message = await Message.create({
        isSent:true,
        inbox:new mongoose.Types.ObjectId(inbox._id),
        subject,
        content: {value:htmlBody},
        contentType:'html',
        source: "email",
        messageId,
        internetMessageId
      });
 message=await Message.findById(new mongoose.Types.ObjectId(message._id)).populate('inReplyTo').populate('inbox')

      io.emit('message',message)

      return res.status(200).json({ message: `Sent Message ${message._id} and Handled Inbox ${inbox._id}` });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
exports.manageOutgoingReplyOutlook = async (req, res) => {
  try {
    //const io=getIo()
    const { replyMessageId, htmlBody, email } = req.body;
        
      let inReplyToMessage = null;
          inReplyToMessage = await Message.findOne({
            messageId:replyMessageId
          });
    const token = await getOutlookToken();
     
    const draftResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages/${replyMessageId}/createReply`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const messageId = draftResponse.data.id;
  
    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages/${messageId}`,
      { body: { contentType: 'HTML', content: htmlBody } },
      { headers: { Authorization: `Bearer ${token}` } }
    );
     
    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages/${messageId}/send`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const emailResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/users/${process.env.USER_EMAIL}/messages/${messageId}?$select=internetMessageId`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { internetMessageId } = emailResponse.data;

   const user=await User.findOne({email})
 var inbox
      if(user){
      inbox=await Inbox.findOne({owner:new mongoose.Types.ObjectId(user._id)})
       if(inbox){
         inbox.preview={value:`Subject: ${inReplyToMessage.subject}`}
         inbox.contentType='normal'
        if(inbox.status=='resolved'){
        inbox.status='read'         
        }
        await inbox.save()
       }
    }
      else{

        var dummyUser=await DummyUser.findOne({email})
        if(dummyUser){
  inbox=await Inbox.findOne({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id)})
       if(inbox){
         inbox.preview={value:`Subject: ${inReplyToMessage.subject}`}
         inbox.contentType='normal'
                 if(inbox.status=='resolved'){
        inbox.status='read'         
        }
        await inbox.save()
       }
      }
      }


      var message = await Message.create({
        isSent:true,
        inbox:new mongoose.Types.ObjectId(inbox._id),
        subject:inReplyToMessage.subject,
        content: {value:htmlBody},
        contentType:'html',
        source: "email",
        messageId,
        internetMessageId,
        inReplyTo: new mongoose.Types.ObjectId(inReplyToMessage._id)
      });

  message=await Message.findById(new mongoose.Types.ObjectId(message._id)).populate('inReplyTo').populate('inbox')

      io.emit('message',message)
     return res.status(200).json({ message: `Sent Message ${message._id} and Handled Inbox ${inbox._id}` });


  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
exports.manageIncomingWhatsapp = async (req, res) => {
  res.sendStatus(200);

  try {
   // const io = getIo();
    const entries = req.body?.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {

        for (const whatsapp of change.value?.messages || []) {
          const raw = whatsapp.from.startsWith("+")
                      ? whatsapp.from
                      : `+${whatsapp.from}`;
          const phone = parsePhoneNumber(raw);
          const countrycode = phone.countryCallingCode;
          const mobile = phone.nationalNumber;  

          let body = "";
          let attachments = [];

          if (whatsapp.text?.body) {
            body = whatsapp.text.body;
          }

          const mediaList = [];
          if (whatsapp.image) mediaList.push(whatsapp.image);
          if (whatsapp.video) mediaList.push(whatsapp.video);
          if (whatsapp.audio) mediaList.push(whatsapp.audio);
          if (whatsapp.document) mediaList.push(whatsapp.document);

          for (const media of mediaList) {
            const { buffer, contentType } = await downloadWhatsappMedia(media.id);

           const extension = media.mime_type?.split("/")[1] || "bin";
        const filename = `${Date.now()}.${extension}`;

            const url = await uploadToS3({
              buffer,
              filename,
              contentType
            });

            attachments.push(url);

            if (!body && media.caption) {
              body = media.caption;
            }
          }

const user=await User.findOne({mobileno:mobile,countrycode:{$in:[countrycode,`+${countrycode}`]}})
 var inbox
      if(user){
      inbox=await Inbox.findOne({owner:new mongoose.Types.ObjectId(user._id)})
       if(inbox){
          inbox.status="unread"
          inbox.whatsappStatus='unread'
        if(!inbox.source){
          inbox.source='whatsapp'
        }
        inbox.whatsappConversationEndDateTime=new Date(Date.now()+1000*60*60*24)
        inbox.preview={value:body}
        inbox.contentType='special'
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({owner:new mongoose.Types.ObjectId(user._id),preview:{value:body},contentType:'special',status:'unread',whatsappStatus:'unread',source:'whatsapp',whatsappConversationEndDateTime:new Date(Date.now()+1000*60*60*24)})        
      }
    }
      else{

        var dummyUser=await DummyUser.findOne({mobileno:mobile,countrycode})
        if(dummyUser){
 inbox=await Inbox.findOne({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id)})
       if(inbox){  
          inbox.whatsappStatus='unread'
          inbox.status="unread"
        
        if(!inbox.source){
          inbox.source='whatsapp'
        }
        inbox.whatsappConversationEndDateTime=new Date(Date.now()+1000*60*60*24)
        inbox.preview={value:body}
        inbox.contentType='special'

        await inbox.save()
        }
       else{
        inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:body},contentType:'special',status:'unread',whatsappStatus:'unread',source:'whatsapp',whatsappConversationEndDateTime:new Date(Date.now()+1000*60*60*24)})        
      }
        }
        else{
        dummyUser=await DummyUser.create({name:mobile,mobileno:mobile,countrycode})
inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:body},contentType:'special',status:'unread',whatsappStatus:'unread',source:'whatsapp',whatsappConversationEndDateTime:new Date(Date.now()+1000*60*60*24)})        
        }
      }

      var message = await Message.create({
        isSent: false,
        inbox: new mongoose.Types.ObjectId(inbox._id),
        content: {value:body},
        contentType:'special',
        attachments,
        source: "whatsapp"
      });

      message=await Message.findById(new mongoose.Types.ObjectId(message._id)).populate('inReplyTo').populate('inbox')

      io.emit('message',message)
      console.log('Handled Inbox ',inbox._id)
      console.log('Received Message' ,message._id)
        }
      }
    }
  } catch (e) {
    console.error( e.message," manageIncomingWhatsapp");
  }
};
exports.manageOutgoingNewWhatsapp = async (req, res) => {
  try {
    //const io=getIo()
    var { mobile, body } = req.body;
 const raw = mobile.startsWith("+")
                      ? mobile
                      : `+${mobile}`;
          const phone = parsePhoneNumber(raw);
          const countrycode = phone.countryCallingCode;
          var mobile = phone.nationalNumber;  

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `${countrycode}${mobile}`,
      type: "text",
      text: { body }
    };

    await axios.post(process.env.D360_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": process.env.D360_API_KEY,
      },
    });
const user=await User.findOne({mobileno:mobile,countrycode:{$in:[countrycode,`+${countrycode}`]}})
 var inbox
      if(user){
      inbox=await Inbox.findOne({owner:new mongoose.Types.ObjectId(user._id)})
        if(inbox){
        if(!inbox.source){
          inbox.source='whatsapp'
        }

        if(inbox.status=='resolved'){
        inbox.status='read'       
        if(inbox.whatsappStatus='resolved') { 
        inbox.whatsappStatus='read'
        }
      }
      
        inbox.preview={value:body}
         inbox.contentType='special'
         
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({owner:new mongoose.Types.ObjectId(user._id),preview:{value:body},contentType:'special',status:'read',source:'whatsapp',whatsappStatus:'read'})        
      }
    }
      else{

        var dummyUser=await DummyUser.findOne({mobileno:mobile,countrycode})
        if(dummyUser){
  inbox=await Inbox.findOne({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id)})
if(inbox){
        if(!inbox.source){
          inbox.source='whatsapp'
        }
         if(inbox.status=='resolved'){
        inbox.status='read'       
        if(inbox.whatsappStatus='resolved') { 
        inbox.whatsappStatus='read'
        }
      }
       
        inbox.preview={value:body}
        inbox.contentType='special'
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:body},contentType:'special',status:'read',source:'whatsapp',whatsappStatus:'read'})        
      }
      }
      else{
                dummyUser=await DummyUser.create({name:mobile,mobileno:mobile,countrycode})
inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:body},contentType:'special',status:'read',source:'whatsapp',whatsappStatus:'read'})        
      }
      }
     
      var message = await Message.create({
        isSent:true,
        inbox:new mongoose.Types.ObjectId(inbox._id),
        content: {value:body},
        contentType:'special',
        source: "whatsapp"
      });

 message=await Message.findById(new mongoose.Types.ObjectId(message._id)).populate('inReplyTo').populate('inbox')

      io.emit('message',message)

      return res.status(200).json({ message: `Sent Message ${message._id} and Handled Inbox ${inbox._id}` });
  } catch (e) {
    return res.status(500).json({
      error: e.message,
    });
  }
}
exports.manageOutgoingTemplateWhatsapp = async (req, res) => {
  try {
    //const io=getIo()
    var { mobile, template } = req.body;
 const raw = mobile.startsWith("+")
                      ? mobile
                      : `+${mobile}`;
          const phone = parsePhoneNumber(raw);
          const countrycode = phone.countryCallingCode;
          var mobile = phone.nationalNumber; 
const components=generateWhatsappTemplatePayload(template)

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: `${countrycode}${mobile}`,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language_code },
        namespace: process.env.D360_NAMESPACE,
        ...(components.length > 0 && { components })
      }
    };

    await axios.post(process.env.D360_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'D360-API-KEY': process.env.D360_API_KEY
      }
    });

const user=await User.findOne({mobileno:mobile,countrycode:{$in:[countrycode,`+${countrycode}`]}})
 var inbox
      if(user){
      inbox=await Inbox.findOne({owner:new mongoose.Types.ObjectId(user._id)})
        if(inbox){
        if(!inbox.source){
          inbox.source='whatsapp'
        }
 if(inbox.status=='resolved'){
        inbox.status='read'       
        if(inbox.whatsappStatus='resolved') { 
        inbox.whatsappStatus='read'
        }
      }
 
        inbox.preview={value:`Template: ${template.name}`}
         inbox.contentType='normal'
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({owner:new mongoose.Types.ObjectId(user._id),preview:{value:`Template: ${template.name}`},contentType:'normal',status:'read',source:'whatsapp',whatsappStatus:'read'})        
      }
    }
      else{

        var dummyUser=await DummyUser.findOne({mobileno:mobile,countrycode})
        if(dummyUser){
  inbox=await Inbox.findOne({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id)})
if(inbox){
        if(!inbox.source){
          inbox.source='whatsapp'
        }
        if(inbox.status=='resolved'){
        inbox.status='read'       
        if(inbox.whatsappStatus='resolved') { 
        inbox.whatsappStatus='read'
        }
      }
        inbox.preview={value:`Template: ${template.name}`}
        inbox.contentType='normal'
  
        await inbox.save()
       }
       else{
        inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:`Template: ${template.name}`},contentType:'normal',status:'read',source:'whatsapp',whatsappStatus:'read'})        
      }
      }
      else{
                dummyUser=await DummyUser.create({name:mobile,mobileno:mobile,countrycode})
inbox=await Inbox.create({dummyOwner:new mongoose.Types.ObjectId(dummyUser._id),preview:{value:`Template: ${template.name}`},contentType:'normal',status:'read',source:'whatsapp',whatsappStatus:'read'})        
      }
      }
     
      var message = await Message.create({
        isSent:true,
        inbox:new mongoose.Types.ObjectId(inbox._id),
        content: {value:template},
        contentType:'special',
        source: "whatsapp"
      });

 message=await Message.findById(new mongoose.Types.ObjectId(message._id)).populate('inReplyTo').populate('inbox')

      io.emit('message',message)

      return res.status(200).json({ message: `Sent Message ${message._id} and Handled Inbox ${inbox._id}` });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
exports.getWhatsappTemplates = async (req, res) => {
  try {
    const whatsappTemplatesResponse = await axios.get(
      "https://waba-v2.360dialog.io/v1/configs/templates",
      {
        headers: { "D360-API-KEY": process.env.D360_API_KEY }
      }
    );

    const whatsappTemplates =
      whatsappTemplatesResponse.data.waba_templates || [];

    //Template : BODY/BUTTONS
    const filteredTemplates = whatsappTemplates.filter(template =>
      template.components.every(
        c => c.type === 'BODY' || c.type === 'BUTTONS'
      )
    );

    const formattedTemplates = filteredTemplates.map(template => {
      const components = [];
      const allParameters = new Map();

      template.components.forEach(component => {
        // BODY
        if (component.type === 'BODY') {
          extractParams(component.text).forEach(param => {
            if (!allParameters.has(param)) {
              allParameters.set(param, {
                name: param,
                sources: new Set()
              });
            }
            allParameters.get(param).sources.add('body');
          });

          components.push({
            type: 'body',
            text: component.text
          });
        }

        // BUTTONS
        if (component.type === 'BUTTONS') {
          component.buttons.forEach((btn, index) => {
            const btnType = btn.type.toLowerCase();

            extractParams(btn.text).forEach(param => {
              if (!allParameters.has(param)) {
                allParameters.set(param, {
                  name: param,
                  sources: new Set()
                });
              }
              allParameters.get(param).sources.add('button');
            });

            if (btn.url) {
              extractParams(btn.url).forEach(param => {
                if (!allParameters.has(param)) {
                  allParameters.set(param, {
                    name: param,
                    sources: new Set()
                  });
                }
                allParameters.get(param).sources.add('button');
              });
            }

            const buttonObj = {
              type: btnType,
              text: btn.text,
              index
            };

            if (btnType === 'url' && btn.url) {
              buttonObj.url = btn.url;
            }

            if (btnType === 'phone_number' && btn.phone_number) {
              buttonObj.phone_number = btn.phone_number;
            }

            components.push(buttonObj);
          });
        }
      });

      return {
        name: template.name,
        language_code: template.language,
        ...(components.length > 0 && { components }),
        ...(allParameters.size > 0 && {
          parameters: Array.from(allParameters.values()).map(p => ({
            name: p.name,
            sources: Array.from(p.sources)
          }))
        })
      };
    });

    return res.json({
      count: formattedTemplates.length,
      whatsappTemplates: formattedTemplates
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}