const mongoose = require("mongoose");

const fakeUser = (req, res, next) => {
  const FAKE_USER_ID = "64faaa000000000000000001";
  req.user = {
    _id: new mongoose.Types.ObjectId(FAKE_USER_ID),
    name: "Fake User",
    role: "USER",
  };
  next();
};

module.exports = fakeUser;
