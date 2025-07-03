const createHttpError = require('http-errors');
const Joi = require('joi');
const { PrismaClient } = require("@prisma/client");
const formidable = require('formidable');
const fs = require('fs');
const prisma = require('../prisma/client');
const { v4: uuidv4 } = require('uuid');

async function create(req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
        .min(1)
        .max(30)
        .required(),

        description: Joi.string()
        .min(1)
        .max(500)
        .required(),

        profile_image: Joi.string()
        .optional(),
    });

    var { error, value } = schema.validate(req.body);

    if (error){
        return next(createHttpError(400, error.message));
    }

    try {
        var getChannel = await prisma.channel.findUnique({
            where: {
                name: value.name
            }
        });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
    
    if (getChannel){
        return next(createHttpError(409, "A channel with this name already exists!"));
    }

    value.ownerId = req.tokenData.userId;

    try {
        var channel = await prisma.channel.create({
            data: value
        });

        return res.status(200)
        .json({ message: "Channel created successfully!" });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function update(req, res, next) {
    const schema = Joi.object({
        id: Joi.number()
        .required(),

        name: Joi.string()
        .min(1)
        .max(30)
        .optional(),

        description: Joi.string()
        .min(1)
        .max(500)
        .optional(),

        profile_image: Joi.string()
        .optional(),
    });

    var { error, value } = schema.validate(req.body);

    if (error){
        return next(createHttpError(400, error.message));
    }

    try {
        const id = value.id;

        delete value.id;

        var channel = await prisma.channel.update({
            where: {
                id: id,
            },
            data: value
        });

        return res.status(200)
        .json({ message: "Channel updated successfully!" });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}
// async function images(req, res, next) {

//     const form = formidable({ multiples: true });

//     form.parse(req, (err, fields, files) => {
//         if (err) {
//         next(err);
//         return;
//         }
//         if (!files.image) {
//             console.log('No Image field on form');
//             next(createHttpError(400, 'No Image field on form'));
//         } else {
//             console.log(files.image.filepath);
//             var oldpath = files.image.filepath;
//             var newpath = './channelImage/' + req.query.id + '.png';
//             fs.copyFile(oldpath, newpath, function (err) {
//                 if (err) next(err);
//                 res.json({ message: "Image uploaded successfully!", data: newpath });
//                 res.end();
//             });
//         }
//     });
// }

async function images(req, res, next) {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        if (!files.image) {
            console.log('No Image field on form');
            next(createHttpError(400, 'No Image field on form'));
        } else {
            console.log(files.image.filepath);
            var oldpath = files.image.filepath;
            var uniqueId = uuidv4(); // Generate a unique GUID
            var newpath = './channelImage/' + uniqueId + '.png'; // Use the GUID for the new path
            fs.copyFile(oldpath, newpath, function (err) {
                if (err) next(err);
                res.json({ message: "Image uploaded successfully!", data: newpath });
                res.end();
            });
        }
    });
}

async function ownedList(req, res, next) {
    try {
        var getOwnedChannels = await prisma.channel.findMany({
            where: {
              ownerId: req.tokenData.userId
            }
        });

        return res.status(200)
        .json({ data: { results: getOwnedChannels } });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function dashboardInfo(req, res, next) {
    try {
        var getVideos = await prisma.video.findMany({
            where: {
                userId: req.tokenData.userId
            }
        });
        var getUserInfo = await prisma.user.findFirst({
            where: {
                id: req.tokenData.userId
            }
        });

        var availableSize;
        var packageType;
        if (getUserInfo.plan_selected == 1){
            availableSize = 53687091200;
            packageType = "Basic";
        } else if (getUserInfo.plan_selected == 2) {
            availableSize = 128849018880;
            packageType = "Professional";
        } else if (getUserInfo.plan_selected == 3) {
            availableSize = 214748364800;
            packageType = "Business";
        }

        var totalSize = getVideos.map((video) => { return video.size }).reduce((a, b) => a + b, 0);
        var storagePercentage = totalSize/availableSize * 100;
        
        return res.status(200)
        .json({ data: { storagePercentage, packageType } });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

module.exports = {
    create,
    update,
    images,
    ownedList,
    dashboardInfo
}