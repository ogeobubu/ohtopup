import Brand from "./Brand";

const Logo = ({ href = "/", className = "" }) => <div className={`ot-auth-brand ${className}`}><Brand to={href} /></div>;
export default Logo;
