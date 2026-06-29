import mongoose from 'mongoose';

const smtpSettingsSchema = new mongoose.Schema({
  smtp_host: { type: String, required: true },
  smtp_port: { type: Number, required: true },
  smtp_username: { type: String, required: true },
  smtp_password: { type: String, required: true }
});

export default mongoose.model('SmtpSettings', smtpSettingsSchema);
