import { TOGGLE_DARK_MODE } from '../actions/themeActions';

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme === 'dark';
  }
  
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const initialState = {
  isDarkMode: getInitialTheme(),
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