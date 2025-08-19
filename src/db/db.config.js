const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(
    process.env.MONGODB_URL || "mongodb://localhost:27017/mlm-db"
  );
};

module.exports = connectDb;
