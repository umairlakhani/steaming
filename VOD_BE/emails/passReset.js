dotenv = require("dotenv");
dotenv.config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

async function send(email, verificationNumber, fullName) {
  let check = `https://dev.mediapilot.io/#/reset-pass?email=${email}&token=${verificationNumber}`;
  try {
    // create reusable transporter object using Sendinblue's SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp-relay.sendinblue.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'mairlakhani@gmail.com', // Replace with your Sendinblue email
        pass: process.env.SENDINBLUE_API_KEY, // Replace with your Sendinblue API key
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"MPID" <your_sendinblue_email@example.com>', // sender address
      to: email, // list of receivers
      subject: "Email verification", // Subject line
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html style="width:100%;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0" xmlns="http://www.w3.org/1999/xhtml">
              <head>
            
                <!--[if !mso]><!- - -->
                <style type="text/css">
                  @import url(https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap);
                  @import url(https://fonts.googleapis.com/css?family=Open+Sans:400,400i,700,700i);
                  @import url(https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap);
                </style>
            
                <!--<![endif]-->
                <meta charset="UTF-8" />
                <meta content="width=device-width, initial-scale=1" name="viewport" />
                <meta name="x-apple-disable-message-reformatting" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta content="telephone=no" name="format-detection" />
                <title>Confirm your email</title>
            
                <!--[if (mso 16)]>
                <style type="text/css">
                a {text-decoration: none;}
                </style>
                <![endif]-->
            
                <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
            
                <!--[if gte mso 9]>
            <xml>
                <o:OfficeDocumentSettings>
                <o:AllowPNG></o:AllowPNG>
                <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
            
                <!--[if !mso]><!- - -->
            
                <!--<![endif]-->
            
                <!--[if !mso]><!- - -->
            
                <!--<![endif]-->
                <style type="text/css">
                  @media (min-width:600px) {
                    .logobt {
                      padding-top: 35px !important;
                      width: 100px !important;
                    }
                    .fbic {
                      margin-top: -1px !important;
                      width: 22px !important;
                    }
                    .igic {
                      margin-top: 0 !important;
                      width: 22px !important;
                      margin-left: 6px !important;
                      margin-right: 4px !important;
                    }
                    .twic {
                      margin-top: 2px !important;
                      width: 22px !important;
                    }
                  }
                  @media only screen and (max-width:600px) {
                    .title-center {
                      padding: 30px 25px 10px 25px !important;
                    }
                    .sublink {
                      font-size: 12px !important;
                    }
                    .nametext {
                      padding-top: 20px !important;
                      font-size: 17px !important;
                    }
                    .title-center-text {
                      font-size: 26px !important;
                      line-height: 1.3 !important;
                    }
                    .sub-text {
                      font-size: 12px !important;
                      padding-top: 30px !important;
                      padding-bottom: 20px !important;
                      padding-left: 20px !important;
                      padding-right: 20px !important;
                    }
                    .subtitle-center {
                      font-size: 16px !important;
                      line-height: 1.4 !important;
                      padding: 0px 25px 0px 25px !important;
                    }
                    .mainimgbl {
                      padding: 30px 0px 10px 0px !important;
                    }
                    .dbt {
                      padding: 8px !important;
                    }
                    .logo {
                      width: 100px;
                    }
                    .logo-block {
                      padding: 0px 0px 0px 25px !important;
                    }
                    .spacer1 {
                      padding: 30px !important;
                      background-color: white;
                    }
                    .new-episode {
                      padding: 25px 25px 0px 25px !important;
                    }
                    .episode-block {
                      padding: 0px 25px 25px 25px !important;
                    }
                    .episode {
                      font-size: 20px !important;
                      line-height: 1.3 !important;
                    }
                    .date {
                      text-align: left;
                      font-size: 12px;
                      padding: 20px 0px 0px 25px !important;
                    }
                    .main-title {
                      padding: 0px 0px 0px 25px !important;
                    }
                    .cover {
                      width: 90% !important;
                    }
                    .top-spacer {
                      padding: 0px 0px 0px 0px !important;
                      height: 15px !important;
                    }
                    .padd {
                      padding: 35px 0px 0px 0px !important;
                    }
                    .feedimg {
                      width: 75px !important;
                      padding: 20px 0px 15px 0px !important;
                    }
                    .nftext1 {
                      font-size: 15px !important;
                      line-height: 1.5 !important;
                      text-decoration: none !important;
                    }
                    .nftext2 {
                      font-size: 14px !important;
                      line-height: 18px !important;
                    }
                    .nfico {
                      width: 30px !important;
                    }
                    .nf {
                      text-align: center !important;
                    }
                    .nft {
                      font-size: 36px !important;
                    }
                    .nopad {
                      padding: 0 !important;
                    }
                    .divide-bot {}
                    .logobt {
                      width: 98px !important;
                    }
                    .fbic {
                      width: 20px !important;
                    }
                    .igic {
                      width: 20px !important;
                    }
                    .twic {
                      width: 25px !important;
                    }
                    p,
                    ul li,
                    ol li,
                    a {}
                    h1 {
                      font-size: 40px !important;
                      text-align: left;
                      line-height: 100% !important;
                    }
                    h2 {
                      font-size: 26px !important;
                      text-align: center;
                      line-height: 120% !important;
                    }
                    h3 {
                      font-size: 20px !important;
                      text-align: center;
                      line-height: 120% !important;
                    }
                    h1 a {
                      font-size: 30px !important;
                    }
                    h2 a {
                      font-size: 26px !important;
                    }
                    h3 a {
                      font-size: 20px !important;
                    }
                    .es-menu td a {
                      font-size: 16px !important;
                    }
                    .es-header-body p,
                    .es-header-body ul li,
                    .es-header-body ol li,
                    .es-header-body a {
                      font-size: 16px !important;
                    }
                    .es-footer-body p,
                    .es-footer-body ul li,
                    .es-footer-body ol li,
                    .es-footer-body a {
                      font-size: 16px !important;
                    }
                    .es-infoblock p,
                    .es-infoblock ul li,
                    .es-infoblock ol li,
                    .es-infoblock a {
                      font-size: 12px !important;
                    }
                    *[class="gmail-fix"] {
                      display: none !important;
                    }
                    .es-m-txt-c,
                    .es-m-txt-c h1,
                    .es-m-txt-c h2,
                    .es-m-txt-c h3 {
                      text-align: center !important;
                    }
                    .es-m-txt-r,
                    .es-m-txt-r h1,
                    .es-m-txt-r h2,
                    .es-m-txt-r h3 {
                      text-align: right !important;
                    }
                    .es-m-txt-l,
                    .es-m-txt-l h1,
                    .es-m-txt-l h2,
                    .es-m-txt-l h3 {
                      text-align: left !important;
                    }
                    .es-m-txt-r img,
                    .es-m-txt-c img,
                    .es-m-txt-l img {
                      display: inline !important;
                    }
                    .es-button-border {
                      display: block !important;
                    }
                    .es-btn-fw {
                      border-width: 10px 0px !important;
                      text-align: center !important;
                    }
                    .es-adaptive table,
                    .es-btn-fw,
                    .es-btn-fw-brdr,
                    .es-left,
                    .es-right {
                      width: 100% !important;
                    }
                    .es-content table,
                    .es-header table,
                    .es-footer table,
                    .es-content,
                    .es-footer,
                    .es-header {
                      width: 100% !important;
                      max-width: 600px !important;
                    }
                    .es-adapt-td {
                      display: block !important;
                      width: 100% !important;
                    }
                    .fbtb {
                      width: 20px !important;
                    }
                    .igtb {
                      width: 20px !important;
                    }
                    .twtb {
                      width: 25px !important;
                    }
                    #fbtb {
                      width: 20px !important;
                      margin-right: 15px;
                    }
                    #igtb {
                      width: 20px !important;
                      margin-right: 15px;
                    }
                    #twtb {
                      width: 25px !important;
                    }
                    .bottpadd {
                      padding: 0px 25px 0px 25px !important;
                    }
                    .uns {
                      text-align: center !important;
                    }
                    .adapt-img {
                      width: 100%;
                      height: auto !important;
                    }
                    .mainimg {
                      width: 120px !important;
                    }
                    .es-m-p0 {
                      padding: 0px !important;
                    }
                    .es-m-p0r {
                      padding-right: 0px !important;
                    }
                    .es-m-p0l {
                      padding-left: 0px !important;
                    }
                    .es-m-p0t {
                      padding-top: 0px !important;
                    }
                    .es-m-p0b {
                      padding-bottom: 0 !important;
                    }
                    .es-m-p20b {}
                    .es-mobile-hidden,
                    .es-hidden {
                      display: none !important;
                    }
                    tr.es-desk-hidden,
                    td.es-desk-hidden,
                    table.es-desk-hidden {
                      width: auto !important;
                      overflow: visible !important;
                      float: none !important;
                      max-height: inherit;
                      line-height: inherit;
                    }
                    tr.es-desk-hidden {
                      display: table-row !important;
                    }
                    table.es-desk-hidden {
                      display: table !important;
                    }
                    td.es-desk-menu-hidden {
                      display: table-cell !important;
                    }
                    .es-menu td {
                      width: 1% !important;
                    }
                    table.es-table-not-adapt,
                    .esd-block-html table {
                      width: auto !important;
                    }
                    table.es-social {
                      display: inline-block !important;
                    }
                    table.es-social td {
                      display: inline-block !important;
                    }
                    a.es-button,
                    button.es-button {
                      display: block !important;
                      border-left-width: 0px !important;
                      border-right-width: 0px !important;
                    }
                  }
                </style>
              </head>
              <body style="width:100%;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;background-color:#CCE1FF">
                <div class="es-wrapper-color" style="background-color:#CCE1FF;padding:10px">
            
                  <!--[if gte mso 9]>
                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                            <v:fill type="tile" color="#CCE1FF"></v:fill>
                        </v:background>
                    <![endif]-->
                  <table class="es-wrapper" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top" width="100%" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr style="border-collapse:collapse">
                        <td style="padding:0;Margin:0" valign="top">
                          <table class="es-content" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%" cellpadding="0" cellspacing="0" align="center">
                            <tbody>
                              <tr style="border-collapse:collapse">
                                <td style="padding:0;Margin:0" align="center">
                                  <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" align="center" cellpadding="0" cellspacing="0">
                                    <tbody>
                                      <tr style="border-collapse:collapse">
                                        <td style="padding:0;Margin:0;padding-bottom:10px" align="left">
                                          <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" cellpadding="0" cellspacing="0" width="100%">
                                            <tbody>
                                              <tr style="border-collapse:collapse">
                                                <td style="padding:0;Margin:0;width:600px" align="center" valign="top">
                                                  <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:16px;background-color:#FFFFFF" cellpadding="0" cellspacing="0" width="100%" bgcolor="#ffffff" role="presentation">
                                                    <tbody>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-bottom:20px;padding-top:35px;font-size:0px" align="center">
                                                          <img style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" src="https://storage.googleapis.com/zencastr-prod-assets/email/images/logo.png" alt />
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-top:40px;padding-bottom:40px;font-size:0px" align="center">
                                                          <img style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" src="https://storage.googleapis.com/zencastr-prod-assets/email/images/confirm%20email.png" alt />
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0" align="center">
                                                          <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:40px;font-family:poppins,sans-serif;line-height:60px;color:#333333">
                                                            <strong>Confirm your
                                                                                                            email</strong>
                                                          </p>
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-top:35px" align="center">
                                                          <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:22px;font-family:poppins,sans-serif;line-height:33px;color:#333333">
                                                            <strong>Hi&nbsp;${fullName}!</strong>
                                                          </p>
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-top:10px;padding-left:20px;padding-right:20px" align="center">
                                                          <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:18px;font-family:poppins,sans-serif;line-height:27px;color:#333333">
                                                            Thank you for signing up with
                                                            MPID!<br />You can click on below button
                                                            <br />to reset your password</p>
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-bottom:20px;padding-top:40px" align="center">
                                                          <span class="es-button-border" style="border-style:solid;border-color:#811630;background:#811630;border-width:0px;display:inline-block;border-radius:12px;width:auto">
                                                          <a class="es-button" style="mso-style-priority: 100 !important; text-decoration: none !important; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: poppins,sans-serif; font-size: 18px; color: #FFFFFF; border-style: solid; border-color: #811630; border-width: 15px 30px 15px 30px; display: inline-block; background: #811630; border-radius: 12px; font-weight: bold; font-style: normal; line-height: 22px; width: auto; text-align: center;" href=${check} target="_blank">Click here</a></span>
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-top:20px;padding-bottom:25px" align="center">
                                                          <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:poppins,sans-serif;line-height:21px;color:#999999">
                                                            Thanks,<br />The MPID Team
                                                          </p>
                                                        </td>
                                                      </tr>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px;font-size:0" align="center">
                                                          <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" border="0" width="100%" height="100%" cellpadding="0" cellspacing="0" role="presentation">
                                                            <tbody>
                                                              <tr style="border-collapse:collapse">
                                                                <td style="padding:0;Margin:0;border-bottom:0px solid #CCCCCC;background:none;height:1px;width:100%;margin:0px">
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                        <td class="esdev-adapt-off bottpadd" style="padding:0;Margin:0;padding-left:40px;padding-right:40px;background-color:#17181A;border-radius:16px" align="left" bgcolor="#17181A">
                                          <table class="esdev-mso-table" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:520px" cellpadding="0" cellspacing="0">
                                            <tbody>
                                              <tr style="border-collapse:collapse">
                                                <td class="esdev-mso-td" style="padding:0;Margin:0" valign="top">
                                                  <table class="es-left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left" cellpadding="0" cellspacing="0" align="left">
                                                    <tbody>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;width:370px;height:85px" align="center" valign="top">
                                                          <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:16px" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                                            <tbody>
                                                              <tr style="border-collapse:collapse">
                                                                <td style="padding:0;Margin:0;padding-left:5px;font-size:0px" align="left">
                                                                  <img class="adapt-img logobt" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;padding-top:35px" src="https://storage.googleapis.com/zencastr-prod-assets/email/images/logo%20full.png" alt />
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                        <td style="padding:0;Margin:0;width:20px">
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </td>
                                                <td class="esdev-mso-td" style="padding:0;Margin:0" valign="top">
                                                  <table class="es-left fbtb" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left" cellpadding="0" cellspacing="0" id="fbtb" align="left">
                                                    <tbody>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;width:30px" align="left">
                                                          <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                                            <tbody>
                                                              <tr style="border-collapse:collapse">
                                                                <td style="padding:0;Margin:0;padding-top:30px;font-size:0px" align="center">
                                                                  <a style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:14px;text-decoration:underline;color:#2CB543" target="_blank" href="https://click.pstmrk.it/2sm/www.facebook.com%2Fzencastr/eNeEGCYN/Lt9E/kAsdnC5FJc/ZW1haWwtdmVyaWZpY2F0aW9u"><img class="adapt-img fbic" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" src="https://storage.googleapis.com/zencastr-prod-assets/email/images/fb.png" alt /></a>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                        <td style="padding:0;Margin:0;width:20px">
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </td>
                                                <td class="esdev-mso-td" style="padding:0;Margin:0" valign="top">
                                                  <table class="es-left igtb" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left" cellpadding="0" cellspacing="0" id="igtb" align="left">
                                                    <tbody>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;width:30px" align="left">
                                                          <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                                            <tbody>
                                                              <tr style="border-collapse:collapse">
                                                                <td style="padding:0;Margin:0;padding-top:30px;font-size:0px" align="center">
                                                                  <a style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:14px;text-decoration:underline;color:#2CB543" target="_blank" href="https://click.pstmrk.it/2sm/www.instagram.com%2Fzencastr/edeEGCYN/Lt9E/RlXBirl1gH/ZW1haWwtdmVyaWZpY2F0aW9u"><img class="adapt-img igic" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" src="https://storage.googleapis.com/zencastr-prod-assets/email/images/insta.png" alt /></a>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                        <td style="padding:0;Margin:0;width:20px">
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </td>
                                                <td class="esdev-mso-td" style="padding:0;Margin:0" valign="top">
                                                  <table class="es-right twtb" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right" cellpadding="0" cellspacing="0" id="twtb" align="right">
                                                    <tbody>
                                                      <tr style="border-collapse:collapse">
                                                        <td style="padding:0;Margin:0;width:30px" align="left">
                                                          <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                                            <tbody>
                                                              <tr style="border-collapse:collapse">
                                                                <td style="padding:0;Margin:0;padding-top:30px;font-size:0px" align="center">
                                                                  <a style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:14px;text-decoration:underline;color:#2CB543" target="_blank" href="https://click.pstmrk.it/2sm/twitter.com%2Fzencastr/eteEGCYN/Lt9E/4l-QuPrNf0/ZW1haWwtdmVyaWZpY2F0aW9u"><img class="adapt-img twic" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" src="https://storage.googleapis.com/zencastr-prod-assets/email/images/tw.png" alt /></a>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
             
               </body>
            </html>`, // HTML body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log(error);
  }
}

module.exports = send;
