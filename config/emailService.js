import http from 'http'
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // or use `host`, `port` if using SMTP
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL,
            to,
            subject,
            html,
        });

        console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

        console.log("Email sent:", info.messageId);
        // return info;
        return {success:true , messageId : info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email failed to send");
    }
};

export default sendEmail
