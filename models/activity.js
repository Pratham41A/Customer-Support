const mongoose = require("mongoose");
const { Schema, model, models } = mongoose;

const activitySchema = new Schema(
  {
    inbox: {
      type: Schema.Types.ObjectId,
      ref: "Inbox"
    },

    body: {
      type: String
    },

    dueDate: {
      type: Date
    }
  },

  {
    timestamps: true,
    strict: false,
  }
);

const Activity = models.Activity || model("Activity", activitySchema);
module.exports = { Activity };
