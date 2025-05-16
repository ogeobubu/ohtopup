const Ticket = require("../model/Ticket");
const Notification = require("../model/Notification");
const User = require("../model/User");
const {
  sendWaitlistEmail,
} = require("./email/sendTransactionEmailNotification");

const generateTicketId = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `TK-${randomDigits}`;
};

const createTicket = async (req, res) => {
  try {
    const userRole = await User.find({ _id: req.user.id });
    const userId = req.user.id;
    const { title, description, email } = req.body;
    const ticketId = generateTicketId();

    const ticket = new Ticket({
      ticketId,
      userId,
      title,
      description,
    });
    await ticket.save();

    if (userRole.role === "user") {
      const creatorNotification = new Notification({
        userId,
        title: "New Ticket Created",
        message: `Your ticket with ID ${ticketId} has been created successfully.`,
        link: `/support`,
      });
      await creatorNotification.save();
    }

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
        link: `/support`,
      });
      await adminNotification.save();

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

    const user = await User.findById(ticket.userId);

    if (user.emailNotificationsEnabled) {
      if (role === "admin" && email) {
        await sendWaitlistEmail(
          email,
          "New Reply on Your Ticket",
          `You have a new reply on your ticket with ID ${ticket.ticketId}.`
        );
      } else if (role === "user") {
        console.log(
          "Email not provided for user; skipping email notification."
        );
      }
    } else {
      console.log("Email notifications are disabled for this user.");
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error posting reply:", error);
    res.status(500).json({ message: "Error posting reply" });
  }
};

const getTickets = async (req, res) => {
  const { page = 1, limit = 10, searchQuery = "" } = req.query;

  try {
    const query = searchQuery
      ? {
          $or: [
            { ticketId: { $regex: searchQuery, $options: "i" } },
            { title: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("userId")
      .populate("replies.userId")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Ticket.countDocuments(query);

    res.json({ tickets, totalCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets" });
  }
};

const getUserTickets = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, ticketId } = req.query;

  try {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const query = { userId };
    if (ticketId) {
      query.ticketId = ticketId;
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const totalTickets = await Ticket.countDocuments(query);

    res.json({
      tickets,
      totalCount: totalTickets,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Error fetching your tickets" });
  }
};

const updateTicket = async (req, res) => {
  const userRole = await User.find({ _id: req.user.id });
  const { status } = req.body;
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (userRole.role === "user") {
      const userNotification = new Notification({
        userId: ticket.userId,
        title: "Ticket Status Updated",
        message: `Your ticket with ID ${ticket.ticketId} has been updated to ${status}.`,
        link: `/support`,
      });
      await userNotification.save();

      const user = await User.findById(ticket.userId);
      if (user.emailNotificationsEnabled) {
        await sendWaitlistEmail(
          user.email,
          "Ticket Status Updated",
          `Your ticket with ID ${ticket.ticketId} has been updated to ${status}.`
        );
      }
    }

    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      const adminNotification = new Notification({
        userId: admin._id,
        title: "Ticket Status Updated",
        message: `Ticket ID ${ticket.ticketId} has been updated to ${status} by user ${ticket.userId}.`,
        link: `/support`,
      });
      await adminNotification.save();

      if (admin.email) {
        await sendWaitlistEmail(
          admin.email,
          "Ticket Status Updated",
          `Ticket ID ${ticket.ticketId} has been updated to ${status} by user ${ticket.userId}.`
        );
      }
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
