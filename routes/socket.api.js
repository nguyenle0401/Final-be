const socket_io = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const GlobalMessage = require("../models/GlobalMessage");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
//Adding imports
const Idiom = require("../models/Idiom");
// const User = require("../models/User");

// End adding imports

const io = socket_io();
const socketApi = {};
let onlineUsers = {};
const socketTypes = {
  NOTIFICATION: "NOTIFICATION",
  GLOBAL_MSG_INIT: "GLOBAL_MESSAGE_INIT",
  GLOBAL_MSG_SEND: "GLOBAL_MSG_SEND",
  GLOBAL_MSG_RECEIVE: "GLOBAL_MSG_RECEIVE",
  PRIVATE_MSG_INIT: "PRIVATE_MSG_INIT",
  PRIVATE_MSG_SEND: "PRIVATE_MSG_SEND",
  PRIVATE_MSG_RECEIVE: "PRIVATE_MSG_RECEIVE",
  ERROR: "ERROR",
};

socketApi.io = io;

let playingInfo = {};

const numberOfQuestion = 5;

const notPlaying = (meId) => {
  console.log("meId", onlineUsers);
  return Object.keys(onlineUsers).filter(
    (id) => !Object.keys(playingInfo).includes(id) && meId !== id
  );
};
const getOpponentId = (meId) => {
  let notPlayingList = notPlaying(meId);
  return notPlayingList[0];
};

