const nodemailer = require('nodemailer');

async function main() {
  console.log('Setting up test email account...');
  
  try {
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Test account created successfully!');
    console.log('Add these to your .env.local file:');
    console.log(`ETHEREAL_EMAIL=${testAccount.user}`);
    console.log(`ETHEREAL_PASSWORD=${testAccount.pass}`);
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    // Send a test email
    console.log('Sending a test email...');
    const info = await transporter.sendMail({
      from: '"FableSpace" <test@example.com>',
      to: testAccount.user,
      subject: 'Test Email',
      text: 'This is a test email from FableSpace',
      html: '<b>This is a test email from FableSpace</b>',
    });
    
    console.log('Test email sent!');
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
