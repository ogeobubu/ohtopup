import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleDarkMode } from "../../actions/themeActions";

const General = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.theme.mode);

  const handleThemeChange = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <div className="p-6 border border-solid rounded-md border-gray-200 w-full">
      <h2 className="text-2xl font-bold mb-4">General Settings</h2>
      <p className="mb-4 text-gray-600">Toggle dark mode:</p>
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={currentTheme === "dark"}
            onChange={handleThemeChange}
            className="hidden"
          />
          <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
          <div
            className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${
              currentTheme === "dark" ? "translate-x-6 bg-blue-500" : ""
            }`}
          ></div>
        </div>
        <span className="ml-3 text-gray-600">
          {currentTheme === "dark" ? "Dark Mode" : "Light Mode"}
        </span>
      </label>
    </div>
  );
};

export default General;