io.use((socket, next) => {
  try {
    const accessToken = socket.handshake.query.accessToken;
    jwt.verify(accessToken, JWT_SECRET_KEY, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return next(new Error("Token expired"));
        } else {
          return next(new Error("Token is invalid"));
        }
      }
      socket.userId = payload._id;
    });
    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", async function (socket) {
  // onlineUsers[socket.userId] = socket.id;
  socket.on("online", async (meId) => {
    console.log("Connected", meId);
    onlineUsers[meId] = socket.id;
    let opId = getOpponentId(meId);
    // playingIds.push(opId);
    if (opId) {
      playingInfo[meId] = { opponent: opId, clickState: false };
      playingInfo[opId] = { opponent: meId, clickState: false };
      let op = await User.find({ _id: opId });
      let me = await User.find({ _id: meId });
      socket.emit("opponent", op);
      io.to(onlineUsers[opId]).emit("opponent", me);
      //Update Score

      let rawQuestions = await Idiom.aggregate([
        { $match: {} },
        { $sample: { size: numberOfQuestion } },
        { $project: { _id: 1, title: 1, content: 1 } },
      ]);
      const fakePromises = rawQuestions.map(async (rawQuestion) => {
        return await Idiom.aggregate([
          { $match: { _id: { $ne: rawQuestion._id } } },
          { $sample: { size: 3 } },
          { $project: { _id: 1, content: 1 } },
        ]);
      });
      try {
        let fake = await Promise.all(fakePromises);
        const questions = rawQuestions.map((rawQuestion, index) => {
          return {
            ...rawQuestion,
            answer0: rawQuestion.content,
            answer1: fake[index][0].content,
            answer2: fake[index][1].content,
            answer3: fake[index][2].content,
          };
        });
        socket.emit("questions", questions);
        io.to(onlineUsers[opId]).emit("questions", questions);
      } catch (err) {
        console.error(err);
      }
    }
  });

  socket.on("updateScore", async (meId, score) => {
    let opId = playingInfo[meId].opponent;
    io.to(onlineUsers[opId]).emit("opScore", score);
  });

  socket.on("clickState", async (meId) => {
    console.log("clickState");
    let opId = playingInfo[meId].opponent;
    playingInfo[meId].clickState = !playingInfo[meId].clickState;
    if (playingInfo[meId].clickState === playingInfo[opId].clickState) {
      socket.emit("next");
      io.to(onlineUsers[opId]).emit("next");
    }
  });

  socket.on("offline", async (meId) => {
    console.log("Disconnected", meId);
    if (playingInfo[meId]) {
      let opId = playingInfo[meId].opponent;
      if (opId) {
        io.to(onlineUsers[opId]).emit("opponent", null);
        delete playingInfo[opId];
      }
    }
    delete onlineUsers[meId];
    delete playingInfo[meId];
  });

  socket.on(socketTypes.GLOBAL_MSG_INIT, async () => {
    try {
      let globalMessages = await (
        await GlobalMessage.find({}, "-updatedAt")
          .sort({ _id: -1 })
          .limit(100)
          .populate("user", "name avatarUrl")
      ).reverse();
      io.emit(socketTypes.NOTIFICATION, {
        onlineUsers: Object.keys(onlineUsers),
        globalMessages,
      });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(socketTypes.GLOBAL_MSG_SEND, async (msg) => {
    try {
      if (msg.body) {
        const user = await User.findById(msg.from, "name avatarUrl");
        if (user && user._id.equals(socket.userId)) {
          const globalMessage = await GlobalMessage.create({
            user,
            body: msg.body,
          });
          io.emit(socketTypes.GLOBAL_MSG_RECEIVE, globalMessage);
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(socketTypes.PRIVATE_MSG_INIT, async (msg) => {
    try {
      const user = await User.findById(msg.from, "name avatarUrl");
      const toUser = await User.findById(msg.to, "name avatarUrl");
      let conversation;
      if (!msg.conversation) {
        conversation = await Conversation.findOneAndUpdate(
          {
            // users: {
            //   $all: [
            //     { $elemMatch: { $eq: user._id } },
            //     { $elemMatch: { $eq: toUser._id } },
            //   ],
            //   $size: 2,
            // },
            $or: [
              { users: [user._id, toUser._id] },
              { users: [toUser._id, user._id] },
            ],
          },
          { $setOnInsert: { users: [user._id, toUser._id] } },
          {
            fields: { users: 0 },
            upsert: true,
            new: true,
          }
        );
      } else {
        conversation = await Conversation.findById(msg.conversation);
      }

      if (conversation) {
        // Get old messages
        let privateMessages = await (
          await Message.find({ conversation: conversation._id }, "-updatedAt")
            .sort({ createdAt: -1 })
            .limit(100)
            .populate("user", "name avatarUrl")
        ).reverse();

        let selectedConversation = conversation.toJSON();
        selectedConversation.to = toUser;

        io.to(onlineUsers[msg.from]).emit(socketTypes.NOTIFICATION, {
          selectedConversation,
          privateMessages,
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(socketTypes.PRIVATE_MSG_SEND, async (msg) => {
    try {
      const user = await User.findById(msg.from, "name avatarUrl");
      const toUser = await User.findById(msg.to, "name avatarUrl");
      if (user && user._id.equals(socket.userId)) {
        if (msg.body) {
          let newMessage = await Message.create({
            conversation: msg.conversation,
            user: user._id,
            to: toUser._id,
            body: msg.body,
          });
          await Conversation.findOneAndUpdate(
            { _id: msg.conversation },
            { lastMessage: msg.body, lastMessageUpdatedAt: Date.now() }
          );
          newMessage = newMessage.toJSON();
          newMessage.user = user;
          io.to(onlineUsers[msg.from]).emit(
            socketTypes.PRIVATE_MSG_RECEIVE,
            newMessage
          );
          if (msg.from !== msg.to) {
            io.to(onlineUsers[msg.to]).emit(
              socketTypes.PRIVATE_MSG_RECEIVE,
              newMessage
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("error", (error) => {
    console.log(error);
  });

  socket.on("disconnect", () => {
    // console.log("Disconnected", socket.userId);
    // delete onlineUsers[socket.userId];
    io.emit(socketTypes.NOTIFICATION, {
      onlineUsers: Object.keys(onlineUsers),
    });
    // console.log("Number of online users", Object.keys(onlineUsers).length);
  });
});

module.exports = socketApi;
