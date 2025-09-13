import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../api";
import { toast } from "react-toastify";
import { updateUserDispatch } from "../../actions/userActions";
import { useSelector, useDispatch } from "react-redux";

const Notification = () => {
  const dispatch = useDispatch();
  const emailNotificationsEnabled = useSelector(
    (state: any) => state.user?.user?.emailNotificationsEnabled
  );
  const [isOn, setIsOn] = React.useState(emailNotificationsEnabled);

  // Synchronize local state with Redux state
  useEffect(() => {
    setIsOn(emailNotificationsEnabled);
  }, [emailNotificationsEnabled]);

  const mutation = useMutation({
    mutationFn: (emailNotificationsEnabled: boolean) =>
      updateUser({ emailNotificationsEnabled }),
    onSuccess: (data) => {
      toast.success("Notification preference updated successfully!");
      dispatch(updateUserDispatch(data));
    },
    onError: (error) => {
      toast.error("Error updating notification preference: " + error.message);
    },
  });

  const handleCheckboxChange = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    mutation.mutate(newValue);
  };

  return (
    <div className="p-6 border border-solid rounded-md border-gray-200 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4">Notification</h2>
      </div>
      <div className="my-5">
        <form className="space-y-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={isOn}
              onChange={handleCheckboxChange}
              className="mr-2 w-6 h-6"
            />
            <label className="text-gray-600 dark:text-white">
              Receive OhTopUp news, announcements, and product updates in your
              email inbox.
            </label>
          </div>
          {/* Removed the submit button since we update on checkbox click */}
        </form>
      </div>
    </div>
  );
};

export default Notification;