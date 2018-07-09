'use strict';

/**
 * Copyright 2018 Universal Health Coin
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
 * IN THE SOFTWARE.
 * 
 * Developed on behalf of Universal Health Coin by the Mohawk mHealth & eHealth Development & Innovation Centre (MEDIC)
 */

const uhx = require("../uhx"),
    skipper = require("skipper"),
    skipperS3 = require('skipper-s3'),
    extend = require('extend'),
    exception = require("../exception");

module.exports = class ObjectStorage {
    /**
     * @method
     * @summary Uploads an image to the object storage
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @returns Upload status
     */
    async uploadProfileImage(req, res) {
        var s3config = uhx.Config.objectStorage; // Load storage config
        if (!req.file || req.file.name == "") { // No file supplied
            var result = new exception.Exception("Missing file", exception.ErrorCodes.MISSING_PAYLOAD);
        } else {
            var file = req.file('file');
            var contentType = file._files[0].stream.headers['content-type'];
            if (contentType != 'image/png' && contentType != 'image/gif' && contentType != 'image/jpeg') { // Invalid file type
                var result = new exception.Exception("File type provided is not supported", exception.ErrorCodes.NOT_SUPPORTED);
            } else if (file._files[0].stream.byteCount <= 4096) { // File too small
                var result = new exception.Exception("File size must be larger than 4KB", exception.ErrorCodes.NOT_SUPPORTED);
            } else if (file._files[0].stream.byteCount > uhx.Config.objectStorage.maxFileSize) { // File too big
                var result = new exception.Exception("File size is too large", exception.ErrorCodes.NOT_SUPPORTED);
            } else {
                var filename = `${req.params.uid}.png`; // Save image as a png
                var options = extend({}, s3config, {
                    adapter: skipperS3,
                    headers: {
                        'x-amz-acl': 'private'
                    },
                    saveAs: filename,
                    maxFileSize: uhx.Config.objectStorage.maxFileSize
                });
                try {
                    // Upload
                    file.upload(options);
                    console.log(`Image upload for ${req.params.uid} succeeded.`);
                    var result = {};
                    result.message = `Image uploaded successfully.`;
                    result.filename = filename;
                    result.contentType = contentType;
                } catch (ex) {
                    console.log(`Image upload for ${req.params.uid} failed.`);
                    var result = new exception.Exception("Error uploading image", exception.ErrorCodes.UNKNOWN, ex);
                }
            }
        }
        return result;

    }


    /**
     * @method
     * @summary Get a profile image by filename
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @returns Image read stream
     */
    async getProfileImage(req, res) {

        var s3config = uhx.Config.objectStorage; // Storage config
        var adapter = skipperS3(s3config);
        
        try {
            var stream = adapter.read(`${req.params.uid}.png`); // Get image
            stream.setEncoding('base64');
            return stream;
        } catch (ex) {
            return false;
        }
    }

}