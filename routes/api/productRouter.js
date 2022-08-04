require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const productRouter = express.Router();
const authenticate = require('../../authenticate');
const cors = require('../cors');
const Products = require('../../models/products');
const multer = require('multer');

productRouter.use(bodyParser.json());
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'uploads',
        allowedFormats: ['jpeg', 'png', 'jpg' , 'gif']
    }
});


const upload = multer({ storage});
productRouter
  .route('/')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, (req, res, next) => {
    Products.find(req.query)
      .populate('owner')
      .sort({ views: -1 })
      .then(
        products => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(products);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })

  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    upload.array('images', 4),
    (req, res, next) => {
      console.log(req.files[0].path);
      console.log(req.body);
      Products.create({
        ...req.body,
        images: [
          req.files[0]
            ? req.files[0].path
            : 'client/public/uploads/Not_available.jpg',
          req.files[1] ? req.files[1].path : '',
          req.files[2] ? req.files[2].path : '',
          req.files[3] ? req.files[3].path : ''
        ],
        owner: req.user._id
      })
        .then(
          product => {
            Products.findById(product._id)
              .populate('owner')
              .then(
                product => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(product);
                },
                err => next(err)
              )

              .catch(err => next(err));
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end('PUT operation not supported on /products');
    }
  )

  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end('DELETE operation not supported on /products');
    }
  );

productRouter
  .route('/:productId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  })
  .get(cors.corsWithOptions, (req, res, next) => {
    Products.findById(req.params.productId)
      .populate('owner')
      .then(
        product => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(product);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })

  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end(
        'POST operation not supported on /products/' + req.params.productId
      );
    }
  )

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findByIdAndUpdate(
      req.params.productId,
      {
        $set: req.body
      },
      { new: true }
    )
      .populate('owner')
      .then(
        product => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(product);
        },
        err => next(err)
      )
      .catch(err => res.status(400).json({ success: false }));
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Products.findByIdAndRemove(req.params.productId)
      .then(
        resp => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ _id: req.params.productId, success: true });
        },
        err => next(err)
      )
      .catch(err => res.status(400).json({ success: false }));
  });

productRouter
  .route('/approve/:productId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Products.findByIdAndUpdate(
        req.params.productId,
        {
          $set: { approved: true }
        },
        { new: true }
      )
        .populate('owner')
        .then(
          product => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(product);
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  );

productRouter
  .route('/views/:productId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    console.log({ views: req.body.views });
    Products.findByIdAndUpdate(
      req.params.productId,
      {
        $set: { views: req.body.views }
      },
      { new: true }
    )
      .populate('owner')
      .then(
        product => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(product);
        },
        err => next(err)
      )
      .catch(err => next(err));
  });

module.exports = productRouter;
