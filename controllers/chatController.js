const Message = require("../model/Message");

const sendMessage = async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    const newMessage = new Message({
      sender,
      receiver,
      message,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Failed to send message", error });
  }
};

const getMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: "6749f188695e72f734794e58", receiver: userId },
        { sender: userId, receiver: "6749f188695e72f734794e58" },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages", error });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};
