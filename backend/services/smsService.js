/**
 * SMS Service Layer
 * 
 * This service provides a layer for SMS integration with providers like Twilio or AWS SNS.
 * Currently, it logs SMS notifications as pending for future integration.
 */

const SMS_CONFIGURED = false; // Set to true when SMS provider is configured

/**
 * Send SMS notification for complaint response
 * @param {string} phoneNumber - The phone number to send SMS to
 * @param {string} message - The SMS message content
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    if (!SMS_CONFIGURED) {
      console.log('[SMSService] SMS not configured. Storing as pending.');
      console.log(`[SMSService] Would send SMS to: ${phoneNumber}`);
      console.log(`[SMSService] Message: ${message}`);
      return { 
        success: false, 
        status: 'pending', 
        message: 'SMS provider not configured. Notification stored as pending.' 
      };
    }

    // TODO: Integrate with Twilio or AWS SNS
    // Example Twilio integration:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });

    console.log('[SMSService] SMS sent successfully to:', phoneNumber);
    return { success: true, status: 'sent' };
  } catch (error) {
    console.error('[SMSService] Error sending SMS:', error);
    return { success: false, status: 'failed', error: error.message };
  }
};

/**
 * Send complaint response SMS
 * @param {string} phoneNumber - The phone number
 * @param {string} userName - The user's name
 * @param {string} complaintId - The complaint ID
 * @param {string} status - The complaint status
 * @returns {Promise<Object>} - Result object
 */
export const sendComplaintResponseSMS = async (phoneNumber, userName, complaintId, status) => {
  const message = `Hello ${userName}, Your complaint #${complaintId} has been updated. Status: ${status}. Check your dashboard for details. - Pet Haven Connect`;
  return sendSMS(phoneNumber, message);
};

export default {
  sendSMS,
  sendComplaintResponseSMS
};
