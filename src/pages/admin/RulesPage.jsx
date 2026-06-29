import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import Textarea from '@/components/forms/Textarea';
import Input from '@/components/forms/Input';
import PasswordInput from '@/components/forms/PasswordInput';
import { useToast } from '@/context/ToastContext';
import authService from '@/services/authService';

const defaultRules = `1. All shelters must maintain valid SHL license.
2. Pets must be vaccinated before listing.
3. Adoption applications reviewed within 14 days.
4. Veterinarians must hold valid VET license.
5. Donations are non-refundable unless fraud is proven.`;

export default function RulesPage() {
  const [rules, setRules] = useState(defaultRules);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSmtpSettings() {
      try {
        setLoading(true);
        const data = await authService.getSmtpSettings();
        if (data) {
          setSmtpHost(data.smtp_host || '');
          setSmtpPort(data.smtp_port || '');
          setSmtpUsername(data.smtp_username || '');
          setSmtpPassword(data.smtp_password || '');
        }
      } catch (err) {
        toast('Failed to load SMTP settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchSmtpSettings();
  }, [toast]);

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    try {
      setSavingSmtp(true);
      await authService.saveSmtpSettings({
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_username: smtpUsername,
        smtp_password: smtpPassword
      });
      toast('SMTP settings saved and applied!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save SMTP settings', 'error');
    } finally {
      setSavingSmtp(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage global platform configurations, business rules, and email delivery settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rules Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Platform Rules & Policies</h2>
            <p className="text-xs text-slate-500 mb-4">Update policies that apply across adopters, shelters, and veterinarians.</p>
            <Textarea 
              label="Rules & Regulations" 
              value={rules} 
              onChange={(e) => setRules(e.target.value)} 
              rows={10} 
            />
          </div>
          <Button className="mt-4 w-full" onClick={() => toast('Rules updated successfully', 'success')}>
            Save Rules
          </Button>
        </div>

        {/* SMTP Settings Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Mail Server (SMTP) Settings</h2>
          <p className="text-xs text-slate-500 mb-4">Configure a real SMTP server to send verification codes to adopters.</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <Input
                label="SMTP Host"
                placeholder="e.g. smtp.gmail.com or smtp.mailtrap.io"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                required
              />
              <Input
                label="SMTP Port"
                placeholder="e.g. 587 or 465"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                required
              />
              <Input
                label="SMTP Username"
                type="email"
                placeholder="e.g. your-email@gmail.com"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                required
              />
              <PasswordInput
                label="SMTP Password / App Password"
                placeholder="Enter password or Gmail App Password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
              />
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
                <strong>Tip:</strong> For Gmail, do not use your normal password. Create an <strong>App Password</strong> in your Google Account security settings.
              </div>

              <Button 
                type="submit" 
                className="w-full mt-2" 
                loading={savingSmtp}
              >
                Save & Apply SMTP Settings
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
