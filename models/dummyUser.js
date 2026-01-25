const mongoose = require("mongoose");

const { Schema, model, models } = mongoose;

const dummyUserSchema = new Schema(
  {
    name: {
      type:String
    },
    mobileno:{
      type:String,
    },
    email:{
      type:String,
    }
  },
  {
    timestamps: true,
    strict: false,
  }
);

const DummyUser = models.DummyUser || model("DummyUser", dummyUserSchema);
module.exports = { DummyUser };
