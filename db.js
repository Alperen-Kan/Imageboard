const spicedPg = require('spiced-pg');

const db = spicedPg(
    `postgres://postgres:postgres@localhost:5432/imageboard`
);

exports.getImages = () => {
    return db.query(
        `
        SELECT *, (
            SELECT id FROM images
            ORDER BY id ASC
            LIMIT 1
        ) AS "lowestId" FROM images
        ORDER BY id DESC
        LIMIT 9
        `
    );
};

exports.getImagesByTag = (tag) => {
    return db.query(
        `
        SELECT images.*, tags.tag, tags.image_id,
            (
                SELECT images.id FROM images
                JOIN tags
                ON images.id = tags.image_id
                WHERE tags.tag = $1
                ORDER BY images.id ASC
                LIMIT 1
            ) AS "lowestId"
        FROM images
        JOIN tags
        ON images.id = tags.image_id
        WHERE tags.tag = $1
        ORDER BY id DESC
        LIMIT 9
        `,
        [tag]
    );
};

exports.getMoreImages = lastId => {
    return db.query(
        `
        SELECT *, (
            SELECT id FROM images
            ORDER BY id ASC
            LIMIT 1
        ) AS "lowestId" FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 9
        `,
        [lastId]
    );
};

exports.getMoreImagesByTag = (tag, lastId) => {
    return db.query(
        `
        SELECT images.*, tags.tag, tags.image_id,
            (
                SELECT images.id FROM images
                JOIN tags
                ON images.id = tags.image_id
                WHERE tags.tag = $1
                ORDER BY images.id ASC
                LIMIT 1
            ) AS "lowestId"
        FROM images
        JOIN tags
        ON images.id = tags.image_id
        WHERE tags.tag = $1
        WHERE images.id < $2
        ORDER BY id DESC
        LIMIT 9
        `,
        [tag, lastId]
    );
};

exports.insertImage = (url, username, title, description) => {
    return db.query(
        `
        INSERT INTO images (url, username, title, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [url, username, title, description]
    );
};

exports.deleteImage = (imageId) => {
    return db.query(
        `
        DELETE FROM images
        WHERE id = $1
        `,
        [imageId]
    );
};

exports.getImage = (imageId) => {
    return db.query(
        `
        SELECT * FROM (
            SELECT *,
            lag(id, 1) OVER (ORDER BY id) AS "previd",
            lead(id, 1) OVER (ORDER BY id) AS "nextid"
            FROM images
        ) x
        WHERE id = $1
        `,
        [imageId]
    );
};

exports.getImageByTag = (imageId, tag) => {
    return db.query(
        `
        SELECT *
        FROM (
            SELECT images.*,
                lag(images.id, 1) OVER (ORDER BY images.id) AS "previd",
                lead(images.id, 1) OVER (ORDER BY images.id) AS "nextid"
            FROM images
            JOIN tags
            ON images.id = tags.image_id
            WHERE tags.tag = $2
            ORDER BY images.id DESC
        ) x
        WHERE id = $1
        `,
        [imageId, tag]
    );
};

exports.getComments = (imageId) => {
    return db.query(
        `
        SELECT * FROM comments
        WHERE image_id = $1
        `,
        [imageId]
    );
};

exports.insertComment = (comment, username, imageId) => {
    return db.query(
        `
        INSERT INTO comments (comment, username, image_id)
        VALUES ($1, $2, $3)
        `,
        [username, comment, imageId]
    );
};

exports.insertTags = (tag, imageId) => {
    return db.query(
        `
        INSERT INTO tags (tag, image_id)
        VALUES ($1, $2)
        `,
        [tag, imageId]
    );
};

exports.getTags = (imageId) => {
    return db.query(
        `
        SELECT tag FROM tags
        WHERE image_id = $1
        `,
        [imageId]
    );
};

// exports.getImagesByTag = (tag) => {
//     return db.query(
//         `
//         SELECT image_id FROM tags
//         WHERE LOWER(tag) = LOWER($1)
//         `,
//         [tag]
//     );
// };
