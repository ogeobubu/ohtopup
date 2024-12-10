import { TOGGLE_DARK_MODE } from '../actions/themeActions';

const initialState = {
  isDarkMode: localStorage.getItem('theme') === 'dark',
};

const themeReducer = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_DARK_MODE:
      const newMode = !state.isDarkMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return { ...state, isDarkMode: newMode };
    default:
      return state;
  }
};

export default themeReducer;