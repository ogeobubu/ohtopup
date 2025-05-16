export const setAdminUser = (userData) => ({
  type: "FETCH_ADMIN_SUCCESS",
  payload: userData,
});

export const setUsers = (userData) => ({
  type: "FETCH_USERS_SUCCESS",
  payload: userData,
});

export const updateAdminRedux = (userData) => ({
  type: "UPDATE_ADMIN",
  payload: userData,
});

export const getNotifications = (userData) => ({
  type: "GET_NOTIFICATIONS",
  payload: userData,
});

export const addNotification = (notification) => ({
  type: 'ADD_NOTIFICATION',
  payload: notification,
});

export const removeNotification = (id) => ({
  type: 'REMOVE_NOTIFICATION',
  payload: id,
});

export const getServicesDispatch = (data) => ({
  type: "GET_SERVICES",
  payload: data,
});

export const addService = (service) => ({
  type: 'CREATE_SERVICE',
  payload: service,
});

export const updateServiceDispatch = (id) => ({
  type: 'UPDATE_SERVICE',
  payload: id,
});

export const removeService = (id) => ({
  type: 'REMOVE_SERVICE',
  payload: id,
});
