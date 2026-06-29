import { useState } from 'react';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import Input from './Input';

export default function PasswordInput({ label = 'Password', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <Input label={label} type={show ? 'text' : 'password'} icon={FiLock} {...props} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
        tabIndex={-1}
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
}
