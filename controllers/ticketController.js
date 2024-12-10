const Ticket = require("../model/Ticket");
const Notification = require("../model/Notification");
const User = require("../model/User");
const { sendWaitlistEmail } = require("./email");

const generateTicketId = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `TK-${randomDigits}`;
};

const createTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, email } = req.body;
    const ticketId = generateTicketId();

    const ticket = new Ticket({ ticketId, userId, title, description });
    await ticket.save();

    const creatorNotification = new Notification({
      userId,
      title: "New Ticket Created",
      message: `Your ticket with ID ${ticketId} has been created successfully.`,
      link: `/tickets/${ticketId}`,
    });
    await creatorNotification.save();

    // Find the user to check their notification preference
    const user = await User.findById(userId);
    if (user.emailNotificationsEnabled) {
      await sendWaitlistEmail(
        email,
        "Ticket Created",
        `Your ticket with ID ${ticketId} has been created successfully.`
      );
    }

    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      const adminNotification = new Notification({
        userId: admin._id,
        title: "New Ticket Alert",
        message: `A new ticket has been created with ID ${ticketId} by user ${userId}.`,
        link: `/tickets/${ticketId}`,
      });
      await adminNotification.save();

      // Send email to admin if they have a valid email
      if (admin.email) {
        await sendWaitlistEmail(
          admin.email,
          "New Ticket Created",
          `A new ticket with ID ${ticketId} has been created by user ${userId}.`
        );
      }
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Failed to create ticket" });
  }
};

const replyTicket = async (req, res) => {
  const { id } = req.params;
  const { userId, content, role, email } = req.body;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ message: "Invalid role" });
    }

    ticket.replies.push({ userId, role, content });
    await ticket.save();

    const notification = new Notification({
      userId: ticket.userId,
      title: "New Reply to Your Ticket",
      message: `You have a new reply on your ticket with ID ${ticket.ticketId}.`,
      link: `/support`,
    });
    await notification.save();

    // Check if the user wants to receive email notifications
    const user = await User.findById(ticket.userId);
    if (user.emailNotificationsEnabled) {
      await sendWaitlistEmail(
        email,
        "New Reply on Your Ticket",
        `You have a new reply on your ticket with ID ${ticket.ticketId}.`
      );
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Error posting reply" });
  }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .populate("userId")
      .populate("replies.userId");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets" });
  }
};

const getUserTickets = async (req, res) => {
  const userId = req.user.id;
  try {
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your tickets" });
  }
};

const updateTicket = async (req, res) => {
  const { status } = req.body; // Removed email from here; we will fetch it from the user
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const notification = new Notification({
      userId: ticket.userId,
      title: "Ticket Status Updated",
      message: `Your ticket with ID ${ticket.ticketId} has been updated to ${status}.`,
      link: `/support`,
    });
    await notification.save();

    // Check if the user wants to receive email notifications
    const user = await User.findById(ticket.userId);
    if (user.emailNotificationsEnabled) {
      await sendWaitlistEmail(
        user.email, // Use the user's email
        "Ticket Status Updated",
        `Your ticket with ID ${ticket.ticketId} has been updated to ${status}.`
      );
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Error updating ticket" });
  }
};

module.exports = {
  createTicket,
  replyTicket,
  getTickets,
  getUserTickets,
  updateTicket,
};