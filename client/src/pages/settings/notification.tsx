import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../api";
import { toast } from "react-toastify";
import { updateUserDispatch } from "../../actions/userActions";
import { useSelector, useDispatch } from "react-redux";
import { FiBell, FiSmartphone } from "react-icons/fi";
import usePushNotifications from "../../hooks/usePushNotifications";

const Notification = () => {
  const dispatch = useDispatch();
  const emailNotificationsEnabled = useSelector(
    (state: any) => state.user?.user?.emailNotificationsEnabled
  );
  const [isOn, setIsOn] = React.useState(emailNotificationsEnabled);
  const { supported, isSubscribed, subscribe, unsubscribe, loading } = usePushNotifications();

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

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Push notifications disabled");
    } else {
      const result = await subscribe();
      if (result) {
        toast.success("Push notifications enabled!");
      } else {
        toast.error("Could not enable push notifications");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      {supported && (
        <div className="p-6 border border-solid rounded-md ot-admin-border w-full">
          <div className="flex items-center gap-3 mb-4">
            <FiSmartphone className="text-lg" />
            <h2 className="text-2xl font-bold">Push Notifications</h2>
          </div>
          <p className="text-sm mb-4" style={{color:'var(--ot-muted)'}}>
            Get real-time alerts in your browser for transactions and important updates.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{color:'var(--ot-ink)'}}>
              Browser push notifications
            </span>
            <button
              onClick={handlePushToggle}
              disabled={loading}
              className="relative inline-flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200"
              style={{background: isSubscribed ? '#22c55e' : '#d1d5db'}}
            >
              <span
                className="absolute left-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200"
                style={{transform: isSubscribed ? 'translateX(24px)' : 'translateX(0)'}}
              />
            </button>
          </div>
        </div>
      )}

      {/* Email Notifications */}
      <div className="p-6 border border-solid rounded-md ot-admin-border w-full">
        <div className="flex items-center gap-3 mb-4">
          <FiBell className="text-lg" />
          <h2 className="text-2xl font-bold">Email Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm" style={{color:'var(--ot-muted)'}}>
            Receive OhTopUp news, announcements, and product updates in your
            email inbox.
          </label>
          <button
            onClick={handleCheckboxChange}
            className="relative inline-flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200"
            style={{background: isOn ? '#22c55e' : '#d1d5db'}}
          >
            <span
              className="absolute left-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200"
              style={{transform: isOn ? 'translateX(24px)' : 'translateX(0)'}}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;