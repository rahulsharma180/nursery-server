import sendEmail from "./emailService.js";

const sendEmailFun = async ({ sendTo, subject, text, html }) => {
    try {
        await sendEmail({ to: sendTo, subject, text, html });
        return true;
    } catch (error) {
        console.error("Email send failed:", error);
        return false;
    }
};

export default sendEmailFun;
