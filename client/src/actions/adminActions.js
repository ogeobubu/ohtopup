export const setUser = (userData) => ({
    type: "FETCH_ADMIN_SUCCESS",
    payload: userData,
  });

export const setUsers = (userData) => ({
    type: "FETCH_USERS_SUCCESS",
    payload: userData,
  });