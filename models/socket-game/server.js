const User = require("../User");
const Room = require("./room");
const Score = require("./score");

class Server {
  constructor(user) {
    this.user = user;
  }

  async joinRoom(roomID) {
    const room = await Room.findOne({ _id: roomID });
    if (!room) {
      throw new Error("Wrong room ID");
    }
    this.user.room = room;
    await this.user.save();
    return room;
  }

  async score(number) {
    // insert a doc to Score model;
    let score = await Score.create({
      score: message,
      user: this.user._id,
      room: this.user.room._id,
    });
    score = await Score.findById(score._id).populate("user");
    return score;
  }

  static async checkUser(sid) {
    let user = await User.findOne({ token: sid }).populate("room");
    if (!user) throw new Error("User not found");
    return new Server(user);
  }

  static async login(name, sID) {
    //sID == token
    let user = await User.findOne({ name });
    if (!user) {
      user = await User.create({ name });
    }
    user.token = sID;
    await user.save();

    return user;
  }
}

module.exports = Server;
