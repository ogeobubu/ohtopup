const initialState = {
    admin: null,
    users: [],
  };
  
  const adminReducer = (state = initialState, action) => {
    switch (action.type) {
        case "FETCH_ADMIN_SUCCESS":
        return { ...state, admin: action.payload };
      case "FETCH_USERS_SUCCESS":
        return { ...state, users: action.payload };
      default:
        return state;
    }
  };
  
  export default adminReducer;
  