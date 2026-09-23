import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleDarkMode } from "../../actions/themeActions";

const General = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: any) => state.theme.mode);

  const handleThemeChange = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <div>
      <h2 className="mb-4 text-[22px] font-bold">General Settings</h2>
      <p className="mb-4 text-[13px] text-muted">Toggle dark mode:</p>
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            checked={currentTheme === "dark"}
            onChange={handleThemeChange}
            className="sr-only"
          />
          <div
            className="h-8 w-14 rounded-full transition-colors"
            style={{ background: currentTheme === "dark" ? "var(--ot-accent)" : "#ccc" }}
          />
          <div
            className="absolute top-1 h-6 w-6 rounded-full bg-white transition-all"
            style={{ left: currentTheme === "dark" ? 28 : 4 }}
          />
        </div>
        <span className="text-[13px]">{currentTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
      </label>
    </div>
  );
};

export default General;
