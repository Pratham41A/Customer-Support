const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const dailyResolutionSchema = new Schema({
  date: {
    type: Date,
    required: true,
    index: true,
    unique: true 
  },

  channels: {
    whatsapp: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    web: { type: Number, default: 0 }
  },

  queryTypes: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

const DailyResolution = model('DailyResolution', dailyResolutionSchema,'DailyResolution');  

module.exports = {DailyResolution};
