import { combineReducers } from 'redux';
import userReducer from './userReducer';
import themeReducer from './themeReducer';
import adminReducer from './adminReducer';

const rootReducer = combineReducers({
  user: userReducer,
  theme: themeReducer,
  admin: adminReducer,
});

export default rootReducer;