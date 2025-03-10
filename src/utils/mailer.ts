import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: 'manojseetaram.artytech@gmail.com',
    pass: 'adyj uoak rlau vbvu',
  },
});

export const sendMail = async (to: string, subject: string, text: string) => {
  await transporter.sendMail({
    from: 'manojseetaram.artytech@gmail.com',
    to,
    subject,
    text,
  });
};