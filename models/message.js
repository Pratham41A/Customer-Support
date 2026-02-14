//messageId : GRAPH
//internetMessageId : Global Message Identifier 
//In-Reply-To Header = internetMessageId

const mongoose = require("mongoose");
const { Schema, model, models } = mongoose;

const messageSchema = new Schema(
  {
    isSent:{
      type:Boolean
    },
    inbox:{
      type:Schema.Types.ObjectId,
      ref:'Inbox'
    },
    subject: {
      type: String,
    },

    content: {
      type: Object,
    },
    contentType:{
      type: String,
      enum: ['special', 'normal', 'html'],
    },
    attachments: {
    type: [String]
    },
    source: {
      type: String,
      enum: ["whatsapp", "email","web"]
    },
    inReplyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message"
    },
    internetMessageId: {
      type: String
    },
    messageId: {
      type: String
    },
    queryType:{
      type:String
    },
    status:{
      type:String,
      enum:["read","unread","resolved"]
    }
  },

  { timestamps: true,
    strict:false
   }
);

const Message = models.Message || model("Message", messageSchema);
module.exports = { Message };
