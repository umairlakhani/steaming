function generateStreamKey() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let streamKey = "";
  for (let i = 0; i < 10; i++) {
    streamKey += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return streamKey;
}

module.exports = generateStreamKey;
