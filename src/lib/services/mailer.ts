import nodemailer from 'nodemailer';
import config from '../config';

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  if (config.SMTP_USER && config.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`📧 Using Ethereal email: ${testAccount.user}`);
  }

  return transporter;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });

    if (config.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Email preview: ${previewUrl}`);
      }
    }

    return info;
  } catch (err: any) {
    console.error('[Mailer] Failed to send email:', err.message);
  }
};

export const emailTemplates: Record<string, (data: any) => { subject: string; html: string }> = {
  bookingConfirmed: ({ patientName, doctorName, date, startTime, endTime, specialization }) => ({
    subject: `✅ Appointment Confirmed — Dr. ${doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">HealthCart</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Appointment Confirmed</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment has been confirmed. Here are the details:</p>
          <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p><strong>Specialization:</strong> ${specialization}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime} – ${endTime}</p>
          </div>
          <p style="color: #64748b; font-size: 0.9em;">Please arrive 10 minutes early. If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
        </div>
      </div>
    `,
  }),

  bookingCancelled: ({ patientName, doctorName, date, startTime, reason }) => ({
    subject: `❌ Appointment Cancelled — ${date} at ${startTime}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fc5c7d 0%, #6a3093 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">HealthCart</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Appointment Cancelled</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> at <strong>${startTime}</strong> has been cancelled.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You can book a new appointment anytime on HealthCart.</p>
        </div>
      </div>
    `,
  }),

  bookingRescheduled: ({ patientName, doctorName, oldDate, oldTime, newDate, newTime }) => ({
    subject: `🔄 Appointment Rescheduled — New date: ${newDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">HealthCart</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Appointment Rescheduled</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been rescheduled.</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #ef4444;">❌ Old: ${oldDate} at ${oldTime}</p>
            <p style="color: #22c55e;">✅ New: ${newDate} at ${newTime}</p>
          </div>
        </div>
      </div>
    `,
  }),
};
