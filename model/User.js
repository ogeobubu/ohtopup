const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema({
bankName: {
type: String,
required: true,
trim: true,
},
accountNumber: {
type: String,
required: true,
trim: true,
},
isActive: {
type: Boolean,
default: true,
},
}, { timestamps: true });

const userSchema = new mongoose.Schema(
{
username: {
type: String,
required: true,
unique: true,
trim: true,
},
email: {
type: String,
required: true,
unique: true,
lowercase: true,
trim: true,
match: [/.+@.+..+/, "Please enter a valid email address"],
},
phoneNumber: {
type: String,
required: true,
unique: true,
trim: true,
},
referralCode: {
type: String,
trim: true,
default: null,
},
password: {
type: String,
required: true,
minlength: 6,
},
isVerified: {
type: Boolean,
default: false,
},
confirmationCode: {
type: String,
default: null,
},
confirmationCodeExpires: {
type: Date,
default: null,
},
otp: {
type: String,
default: null,
},
otpExpires: {
type: Date,
default: null,
},
phoneNumberVerified: {
type: Boolean,
default: false,
},
phoneNumberVerificationCode: {
type: String,
default: null,
},
phoneNumberVerificationCodeExpires: {
type: Date,
default: null,
},
source: {
type: String,
required: true,
},
role: {
type: String,
default: "user",
},
isDeleted: {
type: Boolean,
default: false,
},
emailNotificationsEnabled: {
type: Boolean,
default: false,
},
bankAccounts: [bankAccountSchema],
},
{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;