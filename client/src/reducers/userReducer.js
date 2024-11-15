const initialState = {
  user: null,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "FETCH_USER_SUCCESS":
      return { ...state, user: action.payload };
    case "UPDATE_USER_SUCCESS":
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

export default userReducer;
