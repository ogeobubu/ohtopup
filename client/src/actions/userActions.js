import { getUser } from "../api";

export const fetchUser = () => async (dispatch) => {
  dispatch({ type: "FETCH_USER_REQUEST" });
  try {
    const response = await getUser();
    dispatch({ type: "FETCH_USER_SUCCESS", payload: response.data });
  } catch (error) {
    dispatch({ type: "FETCH_USER_FAILURE", payload: error.message });
  }
};

export const setUser = (userData) => ({
    type: "FETCH_USER_SUCCESS",
    payload: userData,
  });