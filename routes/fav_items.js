/* eslint-disable max-len */
'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_KEY, (err, payload) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.claim = payload;

    next();
  });
};

router.get('/fav_items/:id', authorize, (req, res, next) => {
  const id = Number.parseInt(req.params.id);

  if (Number.isNaN(id)) {
    return next();
  }

  knex('fav_items')
    .select('items.image_path', 'fav_items.id')
    .innerJoin('items', 'fav_items.item_id', 'items.id')
    .where('fav_items.user_fav_id', id)
    .orderBy('items.id', 'ASC')
    .then((favItems) => {
      res.send(camelizeKeys(favItems));
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/fav_items', authorize, (req, res, next) => {
  const ownerId = Number.parseInt(req.body.ownerId);
  const itemId = Number.parseInt(req.body.itemId);
  const userFavId = Number.parseInt(req.body.userFavId);

  if (Number.isNaN(ownerId) || Number.isNaN(itemId) || Number.isNaN(userFavId)) {
    return next();
  }

  knex('fav_items').insert(decamelizeKeys({
    userId: ownerId,
    itemId,
    userFavId
  }), '*')
  .then((favorites) => {
    if (!favorites.length) {
      return next();
    }

    const fav = favorites[0];

    res.send(camelizeKeys(fav));
  })
  .catch((err) => {
    next(err);
  });
});

router.delete('/fav_items/:id', authorize, (req, res, next) => {
  const favId = Number.parseInt(req.params.id);

  if (Number.isNaN(favId)) {
    return next();
  }

  knex('fav_items')
    .del('*')
    .where('id', favId)
    .then((favorites) => {
      if (!favorites.length) {
        return next();
      }

      const favorite = favorites[0];

      delete favorite.id;

      res.send(camelizeKeys(favorite));
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
