const initialState = {
  admin: null,
  users: [],
  notifications: [],
  services: [],
};

const adminReducer = (state = initialState, action) => {
  switch (action.type) {
    case "FETCH_ADMIN_SUCCESS":
      return { ...state, admin: action.payload };
    case "FETCH_USERS_SUCCESS":
      return { ...state, users: action.payload };
    case "UPDATE_ADMIN":
      return { ...state, admin: action.payload };
    case "GET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
      case "GET_SERVICES":
      return { ...state, loading: false, services: action.payload };
    case "CREATE_SERVICE":
      return { ...state, services: [action.payload, ...state.services] };
    case "UPDATE_SERVICE":
      return {
        ...state,
        services: state.services.map((service) =>
          service._id === action.payload._id ? action.payload : service
        ),
      };
    case "DELETE_SERVICE":
      return {
        ...state,
        services: state.services.filter(
          (service) => service.id !== action.payload
        ),
      };
    default:
      return state;
  }
};

export default adminReducer;
