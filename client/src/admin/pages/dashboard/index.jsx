import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../api";
import { setUser } from "../../../actions/adminActions";

const Dashboard = () => {
  const dispatch = useDispatch();

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  useEffect(() => {
    if (user) {
      dispatch(setUser(user));
    }
  }, [user, dispatch]);

  return (
    <div>
      {isUserLoading && <p>Loading user...</p>}
      {isUserError && <p>Error loading user: {userError.message}</p>}
      {user && (
        <div>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;