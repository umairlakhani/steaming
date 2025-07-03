const { PrismaClient, Prisma } = require("@prisma/client");
const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const authorization = (req, res, next) => {

  const token = req.headers.authorization.split(' ')[1];
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

module.exports = {
  authorization,
};
