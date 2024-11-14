import React, { useState } from "react";
import { useSelector } from "react-redux"
import { FaEdit, FaTimes } from "react-icons/fa";

const Profile = () => {
    const user = useSelector(state => state.user.user)
  const [userInfo, setUserInfo] = useState({
    name: "ANDRETI OBUBU",
    email: "ogeobubu@gmail.com",
    uniqueId: "Prest85474",
    phoneNumber: "+2340814634713",
    country: "Nigeria",
    kycStatus: "Approved",
  });

  const [isPhoneNumberEditMode, setIsPhoneNumberEditMode] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState(user.phoneNumber);

  const handlePhoneNumberUpdate = () => {
    setUserInfo({ ...userInfo, phoneNumber: newPhoneNumber });
    setIsPhoneNumberEditMode(false);
  };

  const closeModal = () => {
    setIsPhoneNumberEditMode(false);
    setNewPhoneNumber(userInfo.phoneNumber);
  };

  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
          {userInfo.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user.username}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Unique ID:</span>
          <span>{user._id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Phone Number:</span>
          <div className="flex gap-2">
            <span>{user.phoneNumber}</span>{" "}
            <button onClick={() => setIsPhoneNumberEditMode(true)} className="text-blue-500 hover:text-blue-600">
              <FaEdit className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Country:</span>
          <span>{userInfo.country}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">KYC Status:</span>
          <span className="text-green-500 font-medium">
            {userInfo.kycStatus}
          </span>
        </div>
      </div>

      <div className="mt-6 text-right">
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
          Delete User Account
        </button>
      </div>


      {isPhoneNumberEditMode && (
        <div className="fixed top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white shadow-md rounded-md p-6 w-full max-w-md relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">Update Phone Number</h2>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Current Number:</span>
              <span>{userInfo.phoneNumber}</span>
            </div>
            <div className="mt-4">
              <label htmlFor="newPhoneNumber" className="block text-gray-500 mb-2">
                New Phone Number
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="newPhoneNumber"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handlePhoneNumberUpdate}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md ml-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
