const { sendWaitlistEmail } = require("./email");
const Waitlist = require("../model/Waitlist");

const createWaitlist = async (req, res) => {
  const { email } = req.body;

  try {
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return res.status(400).json({ message: "Email already on the waitlist" });
    }

    const newEntry = new Waitlist({ email });
    await newEntry.save();

    await sendWaitlistEmail(email);

    res.status(201).json({ message: "Successfully added to the waitlist" });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    res.status(500).json({ message: "Error adding to waitlist" });
  }
};

const getWaitlist = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
  
    try {
      const skip = (page - 1) * limit;
  
      const searchQuery = search ? { email: { $regex: search, $options: 'i' } } : {};
  
      const waitlistEntries = await Waitlist.find(searchQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .exec();
  
      const totalEntries = await Waitlist.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalEntries / limit);
  
      const emails = waitlistEntries.map(entry => entry.email);
      
      res.status(200).json({
        totalEntries,
        totalPages,
        currentPage: parseInt(page),
        emails,
      });
    } catch (error) {
      console.error("Error retrieving waitlist:", error);
      res.status(500).json({ message: "Error retrieving waitlist" });
    }
  };

const sendWaitlistEmails = async (req, res) => {
    const { emails, message, subject } = req.body;
  
    try {
      const waitlistEntries = await Waitlist.find();
      const allEmails = waitlistEntries.map(entry => entry.email);
  
      const targetEmails = emails && emails.length ? emails : allEmails;
  
      for (const email of targetEmails) {
        await sendWaitlistEmail(email, subject, message);
      }
  
      res.status(200).json({ message: "Emails sent successfully" });
    } catch (error) {
      console.error("Error sending emails:", error);
      res.status(500).json({ message: "Error sending emails" });
    }
  };

module.exports = {
  createWaitlist,
  getWaitlist,
  sendWaitlistEmails,
};