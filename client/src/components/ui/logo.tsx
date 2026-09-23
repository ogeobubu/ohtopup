import Brand from "./Brand";

type LogoProps = { href?: string; className?: string };

const Logo = ({ href = "/", className = "" }: LogoProps) => (
  <div className={`mb-[55px] ${className}`}>
    <Brand to={href} />
  </div>
);
export default Logo;
