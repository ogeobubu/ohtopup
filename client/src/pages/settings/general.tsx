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
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>General Settings</h2>
      <p style={{ color: 'var(--ot-muted)', marginBottom: 16, fontSize: 13 }}>Toggle dark mode:</p>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <input
            type="checkbox"
            checked={currentTheme === "dark"}
            onChange={handleThemeChange}
            style={{ display: 'none' }}
          />
          <div style={{ width: 56, height: 32, borderRadius: 16, background: currentTheme === "dark" ? 'var(--ot-accent)' : '#ccc' }} />
          <div style={{
            position: 'absolute', left: currentTheme === "dark" ? 28 : 4, top: 4,
            width: 24, height: 24, borderRadius: '50%', background: '#fff',
            transition: 'transform 0.2s'
          }} />
        </div>
        <span style={{ fontSize: 13 }}>
          {currentTheme === "dark" ? "Dark Mode" : "Light Mode"}
        </span>
      </label>
    </div>
  );
};

export default General;
