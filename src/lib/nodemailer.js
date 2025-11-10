import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "brevo",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
  },
});

const SendEmail = async ({ to, subject, body }) => {
    const response = await transporter.sendMail({
        from: process.env.EMAIL_SENDER,
        to,
        subject, 
        html: body,
    });

    return response;
}

export default SendEmail;