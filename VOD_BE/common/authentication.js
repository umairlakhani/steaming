const { PrismaClient } = require("@prisma/client");
const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const authorization = (req, res, next) => {

  const token = req.headers.authorization.split(' ')[1];
  console.log(token,"check token")
  if (!token) {
    //   return res.sendStatus(403);
    return next(createHttpError(401, 'Not authenticated!'));
  }
  try {
    const data = jwt.verify(token, 'YOUR_SECRET_KEY');
    // Almost done
    req.tokenData = data;

    if (req.tokenData.userId !== undefined) {
      next();
    } else {
      return next(createHttpError(401, 'Not authenticated!'));
    }
  } catch {
    return next(createHttpError(401, 'Not authenticated!'));
  }
};

const authenticate = async (req, res, next) => {
  if (!req.body.tokenData) {
    return next(createHttpError());
  }
  console.log(req.body.tokenData,"req.body.tokenData")
  const { id, email, name, type, emailVerified, surname, dateOfBirth,profile_image,bucketId,stripeCustomerId,invoice_address,premiumUser } =
    req.body.tokenData;
  const token =  jwt.sign(
    {
      userId: id,
      userEmail: email,
      userName: name,
      userSurname: surname,
      userBirthDate: dateOfBirth,
      userType: type,
      emailVerify: emailVerified,
      profileImage:profile_image,
      bucketId,
      stripeCustomerId,
      invoice_address,
      premiumUser
    },
    'YOUR_SECRET_KEY',
  );
  return await res
    .cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: 'http://localhost:4200',
    })
    .status(200)
    .json({ message: 'Logged in successfully!', access_token: token });
};

module.exports = {
  authorization,
  authenticate,
};
