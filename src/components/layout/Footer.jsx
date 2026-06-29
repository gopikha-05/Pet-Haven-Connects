import { Link } from 'react-router-dom';
import { PiPawPrintFill } from 'react-icons/pi';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg mb-4">
              <PiPawPrintFill className="text-primary-400 text-2xl" />
              PetHaven Connect
            </Link>
            <p className="text-sm text-slate-400">Connecting loving homes with pets in need. Adoption, care, and community — all in one platform.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {['/', '/about', '/stories', '/faq', '/donate'].map((path) => (
                <li key={path}><Link to={path} className="hover:text-primary-400 transition">{path === '/' ? 'Home' : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">For Partners</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-primary-400">Shelter Registration</Link></li>
              <li><Link to="/register" className="hover:text-primary-400">Vet Registration</Link></li>
              <li><Link to="/login" className="hover:text-primary-400">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><FiMail className="text-primary-400" /> support@pethaven.com</li>
              <li className="flex items-center gap-2"><FiPhone className="text-primary-400" /> +91 1800-PET-CARE</li>
              <li className="flex items-center gap-2"><FiMapPin className="text-primary-400" /> Mumbai, India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} PetHaven Connect-Trusted platform for pet adoption and rescue.
        </div>
      </div>
    </footer>
  );
}
