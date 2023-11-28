import { ReactNode } from "react";

const stylesByType = {
  primary:
    "inline-block m-3 cursor-pointer bg-green-600 text-white font-bold py-2 px-4 rounded",
  secondary:
    "inline-block m-3 cursor-pointer text-green-500 border border-green-500 font-bold py-2 px-4 rounded bg-transparent",
  danger:
    "inline-block m-3 cursor-pointer bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold py-2 px-4 rounded",
};

type ButtonProps = {
  children: ReactNode | ReactNode[];
  onClick?: () => void;
  type?: keyof typeof stylesByType;
};

function Button({ children, onClick, type }: ButtonProps) {
  return (
    <div className={stylesByType[type ?? "primary"]} onClick={onClick}>
      {children}
    </div>
  );
}

export default Button;
