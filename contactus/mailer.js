const nodemailer = require('nodemailer');

const sendmail=async(email,name,message)=>{
    try {
        console.log(email);
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "gsdgv123456@gmail.com",
                pass: "hfmp uwve elmv poaz",
            },
        });
        
        const info = await transporter.sendMail({
            from: "gsdgv123456@gmail.com",
            to: email, 
            subject: `person name ${name}`,
            text: `You have successfully reached out to us ${name}:->and your message :${message}`,
           
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error; 
    }
}

module.exports=sendmail;