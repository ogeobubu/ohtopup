import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../api";
import { toast } from "react-toastify";
import { updateUserDispatch } from "../../actions/userActions";
import { useSelector, useDispatch } from "react-redux";
import { FiBell, FiSmartphone } from "react-icons/fi";
import usePushNotifications from "../../hooks/usePushNotifications";

const panelClass = "w-full rounded-md border border-line p-6";

const Notification = () => {
  const dispatch = useDispatch();
  const emailNotificationsEnabled = useSelector(
    (state: any) => state.user?.user?.emailNotificationsEnabled
  );
  const [isOn, setIsOn] = React.useState(emailNotificationsEnabled);
  const { supported, isSubscribed, subscribe, unsubscribe, loading } = usePushNotifications();

  useEffect(() => {
    setIsOn(emailNotificationsEnabled);
  }, [emailNotificationsEnabled]);

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => updateUser({ emailNotificationsEnabled: enabled }),
    onSuccess: (data) => {
      toast.success("Notification preference updated successfully!");
      dispatch(updateUserDispatch(data));
    },
    onError: (error: any) => {
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
      {supported && (
        <div className={panelClass}>
          <div className="mb-4 flex items-center gap-3">
            <FiSmartphone className="text-lg" />
            <h2 className="text-2xl font-bold">Push Notifications</h2>
          </div>
          <p className="mb-4 text-sm text-muted">
            Get real-time alerts in your browser for transactions and important updates.
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-ink">Browser push notifications</span>
            <button
              onClick={handlePushToggle}
              disabled={loading}
              className="relative inline-flex h-6 w-12 cursor-pointer items-center rounded-full transition-colors duration-200"
              style={{ background: isSubscribed ? "#22c55e" : "#d1d5db" }}
            >
              <span
                className="absolute left-0 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: isSubscribed ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
          </div>
        </div>
      )}

      <div className={panelClass}>
        <div className="mb-4 flex items-center gap-3">
          <FiBell className="text-lg" />
          <h2 className="text-2xl font-bold">Email Notifications</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-muted">
            Receive OhTopUp news, announcements, and product updates in your email inbox.
          </label>
          <button
            onClick={handleCheckboxChange}
            className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
            style={{ background: isOn ? "#22c55e" : "#d1d5db" }}
          >
            <span
              className="absolute left-0 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: isOn ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
