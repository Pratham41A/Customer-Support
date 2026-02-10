const mongoose = require("mongoose");
const Schema = mongoose.Schema

const inboxSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    dummyOwner:{
      type:Schema.Types.ObjectId,
      ref:'DummyUser'
    },
    preview: {
      type: Object
    },
    contentType: {
      type: String,
      enum: ['special', 'normal'],
    },
    status: {
      type: String,
      enum: ['unread', 'read','resolved'],
    },
    source: {
      type: String,
      enum: ['whatsapp', 'email', 'web'],
    },
    whatsappConversationEndDateTime:{
      type:Date
    },
    socketId:{
      type:String
    }
  },
  {
    timestamps: true, 
      strict: false,
  }
);


const Inbox = mongoose.model('Inbox', inboxSchema,'Inbox');

module.exports = {Inbox};
