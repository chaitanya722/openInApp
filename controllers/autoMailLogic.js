const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const path = require("path");

//folder name where the bot replied mails will be stored
const botFolder = "botMails";
// OAuth 2.0 scopes required for Gmail API
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://mail.google.com/",
  ];


const autoMailLogic = async (req, res) => {
// Authentication
  const auth = await authenticate({
    //path to credentials file
    keyfilePath: path.join(__dirname,'..', "credentials.json"),
    scopes: SCOPES,
  });

  const gmail = google.gmail({ version: "v1", auth });

  // Get the list of labels
  const response = await gmail.users.labels.list({
    userId: "me",
  });

  // Function to get unreplied messages
  async function getUnrepliedMessages(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    //finding unread messages
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      q: "is:unread",
    });
    //return msgs or empty array
    return response.data.messages || [];
  }

  // creating bot folder or label if it doesn't exist
  async function makeLabel(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    try {
      const response = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: botFolder,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      return response.data.id;
    } catch (error) {
      if (error.code === 409) {
        const response = await gmail.users.labels.list({
          userId: "me",
        });
        const label = response.data.labels.find(
          (label) => label.name === botFolder
        );
        return label.id;
      } else {
        throw error;
      }
    }
  }

  // auto reply bot logic
  async function sendMail() {
    const labelId = await makeLabel(auth);

    // Set interval to check for unreplied messages at random intervals of 45 to 120 seconds
    setInterval(async () => {
      const messages = await getUnrepliedMessages(auth);
      if (messages && messages.length > 0) {
        for (const message of messages) {
          const messageData = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
          });
        //   console.log(messageData.data);
        const email = messageData.data;
          const hasReplied = email.payload.headers.some(
            (header) => header.name === "In-Reply-To"
          );
            // console.log(hasReplied);
          if (!hasReplied) {
            const replyMessage = {
              userId: "me",
              requestBody: {
                raw: Buffer.from(
                  `To: ${
                    email.payload.headers.find(
                      (header) => header.name === "From"
                    ).value || ""
                  }\r\n` +
                    `Subject: Re: ${
                      email.payload.headers.find(
                        (header) => header.name === "Subject"
                      )?.value || ""
                    }\r\n` +
                    `Content-Type: text/plain; charset="UTF-8"\r\n` +
                    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                    `Thank you for reaching out to us. We will get back to you shortly.`
                ).toString("base64"),
              },
            };

            // Send mail
            await gmail.users.messages.send(replyMessage);

            // assigning labels and moving to botMails folder
            await gmail.users.messages.modify({
              userId: "me",
              id: message.id,
              requestBody: {
                addLabelIds: [labelId],
                removeLabelIds: ["INBOX"],
              },
            });
          }
        }
      }
    }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
  }

  sendMail();

  res.json({ "Authentication data": auth });
}

module.exports = { autoMailLogic };