import React from "react";
import logoLight from "../../assets/logo/ohtopup-high-resolution-logo.svg";
import logoDark from "../../assets/logo/logo-color.svg";

const Logo = ({ darkMode, className }) => {
  return (
    <div className="w-[150px] h-[150px]">
      <img
        src={darkMode ? logoDark : logoLight}
        className={className ? className : "w-full h-full object-contain"}
      />
    </div>
  );
};

export default Logo;
