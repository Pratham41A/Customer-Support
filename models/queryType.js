const mongoose = require("mongoose");
const { Schema, model, models } = mongoose;

const queryTypeSchema = new Schema(
  {
    name: {
      type: String
    }
  },
  {
    timestamps: true,
    strict: false,
  }
);

const QueryType = models.QueryType || model("QueryType", queryTypeSchema);
module.exports = { QueryType };
