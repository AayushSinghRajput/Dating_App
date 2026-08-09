import User from "../models/userModel.js";

const MAX_CONTACTS = 5;

// @desc    Get the logged-in user's emergency contacts
// @route   GET /api/safety/emergency-contacts
// @access  Private
export const getEmergencyContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("emergencyContacts");
    res.status(200).json({ contacts: user?.emergencyContacts || [] });
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Replace the logged-in user's emergency contacts
// @route   PUT /api/safety/emergency-contacts
// @access  Private
export const updateEmergencyContacts = async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ message: "Contacts must be an array" });
    }
    if (contacts.length > MAX_CONTACTS) {
      return res.status(400).json({ message: `You can save up to ${MAX_CONTACTS} contacts` });
    }
    for (const c of contacts) {
      if (!c.name?.trim() || !c.phone?.trim()) {
        return res.status(400).json({ message: "Each contact needs a name and phone number" });
      }
    }

    const cleaned = contacts.map((c) => ({ name: c.name.trim(), phone: c.phone.trim() }));
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { emergencyContacts: cleaned },
      { new: true, runValidators: true }
    ).select("emergencyContacts");

    res.status(200).json({ contacts: user.emergencyContacts });
  } catch (error) {
    console.error("Error updating emergency contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};
