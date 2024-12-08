import React from "react";
import { Link } from "react-router-dom";
import logoLight from "../../assets/logo/ohtopup-high-resolution-logo.svg";
import logoDark from "../../assets/logo/logo-color.svg";

const Logo = ({ darkMode, className, href }) => {
  return (
    <div className="w-[150px] h-[150px]">
      <Link to={href}>
        <img
          src={darkMode ? logoDark : logoLight}
          className={className ? className : "w-full h-full object-contain"}
        />
      </Link>
    </div>
  );
};

export default Logo;
