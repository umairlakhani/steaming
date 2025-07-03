const createHttpError = require('http-errors');
const Joi = require('joi');
const { PrismaClient } = require("@prisma/client");
const prisma = require('../prisma/client');

async function addEditorToChannel(req, res, next) {
    const schema = Joi.object({
        id: Joi.number()
        .required(),

        email: Joi.string()
        .email()
        .required()
    });

    var { error, value } = schema.validate(req.body);

    if (error){
        return next(createHttpError(400, error.message));
    }

    try {
        var getUser = await prisma.user.findFirst({
            where: {
                email: value.email
            }
        });
    } catch (error) {
        console.log(error)
        return next(createHttpError());
    }
    
    if (!getUser){
        return next(createHttpError(404, "There is no user with this email!"));
    }

    try {
        var getChannel = await prisma.channel.findFirst({
            where: {
                id: value.id
            }
        });
    } catch (error) {
        console.log(error)
        return next(createHttpError());
    }
    
    if (!getChannel){
        return next(createHttpError(404, "Channel not found!"));
    }

    try {
        var getEditor = await prisma.editors.findFirst({
            where: {
                channelId: value.id,
                userId: getUser.id
            }
        });
    } catch (error) {
        console.log(error)
        return next(createHttpError());
    }
    
    if (getEditor){
        return next(createHttpError(404, "This user is already an editor!"));
    }

    try {
        var editor = await prisma.editors.create({
            data: {
                channelId: value.id,
                userId: getUser.id
            }
        });

        return res.status(200)
        .json({ message: "Editor added successfully!" });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function removeEditorToChannel(req, res, next) {
    const schema = Joi.object({
        id: Joi.number()
        .required()
    });

    var { error, value } = schema.validate(req.body);

    if (error){
        return next(createHttpError(400, error.message));
    }

    try {
        var getEditor = await prisma.editors.findFirst({
            where: {
                id: value.id
            }
        });
    } catch (error) {
        console.log(error)
        return next(createHttpError());
    }
    
    if (!getEditor){
        return next(createHttpError(404, "Editor not found!"));
    }

    try {
        var editor = await prisma.editors.delete({
            where: {
                id: value.id
            }
        });

        return res.status(200)
        .json({ message: "Editor removed successfully!" });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function getEditorsPerChannel(req, res, next) {
    const schema = Joi.object({
        id: Joi.number()
        .required()
    });

    var { error, value } = schema.validate(req.body);

    if (error){
        return next(createHttpError(400, error.message));
    }

    try {
        var getEditor = await prisma.editors.findMany({
            where: {
                userId: value.id
            }
        });

        return res.status(200)
        .json({ data: { results: getEditor } });
    } catch (error) {
        console.log(error)
        return next(createHttpError());
    }
}

module.exports = {
    addEditorToChannel,
    removeEditorToChannel,
    getEditorsPerChannel
}